param()

$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$postgresBinDir = 'C:\Program Files\PostgreSQL\17\bin'
$pgCtlPath = Join-Path $postgresBinDir 'pg_ctl.exe'
$postgresDataDir = Join-Path $serverDir 'var\central-runtime\postgres\data'

if (-not (Test-Path (Join-Path $postgresDataDir 'PG_VERSION'))) {
  Write-Host "Local KPI PostgreSQL cluster was not initialized."
  exit 0
}

& $pgCtlPath -D $postgresDataDir status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Local KPI PostgreSQL is already stopped."
  exit 0
}

& $pgCtlPath -D $postgresDataDir stop -m fast | Out-Null
Write-Host "Stopped local KPI PostgreSQL."
