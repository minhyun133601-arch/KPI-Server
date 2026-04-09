$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$sourceRoot = Join-Path $serverDir 'var\files'
$backupRoot = Join-Path $serverDir 'var\backups\file-storage'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$targetRoot = Join-Path $backupRoot $timestamp
$targetPath = Join-Path $targetRoot 'files'

if (-not (Test-Path $sourceRoot)) {
  throw "file_storage_root_not_found: $sourceRoot"
}

New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
Copy-Item -Path $sourceRoot -Destination $targetRoot -Recurse -Force

$copiedFiles = @(Get-ChildItem -Path $targetPath -File -Recurse -ErrorAction SilentlyContinue)
$summary = [ordered]@{
  ok = $true
  sourceRoot = $sourceRoot
  backupRoot = $targetPath
  fileCount = $copiedFiles.Count
  totalBytes = ($copiedFiles | Measure-Object -Property Length -Sum).Sum
}

$summary | ConvertTo-Json -Depth 5
