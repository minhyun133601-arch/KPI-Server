$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runtimeBackupScript = Join-Path $scriptDir 'backup-runtime-snapshot.ps1'
$fileBackupScript = Join-Path $scriptDir 'backup-file-storage.ps1'

$runtimeRaw = & $runtimeBackupScript
$runtimeSummary = $runtimeRaw | ConvertFrom-Json

$fileRaw = & $fileBackupScript
$fileSummary = $fileRaw | ConvertFrom-Json

[ordered]@{
  ok = $true
  runtimeSnapshot = $runtimeSummary
  fileStorage = $fileSummary
} | ConvertTo-Json -Depth 8
