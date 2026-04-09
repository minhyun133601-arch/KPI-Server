param(
  [int]$DaysToKeep = 30,
  [int]$KeepLatest = 10,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Get-RetentionPlan {
  param(
    [string]$Root,
    [string]$Type
  )

  $items = if ($Type -eq 'file') {
    @(Get-ChildItem -Path $Root -File -ErrorAction SilentlyContinue)
  } else {
    @(Get-ChildItem -Path $Root -Directory -ErrorAction SilentlyContinue)
  }
  $items = @($items | Where-Object { $_.Name -ne '.gitkeep' })

  $sorted = $items | Sort-Object LastWriteTime -Descending
  $cutoff = (Get-Date).AddDays(-1 * [Math]::Abs($DaysToKeep))
  $wouldDelete = @()

  for ($index = 0; $index -lt $sorted.Count; $index++) {
    $item = $sorted[$index]
    $keepByCount = $index -lt $KeepLatest
    $keepByAge = $item.LastWriteTime -ge $cutoff
    if ($keepByCount -or $keepByAge) {
      continue
    }
    $wouldDelete += $item
  }

  [ordered]@{
    root = $Root
    itemType = $Type
    totalCount = $sorted.Count
    deleteCount = $wouldDelete.Count
    wouldDelete = @($wouldDelete | ForEach-Object { $_.FullName })
    items = @($sorted | ForEach-Object {
      [ordered]@{
        path = $_.FullName
        lastWriteTime = $_.LastWriteTime.ToString('o')
      }
    })
  }
}

function Invoke-RetentionDelete {
  param($Plan)
  foreach ($path in $Plan.wouldDelete) {
    if ($Plan.itemType -eq 'file') {
      Remove-Item -Path $path -Force
    } else {
      Remove-Item -Path $path -Recurse -Force
    }
  }
}

$runtimePlan = Get-RetentionPlan -Root (Join-Path $serverDir 'var\backups\runtime-snapshots') -Type 'file'
$fileStoragePlan = Get-RetentionPlan -Root (Join-Path $serverDir 'var\backups\file-storage') -Type 'directory'

if ($Force) {
  Invoke-RetentionDelete -Plan $runtimePlan
  Invoke-RetentionDelete -Plan $fileStoragePlan
}

[ordered]@{
  ok = $true
  mode = if ($Force) { 'delete' } else { 'preview' }
  daysToKeep = $DaysToKeep
  keepLatest = $KeepLatest
  runtimeSnapshots = $runtimePlan
  fileStorage = $fileStoragePlan
} | ConvertTo-Json -Depth 8
