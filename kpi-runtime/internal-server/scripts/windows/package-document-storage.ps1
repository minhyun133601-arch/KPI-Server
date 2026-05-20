param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,
  [string]$ManifestPath,
  [string]$OutputPath,
  [switch]$Force,
  [switch]$Details
)

$ErrorActionPreference = 'Stop'

$scriptRoot = (Resolve-Path $PSScriptRoot).Path
$serverDirCandidate = [System.IO.Path]::GetFullPath((Join-Path $scriptRoot '..\..'))
$runningFromServerScripts = Test-Path -LiteralPath (Join-Path $serverDirCandidate 'package.json') -PathType Leaf
$baseDir = if ($runningFromServerScripts) { $serverDirCandidate } else { $scriptRoot }
$defaultManifestPath = if ($runningFromServerScripts) {
  Join-Path $baseDir 'var\prod\document-storage-missing-manifest.json'
} else {
  Join-Path $baseDir 'document-storage-missing-manifest.json'
}
$skipDirectoryNames = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
@('.git', 'node_modules', 'postgres', 'tools', 'backups') | ForEach-Object { [void]$skipDirectoryNames.Add($_) }

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

function Normalize-StorageRelPath {
  param([string]$Value)
  return ([string]$Value).Trim().Replace('\', '/').TrimStart('/')
}

function Join-StorageRelPath {
  param(
    [string]$Root,
    [string]$StorageRelPath
  )

  $candidate = $Root
  foreach ($segment in (Normalize-StorageRelPath $StorageRelPath).Split('/')) {
    if (-not [string]::IsNullOrWhiteSpace($segment)) {
      $candidate = Join-Path $candidate $segment
    }
  }
  return $candidate
}

function Get-FileLengthIfExpected {
  param(
    [string]$PathValue,
    [Int64]$ExpectedBytes
  )

  if (-not (Test-Path -LiteralPath $PathValue -PathType Leaf)) {
    return $null
  }
  $item = Get-Item -LiteralPath $PathValue
  if ($item.Length -ne $ExpectedBytes) {
    return $null
  }
  return $item
}

function Find-RelativeCandidate {
  param(
    [string]$SourceRoot,
    [object]$Document
  )

  $expectedBytes = [Int64]$Document.expectedBytes
  $candidates = @(
    (Join-StorageRelPath -Root $SourceRoot -StorageRelPath $Document.storageRelPath),
    (Join-StorageRelPath -Root (Join-Path $SourceRoot 'files') -StorageRelPath $Document.storageRelPath)
  )

  foreach ($candidate in $candidates) {
    $file = Get-FileLengthIfExpected -PathValue $candidate -ExpectedBytes $expectedBytes
    if ($file) {
      return [pscustomobject]@{
        status = 'found'
        matchStrategy = 'relativePath'
        sourcePath = $file.FullName
        bytes = $file.Length
      }
    }
  }

  return $null
}

function Find-MetadataCandidate {
  param(
    [string]$SourceRoot,
    [object]$Document
  )

  $expectedBytes = [Int64]$Document.expectedBytes
  $candidatePaths = New-Object System.Collections.ArrayList

  if (-not [string]::IsNullOrWhiteSpace($Document.sourceFilePath)) {
    if ([System.IO.Path]::IsPathRooted($Document.sourceFilePath)) {
      [void]$candidatePaths.Add([System.IO.Path]::GetFullPath($Document.sourceFilePath))
    } else {
      [void]$candidatePaths.Add([System.IO.Path]::GetFullPath((Join-Path $SourceRoot $Document.sourceFilePath)))
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($Document.sourceRelativePath)) {
    [void]$candidatePaths.Add((Join-StorageRelPath -Root $SourceRoot -StorageRelPath $Document.sourceRelativePath))
  }

  $uniqueCandidatePaths = @($candidatePaths | Sort-Object -Unique)
  foreach ($candidatePath in $uniqueCandidatePaths) {
    $file = Get-FileLengthIfExpected -PathValue $candidatePath -ExpectedBytes $expectedBytes
    if ($file) {
      return [pscustomobject]@{
        status = 'found'
        matchStrategy = 'metadataSourcePath'
        sourcePath = $file.FullName
        bytes = $file.Length
      }
    }
  }

  return $null
}

function Add-IndexedMatch {
  param(
    [hashtable]$Index,
    [string]$Name,
    [System.IO.FileInfo]$File
  )

  if (-not $Index.ContainsKey($Name)) {
    $Index[$Name] = New-Object System.Collections.ArrayList
  }
  [void]$Index[$Name].Add([pscustomobject]@{
    sourcePath = $File.FullName
    bytes = $File.Length
  })
}

function Add-WantedFilesFromDirectory {
  param(
    [string]$Directory,
    [System.Collections.Generic.HashSet[string]]$WantedNames,
    [hashtable]$Index
  )

  try {
    $children = Get-ChildItem -LiteralPath $Directory -Force -ErrorAction Stop
  } catch {
    return
  }

  foreach ($child in $children) {
    if ($child.PSIsContainer) {
      if (-not $skipDirectoryNames.Contains($child.Name)) {
        Add-WantedFilesFromDirectory -Directory $child.FullName -WantedNames $WantedNames -Index $Index
      }
      continue
    }

    if ($WantedNames.Contains($child.Name)) {
      Add-IndexedMatch -Index $Index -Name $child.Name -File $child
    }
  }
}

function Find-IndexedCandidate {
  param(
    [hashtable]$Index,
    [object]$Document
  )

  $expectedBytes = [Int64]$Document.expectedBytes
  $matches = New-Object System.Collections.ArrayList
  foreach ($name in @($Document.storedName, $Document.originalName)) {
    if ([string]::IsNullOrWhiteSpace($name) -or -not $Index.ContainsKey($name)) {
      continue
    }
    foreach ($match in $Index[$name]) {
      if ($match.bytes -eq $expectedBytes) {
        [void]$matches.Add([pscustomobject]@{
          status = 'found'
          matchStrategy = if ($name -eq $Document.storedName) { 'storedName' } else { 'originalName' }
          sourcePath = $match.sourcePath
          bytes = $match.bytes
        })
      }
    }
  }

  $unique = @($matches | Sort-Object sourcePath -Unique)
  if ($unique.Count -eq 1) {
    return $unique[0]
  }
  if ($unique.Count -gt 1) {
    return [pscustomobject]@{
      status = 'ambiguous'
      candidates = @($unique | ForEach-Object { $_.sourcePath })
    }
  }
  return $null
}

function Assert-ChildPath {
  param(
    [string]$Root,
    [string]$Candidate
  )

  $rootFull = [System.IO.Path]::GetFullPath($Root)
  $candidateFull = [System.IO.Path]::GetFullPath($Candidate)
  if (-not $candidateFull.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing path outside root: $candidateFull"
  }
}

$resolvedSourcePath = Convert-ToAbsolutePath -BaseDir $baseDir -PathValue $SourcePath
$resolvedManifestPath = Convert-ToAbsolutePath -BaseDir $baseDir -PathValue $(if ($ManifestPath) { $ManifestPath } else { $defaultManifestPath })
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$defaultOutputPath = if ($runningFromServerScripts) {
  "var\prod\document-storage-package-$timestamp.zip"
} else {
  "document-storage-package-$timestamp.zip"
}
$resolvedOutputPath = Convert-ToAbsolutePath -BaseDir $baseDir -PathValue $(if ($OutputPath) { $OutputPath } else { $defaultOutputPath })

if (-not (Test-Path -LiteralPath $resolvedSourcePath -PathType Container)) {
  throw "SourcePath directory not found: $resolvedSourcePath"
}
if (-not (Test-Path -LiteralPath $resolvedManifestPath -PathType Leaf)) {
  throw "ManifestPath not found: $resolvedManifestPath"
}

$manifest = Get-Content -LiteralPath $resolvedManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$rawDocuments = if ($manifest.missing) { @($manifest.missing) } elseif ($manifest.items) { @($manifest.items) } else { @() }
$documents = @($rawDocuments | ForEach-Object {
  [pscustomobject]@{
    id = $_.id
    ownerDomain = $_.ownerDomain
    ownerKey = $_.ownerKey
    fileCategory = $_.fileCategory
    originalName = $_.originalName
    storedName = $_.storedName
    expectedBytes = [Int64]$_.expectedBytes
    storageRelPath = Normalize-StorageRelPath $_.storageRelPath
    sourceFilePath = if ($_.metadata -and $_.metadata.sourceFilePath) { [string]$_.metadata.sourceFilePath } else { '' }
    sourceRelativePath = if ($_.metadata -and $_.metadata.sourceRelativePath) { [string]$_.metadata.sourceRelativePath } else { '' }
  }
})

$wantedNames = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($document in $documents) {
  if (-not [string]::IsNullOrWhiteSpace($document.storedName)) { [void]$wantedNames.Add($document.storedName) }
  if (-not [string]::IsNullOrWhiteSpace($document.originalName)) { [void]$wantedNames.Add($document.originalName) }
  if (-not [string]::IsNullOrWhiteSpace($document.sourceFilePath)) {
    $sourceFileName = Split-Path -Leaf $document.sourceFilePath
    if (-not [string]::IsNullOrWhiteSpace($sourceFileName)) { [void]$wantedNames.Add($sourceFileName) }
  }
}

$index = @{}
Add-WantedFilesFromDirectory -Directory $resolvedSourcePath -WantedNames $wantedNames -Index $index

$items = New-Object System.Collections.ArrayList
$restorable = 0
$packaged = 0
$missingSource = 0
$ambiguous = 0
$packageBytes = [Int64]0
$tmpRoot = if ($runningFromServerScripts) {
  Join-Path $baseDir 'var\prod\tmp'
} else {
  Join-Path $baseDir 'tmp'
}
$stageRoot = Join-Path $tmpRoot "document-storage-package-$timestamp"

foreach ($document in $documents) {
  $candidate = Find-MetadataCandidate -SourceRoot $resolvedSourcePath -Document $document
  if (-not $candidate) {
    $candidate = Find-RelativeCandidate -SourceRoot $resolvedSourcePath -Document $document
  }
  if (-not $candidate) {
    $candidate = Find-IndexedCandidate -Index $index -Document $document
  }

  $item = [ordered]@{
    id = $document.id
    ownerDomain = $document.ownerDomain
    ownerKey = $document.ownerKey
    fileCategory = $document.fileCategory
    originalName = $document.originalName
    storedName = $document.storedName
    expectedBytes = $document.expectedBytes
    storageRelPath = $document.storageRelPath
  }

  if (-not $candidate) {
    $missingSource += 1
    $item.status = 'sourceMissing'
    [void]$items.Add([pscustomobject]$item)
    continue
  }

  if ($candidate.status -eq 'ambiguous') {
    $ambiguous += 1
    $item.status = 'ambiguousSource'
    $item.candidates = $candidate.candidates
    [void]$items.Add([pscustomobject]$item)
    continue
  }

  $restorable += 1
  $packageBytes += [Int64]$candidate.bytes
  $item.status = if ($Force) { 'packaged' } else { 'restorable' }
  $item.matchStrategy = $candidate.matchStrategy
  $item.sourcePath = $candidate.sourcePath

  if ($Force) {
    $targetPath = Join-StorageRelPath -Root (Join-Path $stageRoot 'files') -StorageRelPath $document.storageRelPath
    Assert-ChildPath -Root $stageRoot -Candidate $targetPath
    New-Item -ItemType Directory -Path (Split-Path -Parent $targetPath) -Force | Out-Null
    Copy-Item -LiteralPath $candidate.sourcePath -Destination $targetPath -Force
    $packaged += 1
  }

  [void]$items.Add([pscustomobject]$item)
}

$summary = [ordered]@{
  documentCount = $documents.Count
  restorable = $restorable
  packaged = $packaged
  missingSource = $missingSource
  ambiguous = $ambiguous
  packageBytes = $packageBytes
}

$payload = [ordered]@{
  ok = ($missingSource -eq 0 -and $ambiguous -eq 0 -and (-not $Force -or $packaged -eq $documents.Count))
  mode = if ($Force) { 'package' } else { 'preview' }
  sourcePath = $resolvedSourcePath
  manifestPath = $resolvedManifestPath
  outputPath = if ($Force) { $resolvedOutputPath } else { $null }
  summary = $summary
  items = @($items)
}

if ($Force) {
  $packageManifestPath = Join-Path $stageRoot 'document-storage-package-manifest.json'
  New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null
  $payload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $packageManifestPath -Encoding UTF8
  New-Item -ItemType Directory -Path (Split-Path -Parent $resolvedOutputPath) -Force | Out-Null
  if (Test-Path -LiteralPath $resolvedOutputPath) {
    Remove-Item -LiteralPath $resolvedOutputPath -Force
  }
  Compress-Archive -Path (Join-Path $stageRoot '*') -DestinationPath $resolvedOutputPath -Force
  $payload.outputBytes = (Get-Item -LiteralPath $resolvedOutputPath).Length
  Assert-ChildPath -Root $tmpRoot -Candidate $stageRoot
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
}

$consolePayload = [ordered]@{}
foreach ($key in $payload.Keys) {
  if ($key -ne 'items' -or $Details) {
    $consolePayload[$key] = $payload[$key]
  }
}

$consolePayload | ConvertTo-Json -Depth 8
if (-not $payload.ok) {
  exit 2
}
