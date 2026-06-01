param()

$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$envFilePath = Join-Path $serverDir '.env.local-experiment'

function Read-EnvMap {
  param([string]$FilePath)

  $map = @{}
  if (-not (Test-Path $FilePath)) {
    return $map
  }

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

function Resolve-InternalServerPath {
  param([string]$PathValue)

  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    return ''
  }

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }

  return [System.IO.Path]::GetFullPath((Join-Path $serverDir $PathValue))
}

function Get-DatabasePort {
  param(
    $EnvMap,
    [int]$Fallback = 55432
  )

  $databaseUrl = Get-EnvValue -EnvMap $EnvMap -Key 'KPI_DATABASE_URL'
  if (-not $databaseUrl) {
    return $Fallback
  }

  try {
    $uri = [Uri]$databaseUrl
    if ($uri.Port -gt 0) {
      return $uri.Port
    }
  } catch {
    return $Fallback
  }

  return $Fallback
}

function Resolve-PostgresBinDir {
  param($EnvMap)

  $configured = Resolve-InternalServerPath (Get-EnvValue -EnvMap $EnvMap -Key 'KPI_POSTGRES_BIN_DIR')
  $candidates = @(
    $configured,
    (Join-Path $serverDir 'var\local-experiment\tools\postgresql-17.10-1\pgsql\bin'),
    (Join-Path $serverDir 'var\local-experiment\tools\postgresql-17.9-3\pgsql\bin'),
    'C:\Program Files\PostgreSQL\17\bin',
    'C:\Program Files\PostgreSQL\16\bin'
  ) | Where-Object { $_ }

  foreach ($candidate in $candidates) {
    if (Test-Path (Join-Path $candidate 'pg_ctl.exe')) {
      return $candidate
    }
  }

  return $candidates[0]
}

function Assert-CommandPath {
  param([string]$PathToCheck)

  if (-not (Test-Path $PathToCheck)) {
    throw "Required command was not found: $PathToCheck"
  }
}

function Assert-DataDirReadyForInit {
  param([string]$DataDir)

  $versionFile = Join-Path $DataDir 'PG_VERSION'
  if (Test-Path $versionFile) {
    return
  }

  if (-not (Test-Path $DataDir)) {
    return
  }

  $entries = Get-ChildItem -Force -LiteralPath $DataDir -ErrorAction SilentlyContinue
  if ($entries.Count -gt 0) {
    throw "PostgreSQL data directory exists but is not an initialized cluster: $DataDir"
  }
}

function Initialize-PostgresClusterIfMissing {
  param(
    [string]$DataDir,
    [string]$InitdbPath,
    $EnvMap
  )

  if (Test-Path (Join-Path $DataDir 'PG_VERSION')) {
    return
  }

  Assert-DataDirReadyForInit -DataDir $DataDir

  $postgresUser = Get-EnvValue -EnvMap $EnvMap -Key 'KPI_POSTGRES_SUPERUSER_USERNAME' -Fallback 'postgres'
  $postgresPassword = Get-EnvValue -EnvMap $EnvMap -Key 'KPI_POSTGRES_SUPERUSER_PASSWORD' -Fallback 'postgres'
  if (-not $postgresUser) {
    throw 'KPI_POSTGRES_SUPERUSER_USERNAME is empty.'
  }
  if (-not $postgresPassword) {
    throw 'KPI_POSTGRES_SUPERUSER_PASSWORD is empty.'
  }

  $postgresDir = Split-Path -Parent $DataDir
  New-Item -ItemType Directory -Force -Path $postgresDir | Out-Null
  $passwordFile = Join-Path $postgresDir 'postgres-init.password.tmp'
  Set-Content -Path $passwordFile -Value $postgresPassword -Encoding ascii -NoNewline
  try {
    & $InitdbPath `
      -D $DataDir `
      -U $postgresUser `
      "--pwfile=$passwordFile" `
      --auth-local=scram-sha-256 `
      --auth-host=scram-sha-256 `
      --encoding=UTF8
  } finally {
    Remove-Item -LiteralPath $passwordFile -ErrorAction SilentlyContinue
  }
}

$envMap = Read-EnvMap -FilePath $envFilePath
$postgresBinDir = Resolve-PostgresBinDir -EnvMap $envMap
$initdbPath = Join-Path $postgresBinDir 'initdb.exe'
$pgCtlPath = Join-Path $postgresBinDir 'pg_ctl.exe'
$pgIsReadyPath = Join-Path $postgresBinDir 'pg_isready.exe'
$postgresDataDir = Resolve-InternalServerPath (Get-EnvValue -EnvMap $envMap -Key 'KPI_POSTGRES_DATA_DIR' -Fallback './var/local-experiment/postgres/data')
$postgresLogFile = Join-Path (Split-Path -Parent $postgresDataDir) 'logs\postgres.log'
$postgresPort = Get-DatabasePort -EnvMap $envMap

function Test-PostgresReady {
  & $pgIsReadyPath -h 127.0.0.1 -p $postgresPort 2>$null | Out-Null
  return ($LASTEXITCODE -eq 0)
}

Assert-CommandPath -PathToCheck $initdbPath
Assert-CommandPath -PathToCheck $pgCtlPath
Assert-CommandPath -PathToCheck $pgIsReadyPath

Initialize-PostgresClusterIfMissing -DataDir $postgresDataDir -InitdbPath $initdbPath -EnvMap $envMap

& $pgCtlPath -D $postgresDataDir status 2>$null | Out-Null
if ($LASTEXITCODE -eq 0 -or (Test-PostgresReady)) {
  Write-Host "Local KPI PostgreSQL is already running on port $postgresPort."
  exit 0
}

$postgresLogDir = Split-Path -Parent $postgresLogFile
New-Item -ItemType Directory -Force -Path $postgresLogDir | Out-Null

& $pgCtlPath -D $postgresDataDir -l $postgresLogFile -o "-p $postgresPort" start
$startExitCode = $LASTEXITCODE
if ($startExitCode -ne 0 -and (Test-PostgresReady)) {
  Write-Warning "pg_ctl start returned exit code $startExitCode, but PostgreSQL is already accepting connections on port $postgresPort."
  exit 0
}

$deadline = (Get-Date).AddSeconds(20)
while ((Get-Date) -lt $deadline) {
  & $pgIsReadyPath -h 127.0.0.1 -p $postgresPort 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Local KPI PostgreSQL started on port $postgresPort."
    exit 0
  }
  Start-Sleep -Milliseconds 500
}

throw "Local KPI PostgreSQL did not become ready in time."
