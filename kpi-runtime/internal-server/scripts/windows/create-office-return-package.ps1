param(
  [string]$OutputPath = ''
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

function Get-EnvFilePaths {
  param([string]$ServerDir)

  $candidatePaths = @(
    (Join-Path $ServerDir '.env.production.local'),
    (Join-Path $ServerDir '.env.development.local'),
    (Join-Path $ServerDir '.env')
  )

  return @($candidatePaths | Select-Object -Unique)
}

function Get-EnvFileValue {
  param(
    [string]$ServerDir,
    [string]$Key
  )

  foreach ($candidatePath in Get-EnvFilePaths -ServerDir $ServerDir) {
    if (-not (Test-Path $candidatePath)) {
      continue
    }

    foreach ($line in Get-Content -Path $candidatePath -Encoding utf8) {
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

function ConvertTo-RedactedDatabaseUrl {
  param([string]$DatabaseUrl)

  if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    return ''
  }

  return ($DatabaseUrl -replace '://([^:/@]+):([^@]+)@', '://$1:***@')
}

function Get-FileSha256 {
  param([string]$Path)

  if (-not (Test-Path $Path -PathType Leaf)) {
    return $null
  }

  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Invoke-JsonPowerShellScript {
  param(
    [string]$ScriptPath,
    [string[]]$ArgumentList
  )

  $raw = & powershell -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "script_failed: $ScriptPath exit $LASTEXITCODE"
  }

  $json = ($raw | Out-String).Trim()
  if ([string]::IsNullOrWhiteSpace($json)) {
    throw "script_returned_empty_json: $ScriptPath"
  }

  return $json | ConvertFrom-Json
}

function Invoke-JsonNodeScript {
  param(
    [string]$ScriptPath,
    [string[]]$ArgumentList
  )

  $raw = & node $ScriptPath @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "script_failed: $ScriptPath exit $LASTEXITCODE"
  }

  $json = ($raw | Out-String).Trim()
  if ([string]::IsNullOrWhiteSpace($json)) {
    throw "script_returned_empty_json: $ScriptPath"
  }

  return $json | ConvertFrom-Json
}

function Read-JsonFile {
  param([string]$Path)

  if (-not (Test-Path $Path -PathType Leaf)) {
    return $null
  }

  return Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$storageRoot = Get-ConfiguredStorageRoot -ServerDir $serverDir
$filesRoot = Join-Path $storageRoot 'files'
$packageRoot = Join-Path $storageRoot 'office-return-packages'
$targetPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  Join-Path $packageRoot "office-return-package-$timestamp.zip"
} elseif ([System.IO.Path]::IsPathRooted($OutputPath)) {
  [System.IO.Path]::GetFullPath($OutputPath)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $serverDir $OutputPath))
}

$stageRoot = Join-Path $storageRoot "tmp\office-return-package-$timestamp"
$databaseDir = Join-Path $stageRoot 'database'
$storageDir = Join-Path $stageRoot 'storage'
$toolsDir = Join-Path $stageRoot 'tools'
$dumpPath = Join-Path $databaseDir 'kpi-home-return.dump'
$databaseFingerprintPath = Join-Path $databaseDir 'kpi-home-return.fingerprint.json'
$officeBaselineFingerprintSourcePath = Join-Path $storageRoot 'office-import-baseline\database-fingerprint.json'
$officeBaselineFingerprintPackagePath = Join-Path $databaseDir 'office-import-baseline.fingerprint.json'
$storageZipPath = Join-Path $storageDir 'storage-files.zip'
$restoreScriptPath = Join-Path $serverDir 'scripts\windows\restore-office-return-package.ps1'
$backupDumpScriptPath = Join-Path $serverDir 'scripts\windows\backup-postgres-dump.ps1'
$fingerprintScriptPath = Join-Path $serverDir 'src\scripts\fingerprintDatabaseState.js'

if (-not (Test-Path $backupDumpScriptPath)) {
  throw "backup-postgres-dump.ps1 not found: $backupDumpScriptPath"
}
if (-not (Test-Path $restoreScriptPath)) {
  throw "restore-office-return-package.ps1 not found: $restoreScriptPath"
}
if (-not (Test-Path $fingerprintScriptPath)) {
  throw "fingerprintDatabaseState.js not found: $fingerprintScriptPath"
}

if (Test-Path $stageRoot) {
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $databaseDir -Force | Out-Null
New-Item -ItemType Directory -Path $storageDir -Force | Out-Null
New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($targetPath)) -Force | Out-Null

$dumpSummary = Invoke-JsonPowerShellScript -ScriptPath $backupDumpScriptPath -ArgumentList @('-OutputPath', $dumpPath)
$databaseFingerprint = Invoke-JsonNodeScript -ScriptPath $fingerprintScriptPath -ArgumentList @(
  '--label=home-return-package',
  "--output=$databaseFingerprintPath",
  '--source-file=../../KPI-DB-export.xlsx'
)
$databaseUrl = if ($env:KPI_DATABASE_URL) {
  $env:KPI_DATABASE_URL
} else {
  Get-EnvFileValue -ServerDir $serverDir -Key 'KPI_DATABASE_URL'
}

$officeBaselineFingerprint = $null
if (Test-Path $officeBaselineFingerprintSourcePath -PathType Leaf) {
  Copy-Item -LiteralPath $officeBaselineFingerprintSourcePath -Destination $officeBaselineFingerprintPackagePath -Force
  $officeBaselineFingerprint = Read-JsonFile -Path $officeBaselineFingerprintSourcePath
}

$storageFiles = @()
if (Test-Path $filesRoot) {
  $storageFiles = @(Get-ChildItem -LiteralPath $filesRoot -File -Recurse -ErrorAction SilentlyContinue)
}
$storageBytes = ($storageFiles | Measure-Object -Property Length -Sum).Sum
if ($null -eq $storageBytes) {
  $storageBytes = 0
}

if ($storageFiles.Count -gt 0) {
  Compress-Archive -Path (Join-Path $filesRoot '*') -DestinationPath $storageZipPath -Force
}

Copy-Item -LiteralPath $restoreScriptPath -Destination (Join-Path $stageRoot 'restore-office-return-package.ps1') -Force
Copy-Item -LiteralPath $fingerprintScriptPath -Destination (Join-Path $toolsDir 'fingerprintDatabaseState.js') -Force

$manifest = [ordered]@{
  ok = $true
  packageType = 'kpi-office-return'
  createdAt = (Get-Date).ToUniversalTime().ToString('o')
  source = [ordered]@{
    serverDir = $serverDir
    storageRoot = $storageRoot
    databaseUrl = ConvertTo-RedactedDatabaseUrl -DatabaseUrl $databaseUrl
  }
  database = [ordered]@{
    dumpRelativePath = 'database/kpi-home-return.dump'
    bytes = [int64]$dumpSummary.bytes
    sha256 = Get-FileSha256 -Path $dumpPath
    fingerprintRelativePath = 'database/kpi-home-return.fingerprint.json'
    fingerprintSummarySha256 = $databaseFingerprint.summary.sha256
    databaseName = $dumpSummary.databaseName
    databaseHost = $dumpSummary.databaseHost
    databasePort = $dumpSummary.databasePort
    createdAt = $dumpSummary.createdAt
  }
  storage = [ordered]@{
    filesRoot = $filesRoot
    zipRelativePath = if ($storageFiles.Count -gt 0) { 'storage/storage-files.zip' } else { $null }
    fileCount = $storageFiles.Count
    totalBytes = [int64]$storageBytes
    sha256 = if ($storageFiles.Count -gt 0) { Get-FileSha256 -Path $storageZipPath } else { $null }
  }
  restore = [ordered]@{
    script = 'restore-office-return-package.ps1'
    previewCommand = 'npm run restore-package:office-return -- -PackagePath "<office-return-package.zip>"'
    applyCommand = 'npm run restore-package:office-return -- -PackagePath "<office-return-package.zip>" -Force -ConfirmOfficeDbUnchanged'
    note = 'This package is intended to replace the office DB with the home working DB after taking an office-side backup, then merge home storage files into office storage. The restore script requires -ConfirmOfficeDbUnchanged for DB restore so it is not applied blindly over office-side edits, and it preserves existing office app_users.password_hash values for matching users.'
  }
  safety = [ordered]@{
    officeBaselineFingerprintRelativePath = if ($officeBaselineFingerprint) { 'database/office-import-baseline.fingerprint.json' } else { $null }
    officeBaselineSummarySha256 = if ($officeBaselineFingerprint) { $officeBaselineFingerprint.summary.sha256 } else { $null }
    databaseFingerprintScript = 'tools/fingerprintDatabaseState.js'
    databaseRestoreRequires = @('-Force', '-ConfirmOfficeDbUnchanged')
    databaseDriftOverride = '-AllowOfficeDbDrift'
    passwordHashPreservation = 'Before DB restore, office app_users.password_hash values are exported and then reapplied after restore for users matched by id or username.'
    note = 'Preview compares the current office DB against the office import baseline when the baseline is available. Apply is blocked on mismatch unless -AllowOfficeDbDrift is explicitly supplied.'
  }
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $stageRoot 'manifest.json') -Encoding utf8

$readmeTemplate = @'
# KPI office return package

Created: {0}

Use this package when moving the prepared KPI server DB back to the office PC.

Preview on the office PC from `kpi-runtime\internal-server`:

```powershell
npm run restore-package:office-return -- -PackagePath "<path to this zip>"
```

Apply on the office PC after preview:

```powershell
npm run restore-package:office-return -- -PackagePath "<path to this zip>" -Force -ConfirmOfficeDbUnchanged
```

Only add `-ConfirmOfficeDbUnchanged` after confirming nobody changed the office DB while the home copy was being edited. If you only want to merge returned files and leave the office DB intact, use `-SkipDatabase`.

The restore script backs up the office DB first. It also backs up the office file storage before merging the files in `storage/storage-files.zip`.
It preserves existing office `app_users.password_hash` values for matching users after the DB restore, because the Excel export used to build the home copy does not carry office password hashes.

Preview compares the current office DB with the office-import baseline fingerprint when this package contains one. If the preview reports a DB drift mismatch, do not apply the package unless you intentionally reviewed and accepted the office-side changes.
Preview also shows the home return package delta from that baseline, so you can see which tables differ before applying a full DB restore.

If you run the bundled script from an extracted package instead of the repo script, pass the office server directory explicitly:

```powershell
powershell -ExecutionPolicy Bypass -File .\restore-office-return-package.ps1 -ServerDir "<office KPI-Server>\kpi-runtime\internal-server" -PackagePath "<path to this zip>" -Force -ConfirmOfficeDbUnchanged
```
'@
$readme = $readmeTemplate -f $manifest.createdAt
$readme | Set-Content -LiteralPath (Join-Path $stageRoot 'README.md') -Encoding utf8

if (Test-Path $targetPath) {
  Remove-Item -LiteralPath $targetPath -Force
}
Compress-Archive -Path (Join-Path $stageRoot '*') -DestinationPath $targetPath -Force

$packageFile = Get-Item -LiteralPath $targetPath

[ordered]@{
  ok = $true
  packagePath = $packageFile.FullName
  bytes = $packageFile.Length
  createdAt = $manifest.createdAt
  databaseDumpBytes = [int64]$dumpSummary.bytes
  databaseFingerprintSummarySha256 = $databaseFingerprint.summary.sha256
  officeBaselineFingerprintIncluded = [bool]$officeBaselineFingerprint
  officeBaselineFingerprintSummarySha256 = if ($officeBaselineFingerprint) { $officeBaselineFingerprint.summary.sha256 } else { $null }
  storageFileCount = $storageFiles.Count
  storageBytes = [int64]$storageBytes
  restorePreviewCommand = "npm run restore-package:office-return -- -PackagePath `"$($packageFile.FullName)`""
  restoreApplyCommand = "npm run restore-package:office-return -- -PackagePath `"$($packageFile.FullName)`" -Force -ConfirmOfficeDbUnchanged"
} | ConvertTo-Json -Depth 5
