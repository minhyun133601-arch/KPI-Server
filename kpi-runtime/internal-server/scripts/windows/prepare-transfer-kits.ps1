param(
  [string]$OutputDir = ''
)

$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Convert-ToAbsolutePath {
  param(
    [string]$BaseDir,
    [string]$PathValue
  )

  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    return [System.IO.Path]::GetFullPath((Join-Path $BaseDir 'var'))
  }

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }

  return [System.IO.Path]::GetFullPath((Join-Path $BaseDir $PathValue))
}

function Get-EnvFileValue {
  param(
    [string]$ServerDir,
    [string]$Key
  )

  $candidatePaths = @(
    (Join-Path $ServerDir '.env.production.local'),
    (Join-Path $ServerDir '.env.development.local'),
    (Join-Path $ServerDir '.env.local-experiment'),
    (Join-Path $ServerDir '.env')
  ) | Select-Object -Unique

  foreach ($candidatePath in $candidatePaths) {
    if (-not (Test-Path $candidatePath)) {
      continue
    }

    foreach ($line in Get-Content -LiteralPath $candidatePath -Encoding UTF8) {
      $trimmed = ([string]$line).Trim()
      if (-not $trimmed -or $trimmed.StartsWith('#')) {
        continue
      }
      if (-not $trimmed.StartsWith("$Key=")) {
        continue
      }

      return $trimmed.Substring($Key.Length + 1).Trim().Trim('"')
    }
  }

  return ''
}

function Get-ConfiguredStorageRoot {
  param([string]$ServerDir)

  $storageRootValue = if ($env:KPI_STORAGE_ROOT) {
    $env:KPI_STORAGE_ROOT
  } else {
    Get-EnvFileValue -ServerDir $ServerDir -Key 'KPI_STORAGE_ROOT'
  }

  return Convert-ToAbsolutePath -BaseDir $ServerDir -PathValue $storageRootValue
}

function Get-LatestFile {
  param(
    [string]$Root,
    [string]$Filter
  )

  if (-not (Test-Path $Root)) {
    return $null
  }

  return Get-ChildItem -LiteralPath $Root -Filter $Filter -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

function Get-FileSha256 {
  param([string]$Path)

  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Set-TextFileWithRetry {
  param(
    [string]$Path,
    [object]$Value,
    [int]$RetryCount = 10
  )

  for ($attempt = 1; $attempt -le $RetryCount; $attempt += 1) {
    try {
      $Value | Set-Content -LiteralPath $Path -Encoding UTF8
      return
    } catch {
      if ($attempt -eq $RetryCount) {
        throw
      }
      Start-Sleep -Milliseconds 250
    }
  }
}

function Remove-StaleGeneratedFile {
  param(
    [string]$Path,
    [string[]]$KeepPaths
  )

  $fullPath = [System.IO.Path]::GetFullPath($Path)
  foreach ($keepPath in $KeepPaths) {
    if ($fullPath -eq [System.IO.Path]::GetFullPath($keepPath)) {
      return [ordered]@{
        path = $fullPath
        removed = $false
        skipped = $true
        reason = 'current_file'
      }
    }
  }

  try {
    Remove-Item -LiteralPath $fullPath -Force
    return [ordered]@{
      path = $fullPath
      removed = $true
      skipped = $false
      reason = $null
    }
  } catch {
    return [ordered]@{
      path = $fullPath
      removed = $false
      skipped = $true
      reason = $_.Exception.Message
    }
  }
}

$storageRoot = Get-ConfiguredStorageRoot -ServerDir $serverDir
$workspaceRoot = (Resolve-Path (Join-Path $serverDir '..\..\..')).Path
$targetDir = if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  Join-Path $workspaceRoot 'KPI-TRANSFER-KITS'
} elseif ([System.IO.Path]::IsPathRooted($OutputDir)) {
  [System.IO.Path]::GetFullPath($OutputDir)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot $OutputDir))
}

$documentKit = Get-LatestFile -Root $storageRoot -Filter 'document-storage-export-kit-*.zip'
$officeReturnPackage = Get-LatestFile -Root (Join-Path $storageRoot 'office-return-packages') -Filter 'office-return-package-*.zip'

if (-not $documentKit) {
  throw "document_storage_export_kit_not_found: $storageRoot"
}
if (-not $officeReturnPackage) {
  throw "office_return_package_not_found: $(Join-Path $storageRoot 'office-return-packages')"
}

New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

$resolvedTargetDir = (Resolve-Path $targetDir).Path.TrimEnd('\') + '\'
Get-ChildItem -LiteralPath $resolvedTargetDir -Filter '*.zip' -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like 'document-storage-export-kit-*.zip' -or $_.Name -like 'office-return-package-*.zip' } |
  ForEach-Object {
    $full = [System.IO.Path]::GetFullPath($_.FullName)
    if (-not $full.StartsWith($resolvedTargetDir, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "refusing_outside_transfer_dir: $full"
    }
    Remove-Item -LiteralPath $full -Force
  }

$documentKitTarget = Join-Path $targetDir $documentKit.Name
$officeReturnTarget = Join-Path $targetDir $officeReturnPackage.Name
Copy-Item -LiteralPath $documentKit.FullName -Destination $documentKitTarget -Force
Copy-Item -LiteralPath $officeReturnPackage.FullName -Destination $officeReturnTarget -Force

$documentKitTargetItem = Get-Item -LiteralPath $documentKitTarget
$officeReturnTargetItem = Get-Item -LiteralPath $officeReturnTarget
$documentKitSha256 = Get-FileSha256 -Path $documentKitTarget
$officeReturnSha256 = Get-FileSha256 -Path $officeReturnTarget

$transferTimestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$verifyScriptName = "verify-transfer-kits-$transferTimestamp.ps1"
$verifyScriptPath = Join-Path $targetDir $verifyScriptName
$verifyScriptLines = @(
  'param()',
  '',
  '$ErrorActionPreference = ''Stop''',
  '$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path',
  '',
  '$expectedFiles = @(',
  "  [ordered]@{ Name = '$($documentKit.Name.Replace("'", "''"))'; Bytes = $($documentKitTargetItem.Length); Sha256 = '$documentKitSha256' },",
  "  [ordered]@{ Name = '$($officeReturnPackage.Name.Replace("'", "''"))'; Bytes = $($officeReturnTargetItem.Length); Sha256 = '$officeReturnSha256' }",
  ')',
  '',
  '$results = foreach ($expected in $expectedFiles) {',
  '  $path = Join-Path $scriptDir $expected.Name',
  '  if (-not (Test-Path $path -PathType Leaf)) {',
  '    [ordered]@{',
  '      name = $expected.Name',
  '      ok = $false',
  '      exists = $false',
  '      expectedBytes = [int64]$expected.Bytes',
  '      actualBytes = $null',
  '      expectedSha256 = $expected.Sha256',
  '      actualSha256 = $null',
  '      error = ''file_not_found''',
  '    }',
  '    continue',
  '  }',
  '',
  '  $item = Get-Item -LiteralPath $path',
  '  $actualSha256 = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()',
  '  $bytesMatch = ([int64]$item.Length -eq [int64]$expected.Bytes)',
  '  $hashMatch = ($actualSha256 -eq $expected.Sha256)',
  '  [ordered]@{',
  '    name = $expected.Name',
  '    ok = ($bytesMatch -and $hashMatch)',
  '    exists = $true',
  '    expectedBytes = [int64]$expected.Bytes',
  '    actualBytes = [int64]$item.Length',
  '    bytesMatch = $bytesMatch',
  '    expectedSha256 = $expected.Sha256',
  '    actualSha256 = $actualSha256',
  '    hashMatch = $hashMatch',
  '    error = $null',
  '  }',
  '}',
  '',
  '$ok = -not (@($results) | Where-Object { -not $_.ok } | Select-Object -First 1)',
  '[ordered]@{',
  '  ok = $ok',
  '  checkedAt = (Get-Date).ToUniversalTime().ToString(''o'')',
  '  directory = $scriptDir',
  '  files = @($results)',
  '} | ConvertTo-Json -Depth 6',
  '',
  'if (-not $ok) {',
  '  exit 2',
  '}'
)
Set-TextFileWithRetry -Path $verifyScriptPath -Value $verifyScriptLines

$checklistPath = Join-Path $targetDir 'KPI-transfer-checklist.md'
$createdAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
$checklist = @"
# KPI transfer checklist

Created: $createdAt

This folder contains the two current transfer zip files.

1. Bring this to the office now to collect the missing original attachments:
   $($documentKit.Name)
   bytes: $($documentKitTargetItem.Length)
   sha256: $documentKitSha256

2. Keep this package for the day you return the home work back to the office:
   $($officeReturnPackage.Name)
   bytes: $($officeReturnTargetItem.Length)
   sha256: $officeReturnSha256

Optional integrity check:

Run these from this transfer folder:
   powershell -ExecutionPolicy Bypass -File .\$verifyScriptName
   Get-FileHash -Algorithm SHA256 .\$($documentKit.Name)
   Get-FileHash -Algorithm SHA256 .\$($officeReturnPackage.Name)

Office attachment collection:

1. Extract $($documentKit.Name) on the office PC.
2. Run a preview from the extracted folder:
   powershell -ExecutionPolicy Bypass -File .\package-document-storage.ps1 -SourcePath "<office KPI storage files path>"

   SourcePath can also be the old KPI-Server root or another folder that contains the original attachment files.
3. If the preview finds the files, create the package:
   powershell -ExecutionPolicy Bypass -File .\package-document-storage.ps1 -SourcePath "<office KPI storage files path>" -Force
4. Bring the created document-storage-package-*.zip back to this home PC.
5. Put it in this KPI-TRANSFER-KITS folder, then restore it from KPI-LOCAL\kpi-runtime\internal-server:
   npm run restore-package:document-storage -- -Force

   Or pass the path explicitly:
   npm run restore-package:document-storage -- -PackagePath "<document-storage-package zip path>" -Force
6. Confirm home storage is complete:
   npm run verify:document-storage

Office return after home work is done:

1. On the home PC, create a fresh package right before leaving:
   npm run package:office-return
2. Re-run this collector so the transfer folder has the newest zip:
   npm run prepare:transfer-kits
3. On the office PC, preview the office return package from KPI-LOCAL\kpi-runtime\internal-server:
   npm run restore-package:office-return -- -PackagePath "<office-return-package zip path>"
4. If preview says the DB dump and storage zip are readable, hashes match, and database.baselineComparison.matches is true, review database.packageDeltaFromBaseline, then apply:
   npm run restore-package:office-return -- -PackagePath "<office-return-package zip path>" -Force -ConfirmOfficeDbUnchanged

Important:

- Do not apply office-return-package if someone changed the office DB while you were working at home.
- If database.baselineComparison.matches is false, review the mismatched tables before deciding whether to use -AllowOfficeDbDrift.
- The office return restore keeps existing office user password hashes for matching users, because the Excel export does not contain password hashes.
- The current home PC is still missing 127 original attachment files until document-storage-package-*.zip is restored.
"@
try {
  Set-TextFileWithRetry -Path $checklistPath -Value $checklist
} catch {
  $checklistPath = Join-Path $targetDir "KPI-transfer-checklist-$transferTimestamp.md"
  Set-TextFileWithRetry -Path $checklistPath -Value $checklist
}

$staleCleanup = @()
$keepGeneratedPaths = @($checklistPath, $verifyScriptPath)
$staleCandidates = @()
$staleCandidates += @(Get-ChildItem -LiteralPath $targetDir -Filter 'KPI-transfer-checklist-*.md' -File -ErrorAction SilentlyContinue)
$defaultChecklist = Join-Path $targetDir 'KPI-transfer-checklist.md'
if (Test-Path $defaultChecklist -PathType Leaf) {
  $staleCandidates += Get-Item -LiteralPath $defaultChecklist
}
$staleCandidates += @(Get-ChildItem -LiteralPath $targetDir -Filter 'verify-transfer-kits-*.ps1' -File -ErrorAction SilentlyContinue)
$defaultVerifyScript = Join-Path $targetDir 'verify-transfer-kits.ps1'
if (Test-Path $defaultVerifyScript -PathType Leaf) {
  $staleCandidates += Get-Item -LiteralPath $defaultVerifyScript
}
foreach ($candidate in ($staleCandidates | Sort-Object FullName -Unique)) {
  $staleCleanup += Remove-StaleGeneratedFile -Path $candidate.FullName -KeepPaths $keepGeneratedPaths
}

[ordered]@{
  ok = $true
  outputDir = $targetDir
  checklistPath = $checklistPath
  verifyScriptPath = $verifyScriptPath
  staleCleanup = $staleCleanup
  documentStorageExportKit = $documentKitTarget
  documentStorageExportKitBytes = $documentKitTargetItem.Length
  documentStorageExportKitSha256 = $documentKitSha256
  officeReturnPackage = $officeReturnTarget
  officeReturnPackageBytes = $officeReturnTargetItem.Length
  officeReturnPackageSha256 = $officeReturnSha256
} | ConvertTo-Json -Depth 5
