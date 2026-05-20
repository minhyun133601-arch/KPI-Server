param(
  [string]$PackagePath,
  [switch]$Force,
  [switch]$Details
)

$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'

function Convert-ToAbsolutePath {
  param(
    [string]$BaseDir,
    [string]$PathValue
  )

  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    return ''
  }
  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }
  return [System.IO.Path]::GetFullPath((Join-Path $BaseDir $PathValue))
}

function Find-DefaultPackagePath {
  $workspaceRoot = (Resolve-Path (Join-Path $serverDir '..\..\..')).Path
  $candidateRoots = @(
    (Join-Path $serverDir 'var\prod'),
    (Join-Path $workspaceRoot 'KPI-TRANSFER-KITS'),
    (Join-Path $env:USERPROFILE 'Desktop'),
    (Join-Path $env:USERPROFILE 'Downloads'),
    (Join-Path $env:USERPROFILE 'Documents')
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) -and (Test-Path -LiteralPath $_ -PathType Container) }

  $candidates = foreach ($root in $candidateRoots) {
    Get-ChildItem -LiteralPath $root -Filter 'document-storage-package*.zip' -File -ErrorAction SilentlyContinue
  }

  $candidate = @($candidates | Sort-Object LastWriteTime -Descending | Select-Object -First 1)
  if ($candidate.Count -gt 0) {
    return $candidate[0].FullName
  }
  return ''
}

function Invoke-NodeJson {
  param([string[]]$NodeArgs)

  $output = & node @NodeArgs 2>&1
  $exitCode = $LASTEXITCODE
  $text = ($output | Out-String).Trim()
  $json = $null
  if (-not [string]::IsNullOrWhiteSpace($text)) {
    try {
      $json = $text | ConvertFrom-Json
    } catch {
      $json = [pscustomobject]@{
        rawOutput = $text
      }
    }
  }
  return [pscustomobject]@{
    exitCode = $exitCode
    json = $json
    rawOutput = $text
  }
}

$resolvedPackagePath = if ($PackagePath) {
  Convert-ToAbsolutePath -BaseDir $serverDir -PathValue $PackagePath
} else {
  Find-DefaultPackagePath
}

if ([string]::IsNullOrWhiteSpace($resolvedPackagePath)) {
  throw 'PackagePath is required, or place document-storage-package*.zip in KPI-TRANSFER-KITS, Desktop, Downloads, Documents, or var\prod.'
}
if (-not (Test-Path -LiteralPath $resolvedPackagePath -PathType Leaf)) {
  throw "PackagePath not found: $resolvedPackagePath"
}

$restoreManifestPath = Join-Path $serverDir "var\prod\document-storage-restore-$timestamp.json"
$restoreArgs = @(
  'src/scripts/restoreDocumentStorageFromSource.js',
  "--source=$resolvedPackagePath",
  "--manifest=$restoreManifestPath"
)
if ($Force) {
  $restoreArgs += '--force'
}
if ($Details) {
  $restoreArgs += '--details'
}

$restoreResult = $null
Push-Location $serverDir
try {
  $restoreResult = Invoke-NodeJson -NodeArgs $restoreArgs
} finally {
  Pop-Location
}

$verification = $null
if ($Force -and $restoreResult.exitCode -eq 0) {
  $verifyManifestPath = Join-Path $serverDir "var\prod\document-storage-verify-$timestamp.json"
  $verifyArgs = @(
    'src/scripts/verifyDocumentStorage.js',
    "--manifest=$verifyManifestPath"
  )
  Push-Location $serverDir
  try {
    $verification = Invoke-NodeJson -NodeArgs $verifyArgs
  } finally {
    Pop-Location
  }
}

$payload = [ordered]@{
  ok = if ($Force) {
    ($restoreResult.exitCode -eq 0 -and $verification -ne $null -and $verification.exitCode -eq 0)
  } else {
    ($restoreResult.exitCode -eq 0)
  }
  mode = if ($Force) { 'restore-and-verify' } else { 'preview' }
  packagePath = $resolvedPackagePath
  restoreExitCode = $restoreResult.exitCode
  restoreManifestPath = $restoreManifestPath
  restoreSummary = $restoreResult.json.summary
  verifyExitCode = if ($verification) { $verification.exitCode } else { $null }
  verifySummary = if ($verification -and $verification.json) { $verification.json.summary } else { $null }
}

$payload | ConvertTo-Json -Depth 8
if (-not $payload.ok) {
  exit 2
}
