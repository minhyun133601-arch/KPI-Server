param(
  [string]$BackupPath,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$backupRoot = Join-Path $serverDir 'var\backups\file-storage'
$targetRoot = Join-Path $serverDir 'var\files'

function Resolve-LatestBackupPath {
  param([string]$Root)
  $entries = Get-ChildItem -Path $Root -Directory -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending
  if (-not $entries -or $entries.Count -eq 0) {
    throw "file_storage_backup_not_found: $Root"
  }
  return (Join-Path $entries[0].FullName 'files')
}

if ($BackupPath) {
  $sourceRoot = if ([System.IO.Path]::IsPathRooted($BackupPath)) {
    $BackupPath
  } else {
    Join-Path $serverDir $BackupPath
  }
} else {
  $sourceRoot = Resolve-LatestBackupPath -Root $backupRoot
}

if (-not (Test-Path $sourceRoot)) {
  throw "file_storage_backup_path_not_found: $sourceRoot"
}

$sourceFiles = @(Get-ChildItem -Path $sourceRoot -File -Recurse -ErrorAction SilentlyContinue)
$summary = [ordered]@{
  ok = $true
  mode = if ($Force) { 'restore' } else { 'preview' }
  sourceRoot = $sourceRoot
  targetRoot = $targetRoot
  fileCount = $sourceFiles.Count
  totalBytes = ($sourceFiles | Measure-Object -Property Length -Sum).Sum
}

if (-not $Force) {
  $summary['note'] = 'Add -Force to overwrite var/files from this backup.'
  $summary | ConvertTo-Json -Depth 6
  exit 0
}

$preRestoreRoot = Join-Path $serverDir ('var\backups\pre-restore-file-storage\' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
if (Test-Path $targetRoot) {
  New-Item -ItemType Directory -Path $preRestoreRoot -Force | Out-Null
  Copy-Item -Path $targetRoot -Destination $preRestoreRoot -Recurse -Force
  Remove-Item -Path $targetRoot -Recurse -Force
}

New-Item -ItemType Directory -Path (Split-Path -Parent $targetRoot) -Force | Out-Null
Copy-Item -Path $sourceRoot -Destination $targetRoot -Recurse -Force

$summary['preRestoreBackupRoot'] = if (Test-Path $preRestoreRoot) { $preRestoreRoot } else { $null }
$summary | ConvertTo-Json -Depth 6
