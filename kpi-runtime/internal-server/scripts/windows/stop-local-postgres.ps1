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

$envMap = Read-EnvMap -FilePath $envFilePath
$postgresBinDir = Resolve-PostgresBinDir -EnvMap $envMap
$pgCtlPath = Join-Path $postgresBinDir 'pg_ctl.exe'
$pgIsReadyPath = Join-Path $postgresBinDir 'pg_isready.exe'
$postgresDataDir = Resolve-InternalServerPath (Get-EnvValue -EnvMap $envMap -Key 'KPI_POSTGRES_DATA_DIR' -Fallback './var/local-experiment/postgres/data')
$postgresPort = Get-DatabasePort -EnvMap $envMap

function Test-PostgresReady {
  & $pgIsReadyPath -h 127.0.0.1 -p $postgresPort 2>$null | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Test-PostgresListening {
  $listener = Get-NetTCPConnection -State Listen -LocalPort $postgresPort -ErrorAction SilentlyContinue
  return ($null -ne $listener)
}

function Get-PostgresRuntimeState {
  & $pgCtlPath -D $postgresDataDir status 2>$null | Out-Null
  $statusExitCode = $LASTEXITCODE
  $isReady = Test-PostgresReady
  $isListening = Test-PostgresListening

  return [pscustomobject]@{
    pgCtlReportsRunning = ($statusExitCode -eq 0)
    isReady = $isReady
    isListening = $isListening
    isRunning = ($statusExitCode -eq 0 -or $isReady -or $isListening)
    statusExitCode = $statusExitCode
  }
}

function Wait-ForPostgresStopped {
  param([int]$TimeoutSeconds = 20)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $state = Get-PostgresRuntimeState
    if (-not $state.isRunning) {
      return
    }
    Start-Sleep -Milliseconds 500
  }

  throw "Local KPI PostgreSQL did not stop cleanly on port $postgresPort."
}

Assert-CommandPath -PathToCheck $pgCtlPath
Assert-CommandPath -PathToCheck $pgIsReadyPath

if (-not (Test-Path (Join-Path $postgresDataDir 'PG_VERSION'))) {
  Write-Host "Local KPI PostgreSQL cluster was not initialized."
  exit 0
}

$runtimeState = Get-PostgresRuntimeState
if (-not $runtimeState.isRunning) {
  Write-Host "Local KPI PostgreSQL is already stopped."
  exit 0
}

if (-not $runtimeState.pgCtlReportsRunning) {
  Write-Warning "pg_ctl status did not report PostgreSQL as running, but the server is still reachable on port $postgresPort. Attempting a clean stop."
}

& $pgCtlPath -D $postgresDataDir stop -m fast | Out-Null
$stopExitCode = $LASTEXITCODE
if ($stopExitCode -ne 0) {
  try {
    Wait-ForPostgresStopped -TimeoutSeconds 10
    Write-Warning "pg_ctl stop returned exit code $stopExitCode, but PostgreSQL finished stopping on port $postgresPort."
    exit 0
  } catch {
    throw "Local KPI PostgreSQL stop failed on port $postgresPort (pg_ctl exit code $stopExitCode)."
  }
}

Wait-ForPostgresStopped
Write-Host "Stopped local KPI PostgreSQL on port $postgresPort."
