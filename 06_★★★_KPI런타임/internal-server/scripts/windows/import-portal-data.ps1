$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

Push-Location $serverDir
try {
  npm run import:portal-data
} finally {
  Pop-Location
}
