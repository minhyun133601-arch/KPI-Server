param(
  [switch]$StartServer,
  [switch]$BootstrapOwner,
  [switch]$ForceRewriteEnv
)

$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$varDir = Join-Path $serverDir 'var'
$centralDir = Join-Path $varDir 'central-runtime'
$postgresDir = Join-Path $centralDir 'postgres'
$postgresDataDir = Join-Path $postgresDir 'data'
$postgresLogDir = Join-Path $postgresDir 'logs'
$cloudflaredDir = Join-Path $centralDir 'cloudflared'
$toolsDir = Join-Path $centralDir 'tools'
$envFilePath = Join-Path $serverDir '.env.production.local'

$postgresBinDir = 'C:\Program Files\PostgreSQL\17\bin'
$initdbPath = Join-Path $postgresBinDir 'initdb.exe'
$pgCtlPath = Join-Path $postgresBinDir 'pg_ctl.exe'
$pgIsReadyPath = Join-Path $postgresBinDir 'pg_isready.exe'
$psqlPath = Join-Path $postgresBinDir 'psql.exe'

function Assert-CommandPath {
  param([string]$PathToCheck)
  if (-not (Test-Path $PathToCheck)) {
    throw "Required command was not found: $PathToCheck"
  }
}

function Convert-ToAbsolutePath {
  param(
    [string]$BaseDir,
    [string]$PathValue
  )

  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    return [System.IO.Path]::GetFullPath((Join-Path $BaseDir 'var'))
  }

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }

  return [System.IO.Path]::GetFullPath((Join-Path $BaseDir $PathValue))
}

function Read-EnvMap {
  param([string]$FilePath)

  if (-not (Test-Path $FilePath)) {
    throw "Env file was not found: $FilePath"
  }

  $map = @{}
  foreach ($line in Get-Content -Path $FilePath -Encoding utf8) {
    $trimmed = ([string]$line).Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) {
      continue
    }

    $separatorIndex = $trimmed.IndexOf('=')
    if ($separatorIndex -le 0) {
      continue
    }

    $key = $trimmed.Substring(0, $separatorIndex).Trim()
    if (-not $key) {
      continue
    }

    $value = $trimmed.Substring($separatorIndex + 1).Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $map[$key] = $value
  }

  return $map
}

function Get-EnvValue {
  param(
    $EnvMap,
    [string]$Key,
    [string]$Fallback = ''
  )

  if ($EnvMap.ContainsKey($Key)) {
    return ([string]$EnvMap[$Key]).Trim()
  }
  return $Fallback
}

function Require-EnvValue {
  param(
    $EnvMap,
    [string]$Key
  )

  $value = Get-EnvValue -EnvMap $EnvMap -Key $Key
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "$Key is missing in .env.production.local."
  }
  return $value
}

function Assert-NotPlaceholderSecret {
  param(
    [string]$Key,
    [string]$Value
  )

  $normalized = $Value.Trim().ToLowerInvariant()
  $placeholders = @(
    'change-me',
    'change-this-before-production',
    'dev-only-change-me',
    'replace-with-long-random-secret',
    'replace-with-postgres-superuser-password',
    'replace-with-initial-owner-password'
  )

  if ($placeholders -contains $normalized) {
    throw "$Key still contains a placeholder value."
  }
}

function Convert-DatabaseUrl {
  param([string]$DatabaseUrl)

  $uri = [Uri]$DatabaseUrl
  if ($uri.Scheme -notin @('postgres', 'postgresql')) {
    throw "Unsupported database URL scheme: $($uri.Scheme)"
  }

  $user = ''
  $password = ''
  if (-not [string]::IsNullOrWhiteSpace($uri.UserInfo)) {
    $userParts = $uri.UserInfo.Split(':', 2)
    $user = [Uri]::UnescapeDataString($userParts[0])
    if ($userParts.Length -gt 1) {
      $password = [Uri]::UnescapeDataString($userParts[1])
    }
  }

  $databaseName = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrWhiteSpace($databaseName)) {
    throw 'Database name is missing in KPI_DATABASE_URL.'
  }
  if ([string]::IsNullOrWhiteSpace($user) -or [string]::IsNullOrWhiteSpace($password)) {
    throw 'Database username or password is missing in KPI_DATABASE_URL.'
  }

  return [ordered]@{
    host = $uri.Host
    port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
    user = $user
    password = $password
    databaseName = $databaseName
  }
}

function Assert-LocalDatabaseHost {
  param([string]$HostName)

  $normalized = $HostName.Trim().ToLowerInvariant()
  if ($normalized -notin @('127.0.0.1', 'localhost', '::1')) {
    throw "initialize-central-runtime.ps1 expects KPI_DATABASE_URL to point at the local PostgreSQL runtime, not $HostName."
  }
}

function Quote-SqlLiteral {
  param([string]$Value)
  return "'" + $Value.Replace("'", "''") + "'"
}

function Quote-SqlIdentifier {
  param([string]$Value)
  return '"' + $Value.Replace('"', '""') + '"'
}

function Wait-ForPostgres {
  param(
    [string]$HostName,
    [int]$Port,
    [int]$TimeoutSeconds = 20
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $result = & $pgIsReadyPath -h $HostName -p $Port 2>$null
    if ($LASTEXITCODE -eq 0) {
      return
    }
    Start-Sleep -Milliseconds 500
  }

  throw "PostgreSQL on port $Port did not become ready in time."
}

function Test-PostgresReady {
  param(
    [string]$HostName,
    [int]$Port
  )

  & $pgIsReadyPath -h $HostName -p $Port 2>$null | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Ensure-PostgresStarted {
  param(
    [string]$HostName,
    [int]$Port,
    [string]$LogFile
  )

  & $pgCtlPath -D $postgresDataDir status 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    return
  }

  if (Test-PostgresReady -HostName $HostName -Port $Port) {
    Write-Warning "PostgreSQL is already accepting connections on port $Port even though pg_ctl status did not report it as running."
    return
  }

  & $pgCtlPath -D $postgresDataDir -l $LogFile -o "-p $Port" start
  $startExitCode = $LASTEXITCODE
  if ($startExitCode -eq 0) {
    return
  }

  try {
    Wait-ForPostgres -HostName $HostName -Port $Port -TimeoutSeconds 10
    Write-Warning "pg_ctl start returned exit code $startExitCode, but PostgreSQL became ready on port $Port."
  } catch {
    throw "Local KPI PostgreSQL failed to start cleanly on port $Port (pg_ctl exit code $startExitCode)."
  }
}

function Invoke-Psql {
  param(
    [string]$HostName,
    [int]$Port,
    [string]$Username,
    [string]$Password,
    [string]$Database,
    [string]$Sql
  )

  $previousPgPassword = $env:PGPASSWORD
  try {
    if ([string]::IsNullOrEmpty($Password)) {
      Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    } else {
      $env:PGPASSWORD = $Password
    }

    $output = & $psqlPath `
      -v ON_ERROR_STOP=1 `
      -h $HostName `
      -p $Port `
      -U $Username `
      -d $Database `
      -tAc $Sql 2>&1
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      $message = ($output | ForEach-Object { [string]$_ }) -join [Environment]::NewLine
      throw "psql failed with exit code $exitCode. $message"
    }
    return (($output | ForEach-Object { [string]$_ }) -join [Environment]::NewLine)
  } finally {
    if ($null -eq $previousPgPassword) {
      Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    } else {
      $env:PGPASSWORD = $previousPgPassword
    }
  }
}

function Wait-ForHttpEndpoint {
  param(
    [string]$Uri,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-RestMethod -Uri $Uri -Method Get | Out-Null
      return
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  throw "HTTP endpoint did not become ready in time: $Uri"
}

function Ensure-AppDatabaseProvisioned {
  param(
    $DatabaseConnection,
    [string]$PostgresSuperuser,
    [string]$PostgresPassword
  )

  if ([string]::IsNullOrWhiteSpace($PostgresPassword)) {
    try {
      Invoke-Psql `
        -HostName $DatabaseConnection.host `
        -Port $DatabaseConnection.port `
        -Username $DatabaseConnection.user `
        -Password $DatabaseConnection.password `
        -Database $DatabaseConnection.databaseName `
        -Sql 'select 1;' | Out-Null
      Write-Warning 'KPI_POSTGRES_SUPERUSER_PASSWORD is missing; existing app database connection is valid, so role/database provisioning was skipped.'
      return
    } catch {
      throw 'KPI_POSTGRES_SUPERUSER_PASSWORD is required to initialize a new or incomplete local PostgreSQL runtime.'
    }
  }

  Assert-NotPlaceholderSecret -Key 'KPI_POSTGRES_SUPERUSER_PASSWORD' -Value $PostgresPassword

  $appUserLiteral = Quote-SqlLiteral -Value $DatabaseConnection.user
  $appUserIdentifier = Quote-SqlIdentifier -Value $DatabaseConnection.user
  $appPasswordLiteral = Quote-SqlLiteral -Value $DatabaseConnection.password
  $appDatabaseLiteral = Quote-SqlLiteral -Value $DatabaseConnection.databaseName
  $appDatabaseIdentifier = Quote-SqlIdentifier -Value $DatabaseConnection.databaseName

  $roleExists = (Invoke-Psql `
      -HostName $DatabaseConnection.host `
      -Port $DatabaseConnection.port `
      -Username $PostgresSuperuser `
      -Password $PostgresPassword `
      -Database 'postgres' `
      -Sql "select 1 from pg_roles where rolname = $appUserLiteral;").Trim()
  if ($roleExists -ne '1') {
    Invoke-Psql `
      -HostName $DatabaseConnection.host `
      -Port $DatabaseConnection.port `
      -Username $PostgresSuperuser `
      -Password $PostgresPassword `
      -Database 'postgres' `
      -Sql "create role $appUserIdentifier login password $appPasswordLiteral;" | Out-Null
  } else {
    Invoke-Psql `
      -HostName $DatabaseConnection.host `
      -Port $DatabaseConnection.port `
      -Username $PostgresSuperuser `
      -Password $PostgresPassword `
      -Database 'postgres' `
      -Sql "alter role $appUserIdentifier with login password $appPasswordLiteral;" | Out-Null
  }

  $dbExists = (Invoke-Psql `
      -HostName $DatabaseConnection.host `
      -Port $DatabaseConnection.port `
      -Username $PostgresSuperuser `
      -Password $PostgresPassword `
      -Database 'postgres' `
      -Sql "select 1 from pg_database where datname = $appDatabaseLiteral;").Trim()
  if ($dbExists -ne '1') {
    Invoke-Psql `
      -HostName $DatabaseConnection.host `
      -Port $DatabaseConnection.port `
      -Username $PostgresSuperuser `
      -Password $PostgresPassword `
      -Database 'postgres' `
      -Sql "create database $appDatabaseIdentifier owner $appUserIdentifier;" | Out-Null
  } else {
    Invoke-Psql `
      -HostName $DatabaseConnection.host `
      -Port $DatabaseConnection.port `
      -Username $PostgresSuperuser `
      -Password $PostgresPassword `
      -Database 'postgres' `
      -Sql "alter database $appDatabaseIdentifier owner to $appUserIdentifier;" | Out-Null
  }
}

if ($ForceRewriteEnv) {
  throw 'ForceRewriteEnv is no longer supported. Keep one portable env file and copy it to kpi-runtime/internal-server/.env.production.local.'
}

Assert-CommandPath -PathToCheck $initdbPath
Assert-CommandPath -PathToCheck $pgCtlPath
Assert-CommandPath -PathToCheck $pgIsReadyPath
Assert-CommandPath -PathToCheck $psqlPath

$envMap = Read-EnvMap -FilePath $envFilePath
$databaseUrl = Require-EnvValue -EnvMap $envMap -Key 'KPI_DATABASE_URL'
$cookieSecret = Require-EnvValue -EnvMap $envMap -Key 'KPI_COOKIE_SECRET'
$databaseConnection = Convert-DatabaseUrl -DatabaseUrl $databaseUrl
Assert-LocalDatabaseHost -HostName $databaseConnection.host
Assert-NotPlaceholderSecret -Key 'KPI_COOKIE_SECRET' -Value $cookieSecret
Assert-NotPlaceholderSecret -Key 'KPI_DATABASE_URL password' -Value $databaseConnection.password

$postgresSuperuser = Get-EnvValue -EnvMap $envMap -Key 'KPI_POSTGRES_SUPERUSER_USERNAME' -Fallback 'postgres'
$postgresPassword = Get-EnvValue -EnvMap $envMap -Key 'KPI_POSTGRES_SUPERUSER_PASSWORD'
$storageRootValue = Get-EnvValue -EnvMap $envMap -Key 'KPI_STORAGE_ROOT' -Fallback './var/prod'
$prodStorageDir = Convert-ToAbsolutePath -BaseDir $serverDir -PathValue $storageRootValue
$serverPortValue = Get-EnvValue -EnvMap $envMap -Key 'KPI_SERVER_PORT' -Fallback '3100'
$serverPort = 3100
if (-not [int]::TryParse($serverPortValue, [ref]$serverPort) -or $serverPort -le 0) {
  $serverPort = 3100
}

New-Item -ItemType Directory -Force -Path $varDir, $centralDir, $postgresDir, $postgresLogDir, $cloudflaredDir, $toolsDir, $prodStorageDir | Out-Null

if (-not (Test-Path (Join-Path $postgresDataDir 'PG_VERSION'))) {
  if ([string]::IsNullOrWhiteSpace($postgresPassword)) {
    throw 'KPI_POSTGRES_SUPERUSER_PASSWORD is required before creating the local PostgreSQL cluster.'
  }
  Assert-NotPlaceholderSecret -Key 'KPI_POSTGRES_SUPERUSER_PASSWORD' -Value $postgresPassword

  $tempPasswordFile = Join-Path $postgresDir 'postgres-init.password.tmp'
  Set-Content -Path $tempPasswordFile -Value $postgresPassword -Encoding ascii -NoNewline
  try {
    & $initdbPath `
      -D $postgresDataDir `
      -U $postgresSuperuser `
      --pwfile=$tempPasswordFile `
      --auth-local=scram-sha-256 `
      --auth-host=scram-sha-256 `
      --encoding=UTF8
  } finally {
    Remove-Item -Path $tempPasswordFile -ErrorAction SilentlyContinue
  }
}

$postgresLogFile = Join-Path $postgresLogDir 'postgres.log'
Ensure-PostgresStarted -HostName $databaseConnection.host -Port $databaseConnection.port -LogFile $postgresLogFile
Wait-ForPostgres -HostName $databaseConnection.host -Port $databaseConnection.port
Ensure-AppDatabaseProvisioned `
  -DatabaseConnection $databaseConnection `
  -PostgresSuperuser $postgresSuperuser `
  -PostgresPassword $postgresPassword

if ($StartServer) {
  & (Join-Path $PSScriptRoot 'start-server.ps1') -Environment Production
  Wait-ForHttpEndpoint -Uri "http://127.0.0.1:$serverPort/api/health"
}

if ($BootstrapOwner) {
  Wait-ForHttpEndpoint -Uri "http://127.0.0.1:$serverPort/api/bootstrap/status"
  $status = Invoke-RestMethod -Uri "http://127.0.0.1:$serverPort/api/bootstrap/status" -Method Get
  if (-not $status.ownerExists) {
    $ownerUsername = Require-EnvValue -EnvMap $envMap -Key 'KPI_INITIAL_OWNER_USERNAME'
    $ownerPassword = Require-EnvValue -EnvMap $envMap -Key 'KPI_INITIAL_OWNER_PASSWORD'
    $ownerDisplayName = Get-EnvValue -EnvMap $envMap -Key 'KPI_INITIAL_OWNER_DISPLAY_NAME' -Fallback $ownerUsername
    Assert-NotPlaceholderSecret -Key 'KPI_INITIAL_OWNER_PASSWORD' -Value $ownerPassword

    $body = @{
      username = $ownerUsername
      displayName = $ownerDisplayName
      password = $ownerPassword
    } | ConvertTo-Json

    Invoke-RestMethod `
      -Uri "http://127.0.0.1:$serverPort/api/bootstrap/owner" `
      -Method Post `
      -ContentType 'application/json' `
      -Body $body | Out-Null
  } else {
    Write-Host 'Owner account already exists; bootstrap skipped.'
  }
}

Write-Host 'Initialized central runtime.'
Write-Host "Server dir: $serverDir"
Write-Host "Env file: $envFilePath"
Write-Host "PostgreSQL data: $postgresDataDir"
Write-Host "PostgreSQL port: $($databaseConnection.port)"
Write-Host "Storage root: $prodStorageDir"
Write-Host "Cloudflared dir: $cloudflaredDir"
