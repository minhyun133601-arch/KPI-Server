param(
  [string]$ManifestPath,
  [string]$OutputPath,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$serverDir = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$defaultManifestPath = Join-Path $serverDir 'var\local-experiment\storage\document-storage-missing-manifest.json'
$resolvedManifestPath = if ($ManifestPath) {
  if ([System.IO.Path]::IsPathRooted($ManifestPath)) {
    [System.IO.Path]::GetFullPath($ManifestPath)
  } else {
    [System.IO.Path]::GetFullPath((Join-Path $serverDir $ManifestPath))
  }
} else {
  $defaultManifestPath
}
$resolvedOutputPath = if ($OutputPath) {
  if ([System.IO.Path]::IsPathRooted($OutputPath)) {
    [System.IO.Path]::GetFullPath($OutputPath)
  } else {
    [System.IO.Path]::GetFullPath((Join-Path $serverDir $OutputPath))
  }
} else {
  Join-Path $serverDir "var\local-experiment\storage\document-storage-export-kit-$timestamp.zip"
}

if (-not (Test-Path -LiteralPath $resolvedManifestPath -PathType Leaf)) {
  throw "ManifestPath not found: $resolvedManifestPath"
}

$packageScriptPath = Join-Path $serverDir 'scripts\windows\package-document-storage.ps1'
if (-not (Test-Path -LiteralPath $packageScriptPath -PathType Leaf)) {
  throw "package-document-storage.ps1 not found: $packageScriptPath"
}

if ((Test-Path -LiteralPath $resolvedOutputPath) -and -not $Force) {
  throw "OutputPath already exists. Add -Force to replace: $resolvedOutputPath"
}

$manifest = Get-Content -LiteralPath $resolvedManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$missingCount = if ($manifest.summary.missingCount -ne $null) { [int]$manifest.summary.missingCount } else { @($manifest.missing).Count }
$missingBytes = if ($manifest.summary.missingBytes -ne $null) { [Int64]$manifest.summary.missingBytes } else { [Int64]0 }
$documentCount = if ($manifest.summary.documentCount -ne $null) { [int]$manifest.summary.documentCount } else { @($manifest.missing).Count }

$kitRoot = Join-Path $serverDir "var\local-experiment\tmp\document-storage-export-kit-$timestamp"
New-Item -ItemType Directory -Path $kitRoot -Force | Out-Null

try {
  Copy-Item -LiteralPath $resolvedManifestPath -Destination (Join-Path $kitRoot 'document-storage-missing-manifest.json') -Force
  Copy-Item -LiteralPath $packageScriptPath -Destination (Join-Path $kitRoot 'package-document-storage.ps1') -Force

  $readme = @"
# KPI document storage export kit

Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Missing documents: $missingCount
Missing bytes: $missingBytes
Document metadata count: $documentCount

Run this on the office PC where the original KPI storage files exist.

SourcePath can be the KPI storage files folder, the old KPI-Server root, or another folder that contains the original attachment files.
The script first tries the source path metadata from the manifest, then storage-relative paths, then matching file names and sizes.

Preview:
~~~powershell
powershell -ExecutionPolicy Bypass -File .\package-document-storage.ps1 -SourcePath "<office KPI-LOCAL>\kpi-runtime\internal-server\var\local-experiment\storage\files" -ManifestPath .\document-storage-missing-manifest.json
~~~

Create package:
~~~powershell
powershell -ExecutionPolicy Bypass -File .\package-document-storage.ps1 -SourcePath "<office KPI-LOCAL>\kpi-runtime\internal-server\var\local-experiment\storage\files" -ManifestPath .\document-storage-missing-manifest.json -Force -OutputPath .\document-storage-package.zip
~~~

Bring document-storage-package.zip back to the home PC. Restore it from the home KPI-LOCAL kpi-runtime\internal-server folder.

Preview on home PC:
~~~powershell
npm run restore-package:document-storage -- -PackagePath "<path to document-storage-package.zip>"
~~~

Restore and verify on home PC:
~~~powershell
npm run restore-package:document-storage -- -PackagePath "<path to document-storage-package.zip>" -Force
~~~
"@
  $readme | Set-Content -LiteralPath (Join-Path $kitRoot 'README.md') -Encoding UTF8

  $summary = [ordered]@{
    createdAt = (Get-Date).ToUniversalTime().ToString('o')
    missingCount = $missingCount
    missingBytes = $missingBytes
    documentCount = $documentCount
    files = @(
      'README.md',
      'document-storage-missing-manifest.json',
      'package-document-storage.ps1'
    )
  }
  $summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $kitRoot 'export-kit-summary.json') -Encoding UTF8

  New-Item -ItemType Directory -Path (Split-Path -Parent $resolvedOutputPath) -Force | Out-Null
  if (Test-Path -LiteralPath $resolvedOutputPath) {
    Remove-Item -LiteralPath $resolvedOutputPath -Force
  }
  Compress-Archive -Path (Join-Path $kitRoot '*') -DestinationPath $resolvedOutputPath -Force
  $outputItem = Get-Item -LiteralPath $resolvedOutputPath

  [ordered]@{
    ok = $true
    outputPath = $outputItem.FullName
    outputBytes = $outputItem.Length
    missingCount = $missingCount
    missingBytes = $missingBytes
    documentCount = $documentCount
  } | ConvertTo-Json -Depth 6
} finally {
  if (Test-Path -LiteralPath $kitRoot) {
    Remove-Item -LiteralPath $kitRoot -Recurse -Force
  }
}
