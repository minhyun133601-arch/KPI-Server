param(
  [string]$PackagePath = '',
  [string]$ServerDir = '',
  [switch]$Force,
  [switch]$ConfirmOfficeDbUnchanged,
  [switch]$AllowOfficeDbDrift,
  [switch]$OverwriteStorage,
  [switch]$SkipDatabase,
  [switch]$SkipStorage
)

$ErrorActionPreference = 'Stop'

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

function Resolve-ServerDir {
  param([string]$ExplicitServerDir)

  if (-not [string]::IsNullOrWhiteSpace($ExplicitServerDir)) {
    return (Resolve-Path $ExplicitServerDir).Path
  }

  $candidate = Join-Path $PSScriptRoot '..\..'
  $packageJson = Join-Path $candidate 'package.json'
  if (Test-Path $packageJson) {
    return (Resolve-Path $candidate).Path
  }

  $cwdPackageJson = Join-Path (Get-Location).Path 'package.json'
  if (Test-Path $cwdPackageJson) {
    return (Resolve-Path (Get-Location).Path).Path
  }

  throw 'ServerDir is required when running this script outside kpi-runtime\internal-server.'
}

function Get-EnvFilePaths {
  param([string]$ServerDir)

  $candidatePaths = @(
    (Join-Path $ServerDir '.env.production.local'),
    (Join-Path $ServerDir '.env.development.local'),
    (Join-Path $ServerDir '.env.local-experiment'),
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

function Convert-DatabaseUrl {
  param([string]$DatabaseUrl)

  $uri = [Uri]$DatabaseUrl
  if ($uri.Scheme -notin @('postgres', 'postgresql')) {
    throw "unsupported_database_url_scheme: $($uri.Scheme)"
  }

  $user = ''
  $password = ''
  if (-not [string]::IsNullOrWhiteSpace($uri.UserInfo)) {
    $userParts = $uri.UserInfo.Split(':', 2)
    $user = [Uri]::UnescapeDataString($userParts[0])
    if ($userParts.Length -gt 1) {
      $password = [Uri]::UnescapeDataString($userParts[1])
    }
  }

  $databaseName = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrWhiteSpace($databaseName)) {
    throw 'database_name_missing'
  }

  return [ordered]@{
    host = $uri.Host
    port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
    user = $user
    password = $password
    databaseName = $databaseName
  }
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

function Resolve-PostgresToolPath {
  param(
    [string]$ServerDir,
    [string]$ToolName
  )

  $configuredBinDir = Get-EnvFileValue -ServerDir $ServerDir -Key 'KPI_POSTGRES_BIN_DIR'
  if (-not [string]::IsNullOrWhiteSpace($env:KPI_POSTGRES_BIN_DIR)) {
    $configuredBinDir = $env:KPI_POSTGRES_BIN_DIR
  }
  if (-not [string]::IsNullOrWhiteSpace($configuredBinDir)) {
    $configuredPath = Convert-ToAbsolutePath -BaseDir $ServerDir -PathValue (Join-Path $configuredBinDir "$ToolName.exe")
    if (Test-Path $configuredPath) {
      return (Resolve-Path $configuredPath).Path
    }
  }

  $pathCommand = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($pathCommand) {
    return $pathCommand.Source
  }

  $candidatePaths = @()
  if (-not [string]::IsNullOrWhiteSpace($env:ProgramFiles)) {
    $candidatePaths += Join-Path $env:ProgramFiles "PostgreSQL\17\bin\$ToolName.exe"
    $candidatePaths += Join-Path $env:ProgramFiles "PostgreSQL\16\bin\$ToolName.exe"
    $candidatePaths += Join-Path $env:ProgramFiles "PostgreSQL\15\bin\$ToolName.exe"
  }

  foreach ($candidatePath in $candidatePaths) {
    if (Test-Path $candidatePath) {
      return (Resolve-Path $candidatePath).Path
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($env:ProgramFiles)) {
    $recursiveCandidate = Get-ChildItem -Path (Join-Path $env:ProgramFiles 'PostgreSQL') -Recurse -Filter "$ToolName.exe" -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -like "*\bin\$ToolName.exe" } |
      Sort-Object FullName -Descending |
      Select-Object -First 1
    if ($recursiveCandidate) {
      return $recursiveCandidate.FullName
    }
  }

  throw "$ToolName`_not_found"
}

function Test-PostgresDumpReadable {
  param(
    [string]$ServerDir,
    [string]$DumpPath,
    [string]$ExpectedSha256
  )

  $exists = Test-Path $DumpPath -PathType Leaf
  $actualSha256 = Get-FileSha256 -Path $DumpPath
  $hashMatches = if ([string]::IsNullOrWhiteSpace($ExpectedSha256)) {
    $null
  } else {
    $actualSha256 -eq $ExpectedSha256.ToLowerInvariant()
  }

  if (-not $exists) {
    return [ordered]@{
      exists = $false
      readable = $false
      sha256 = $actualSha256
      expectedSha256 = $ExpectedSha256
      hashMatches = $hashMatches
      error = 'dump_not_found'
    }
  }

  try {
    $pgRestorePath = Resolve-PostgresToolPath -ServerDir $ServerDir -ToolName 'pg_restore'
    $raw = & $pgRestorePath --list $DumpPath 2>&1
    $exitCode = $LASTEXITCODE
    $lines = @($raw | ForEach-Object { [string]$_ })
    $tocEntries = ($lines | Where-Object { $_ -match '^\d+;' }).Count
    return [ordered]@{
      exists = $true
      readable = ($exitCode -eq 0)
      sha256 = $actualSha256
      expectedSha256 = $ExpectedSha256
      hashMatches = $hashMatches
      tocEntries = $tocEntries
      pgRestorePath = $pgRestorePath
      error = if ($exitCode -eq 0) { $null } else { ($lines -join "`n") }
    }
  } catch {
    return [ordered]@{
      exists = $true
      readable = $false
      sha256 = $actualSha256
      expectedSha256 = $ExpectedSha256
      hashMatches = $hashMatches
      error = $_.Exception.Message
    }
  }
}

function Test-ZipArchiveReadable {
  param(
    [string]$ZipPath,
    [string]$ExpectedSha256
  )

  $exists = Test-Path $ZipPath -PathType Leaf
  $actualSha256 = Get-FileSha256 -Path $ZipPath
  $hashMatches = if ([string]::IsNullOrWhiteSpace($ExpectedSha256)) {
    $null
  } else {
    $actualSha256 -eq $ExpectedSha256.ToLowerInvariant()
  }

  if (-not $exists) {
    return [ordered]@{
      exists = $false
      readable = $false
      sha256 = $actualSha256
      expectedSha256 = $ExpectedSha256
      hashMatches = $hashMatches
      entryCount = 0
      totalBytes = 0
      error = 'zip_not_found'
    }
  }

  try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
      $entries = @($archive.Entries)
      $totalBytes = ($entries | Measure-Object -Property Length -Sum).Sum
      if ($null -eq $totalBytes) {
        $totalBytes = 0
      }
      return [ordered]@{
        exists = $true
        readable = $true
        sha256 = $actualSha256
        expectedSha256 = $ExpectedSha256
        hashMatches = $hashMatches
        entryCount = $entries.Count
        totalBytes = [int64]$totalBytes
        error = $null
      }
    } finally {
      $archive.Dispose()
    }
  } catch {
    return [ordered]@{
      exists = $true
      readable = $false
      sha256 = $actualSha256
      expectedSha256 = $ExpectedSha256
      hashMatches = $hashMatches
      entryCount = 0
      totalBytes = 0
      error = $_.Exception.Message
    }
  }
}

function Read-JsonFile {
  param([string]$Path)

  if (-not (Test-Path $Path -PathType Leaf)) {
    return $null
  }

  return Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Resolve-DatabaseFingerprintScriptPath {
  param(
    [string]$ServerDir,
    [string]$PackageRoot
  )

  $serverScript = Join-Path $ServerDir 'src\scripts\fingerprintDatabaseState.js'
  if (Test-Path $serverScript -PathType Leaf) {
    return $serverScript
  }

  $packageScript = Join-Path $PackageRoot 'tools\fingerprintDatabaseState.js'
  if (Test-Path $packageScript -PathType Leaf) {
    return $packageScript
  }

  return ''
}

function Invoke-DatabaseFingerprint {
  param(
    [string]$ServerDir,
    [string]$PackageRoot,
    [string]$OutputPath,
    [string]$Label
  )

  $scriptPath = Resolve-DatabaseFingerprintScriptPath -ServerDir $ServerDir -PackageRoot $PackageRoot
  if ([string]::IsNullOrWhiteSpace($scriptPath)) {
    return [ordered]@{
      ok = $false
      skipped = $true
      reason = 'fingerprintDatabaseState.js_not_found'
    }
  }

  try {
    $raw = & node $scriptPath "--server-dir=$ServerDir" "--output=$OutputPath" "--label=$Label"
    $exitCode = $LASTEXITCODE
    $json = ($raw | Out-String).Trim()
    $parsed = $null
    if (-not [string]::IsNullOrWhiteSpace($json)) {
      $parsed = $json | ConvertFrom-Json
    }

    return [ordered]@{
      ok = ($exitCode -eq 0)
      skipped = $false
      exitCode = $exitCode
      scriptPath = $scriptPath
      result = $parsed
    }
  } catch {
    return [ordered]@{
      ok = $false
      skipped = $false
      scriptPath = $scriptPath
      error = $_.Exception.Message
    }
  }
}

function Compare-DatabaseFingerprints {
  param(
    [object]$Baseline,
    [object]$Current
  )

  if ($null -eq $Baseline) {
    return [ordered]@{
      available = $false
      matches = $null
      reason = 'baseline_fingerprint_not_found'
    }
  }
  if ($null -eq $Current) {
    return [ordered]@{
      available = $false
      matches = $null
      reason = 'current_fingerprint_not_available'
    }
  }

  $baselineTables = @{}
  foreach ($table in @($Baseline.tables)) {
    $baselineTables[$table.name] = $table
  }

  $currentTables = @{}
  foreach ($table in @($Current.tables)) {
    $currentTables[$table.name] = $table
  }

  $tableNames = @($baselineTables.Keys + $currentTables.Keys) | Sort-Object -Unique
  $mismatchedTables = @()
  foreach ($tableName in $tableNames) {
    $baselineTable = $baselineTables[$tableName]
    $currentTable = $currentTables[$tableName]
    if ($null -eq $baselineTable -or $null -eq $currentTable) {
      $mismatchedTables += [ordered]@{
        table = $tableName
        reason = 'table_missing_on_one_side'
        baselineRowCount = if ($baselineTable) { $baselineTable.rowCount } else { $null }
        currentRowCount = if ($currentTable) { $currentTable.rowCount } else { $null }
        baselineSha256 = if ($baselineTable) { $baselineTable.sha256 } else { $null }
        currentSha256 = if ($currentTable) { $currentTable.sha256 } else { $null }
      }
      continue
    }

    if (($baselineTable.rowCount -ne $currentTable.rowCount) -or ($baselineTable.sha256 -ne $currentTable.sha256)) {
      $mismatchedTables += [ordered]@{
        table = $tableName
        reason = 'table_fingerprint_mismatch'
        baselineRowCount = $baselineTable.rowCount
        currentRowCount = $currentTable.rowCount
        baselineSha256 = $baselineTable.sha256
        currentSha256 = $currentTable.sha256
      }
    }
  }

  return [ordered]@{
    available = $true
    matches = ($mismatchedTables.Count -eq 0)
    fingerprintVersion = $Baseline.fingerprintVersion
    baselineSummarySha256 = $Baseline.summary.sha256
    currentSummarySha256 = $Current.summary.sha256
    baselineTotalRows = $Baseline.summary.totalRows
    currentTotalRows = $Current.summary.totalRows
    mismatchedTableCount = $mismatchedTables.Count
    mismatchedTables = $mismatchedTables
  }
}

function Invoke-PostgresDump {
  param(
    [string]$ServerDir,
    [string]$DatabaseUrl,
    [string]$OutputPath
  )

  $pgDumpPath = Resolve-PostgresToolPath -ServerDir $ServerDir -ToolName 'pg_dump'
  $connection = Convert-DatabaseUrl -DatabaseUrl $DatabaseUrl
  $previousPgPassword = $env:PGPASSWORD
  try {
    if (-not [string]::IsNullOrEmpty($connection.password)) {
      $env:PGPASSWORD = $connection.password
    }

    $arguments = @(
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      "--file=$OutputPath",
      "--host=$($connection.host)",
      "--port=$($connection.port)"
    )
    if (-not [string]::IsNullOrWhiteSpace($connection.user)) {
      $arguments += "--username=$($connection.user)"
    }
    $arguments += "--dbname=$($connection.databaseName)"

    & $pgDumpPath @arguments
    if ($LASTEXITCODE -ne 0) {
      throw "pg_dump_failed: exit $LASTEXITCODE"
    }
  } finally {
    $env:PGPASSWORD = $previousPgPassword
  }

  return (Get-Item -LiteralPath $OutputPath).FullName
}

function Invoke-PostgresRestore {
  param(
    [string]$ServerDir,
    [string]$DatabaseUrl,
    [string]$DumpPath
  )

  $pgRestorePath = Resolve-PostgresToolPath -ServerDir $ServerDir -ToolName 'pg_restore'
  $connection = Convert-DatabaseUrl -DatabaseUrl $DatabaseUrl
  $previousPgPassword = $env:PGPASSWORD
  try {
    if (-not [string]::IsNullOrEmpty($connection.password)) {
      $env:PGPASSWORD = $connection.password
    }

    $arguments = @(
      '--clean',
      '--if-exists',
      '--exit-on-error',
      '--single-transaction',
      '--no-owner',
      '--no-privileges',
      "--host=$($connection.host)",
      "--port=$($connection.port)"
    )
    if (-not [string]::IsNullOrWhiteSpace($connection.user)) {
      $arguments += "--username=$($connection.user)"
    }
    $arguments += "--dbname=$($connection.databaseName)"
    $arguments += $DumpPath

    & $pgRestorePath @arguments
    if ($LASTEXITCODE -ne 0) {
      throw "pg_restore_failed: exit $LASTEXITCODE"
    }
  } finally {
    $env:PGPASSWORD = $previousPgPassword
  }

  return $true
}

function Escape-PsqlSingleQuoted {
  param([string]$Value)

  return ([string]$Value).Replace("'", "''")
}

function Invoke-PostgresScriptFile {
  param(
    [string]$ServerDir,
    [string]$DatabaseUrl,
    [string]$ScriptPath
  )

  $psqlPath = Resolve-PostgresToolPath -ServerDir $ServerDir -ToolName 'psql'
  $connection = Convert-DatabaseUrl -DatabaseUrl $DatabaseUrl
  $previousPgPassword = $env:PGPASSWORD
  try {
    if (-not [string]::IsNullOrEmpty($connection.password)) {
      $env:PGPASSWORD = $connection.password
    }

    $arguments = @(
      '--set=ON_ERROR_STOP=1',
      "--host=$($connection.host)",
      "--port=$($connection.port)"
    )
    if (-not [string]::IsNullOrWhiteSpace($connection.user)) {
      $arguments += "--username=$($connection.user)"
    }
    $arguments += "--dbname=$($connection.databaseName)"
    $arguments += "--file=$ScriptPath"

    $raw = & $psqlPath @arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "psql_failed: exit $LASTEXITCODE`n$($raw -join "`n")"
    }
    return @($raw | ForEach-Object { [string]$_ })
  } finally {
    $env:PGPASSWORD = $previousPgPassword
  }
}

function Export-OfficeUserPasswordHashes {
  param(
    [string]$ServerDir,
    [string]$DatabaseUrl,
    [string]$OutputPath,
    [string]$WorkRoot
  )

  New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($OutputPath)) -Force | Out-Null
  New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null

  $escapedOutputPath = Escape-PsqlSingleQuoted -Value $OutputPath
  $scriptPath = Join-Path $WorkRoot 'export-office-user-password-hashes.sql'
  @"
\copy (select id::text as id, username, password_hash from app_users order by id) to '$escapedOutputPath' with (format csv, header true, encoding 'UTF8')
"@ | Set-Content -LiteralPath $scriptPath -Encoding UTF8

  Invoke-PostgresScriptFile -ServerDir $ServerDir -DatabaseUrl $DatabaseUrl -ScriptPath $scriptPath | Out-Null
  $exportFile = Get-Item -LiteralPath $OutputPath
  $rowCount = [Math]::Max(0, @((Import-Csv -LiteralPath $OutputPath)).Count)

  return [ordered]@{
    ok = $true
    path = $exportFile.FullName
    bytes = $exportFile.Length
    rowCount = $rowCount
  }
}

function Restore-OfficeUserPasswordHashes {
  param(
    [string]$ServerDir,
    [string]$DatabaseUrl,
    [string]$BackupPath,
    [string]$WorkRoot
  )

  if (-not (Test-Path $BackupPath -PathType Leaf)) {
    return [ordered]@{
      ok = $false
      restoredCount = 0
      reason = 'password_hash_backup_not_found'
    }
  }

  New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null
  $escapedBackupPath = Escape-PsqlSingleQuoted -Value $BackupPath
  $resultPath = Join-Path $WorkRoot 'restore-office-user-password-hashes-result.csv'
  $escapedResultPath = Escape-PsqlSingleQuoted -Value $resultPath
  $scriptPath = Join-Path $WorkRoot 'restore-office-user-password-hashes.sql'
  @"
create temp table office_user_password_hash_restore (
  id uuid,
  username text,
  password_hash text
);
\copy office_user_password_hash_restore (id, username, password_hash) from '$escapedBackupPath' with (format csv, header true, encoding 'UTF8')
create temp table office_user_password_hash_matched as
select distinct target.id::text as id, target.username
  from app_users target
  join office_user_password_hash_restore source
    on target.id = source.id
    or target.username = source.username;
update app_users target
   set password_hash = source.password_hash
  from office_user_password_hash_restore source
 where target.id = source.id
    or target.username = source.username;
\copy (select id, username from office_user_password_hash_matched order by username) to '$escapedResultPath' with (format csv, header true, encoding 'UTF8')
"@ | Set-Content -LiteralPath $scriptPath -Encoding UTF8

  Invoke-PostgresScriptFile -ServerDir $ServerDir -DatabaseUrl $DatabaseUrl -ScriptPath $scriptPath | Out-Null
  $restoredRows = if (Test-Path $resultPath -PathType Leaf) { @(Import-Csv -LiteralPath $resultPath) } else { @() }

  return [ordered]@{
    ok = $true
    backupPath = $BackupPath
    restoredCount = $restoredRows.Count
    resultPath = $resultPath
  }
}

function Get-RelativePath {
  param(
    [string]$Root,
    [string]$FullPath
  )

  $rootPath = [System.IO.Path]::GetFullPath($Root).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
  $full = [System.IO.Path]::GetFullPath($FullPath)
  $rootUri = New-Object System.Uri($rootPath)
  $fullUri = New-Object System.Uri($full)
  return [Uri]::UnescapeDataString($rootUri.MakeRelativeUri($fullUri).ToString()).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
}

function Resolve-PackagePath {
  param(
    [string]$ExplicitPath,
    [string]$ServerDir,
    [string]$StorageRoot
  )

  if (-not [string]::IsNullOrWhiteSpace($ExplicitPath)) {
    if ([System.IO.Path]::IsPathRooted($ExplicitPath)) {
      return [System.IO.Path]::GetFullPath($ExplicitPath)
    }
    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $ExplicitPath))
  }

  $searchRoots = @(
    (Get-Location).Path,
    (Join-Path $StorageRoot 'office-return-packages'),
    (Join-Path ([Environment]::GetFolderPath('Desktop')) ''),
    (Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads'),
    (Join-Path ([Environment]::GetFolderPath('MyDocuments')) '')
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) -and (Test-Path $_) } | Select-Object -Unique

  $candidates = @()
  foreach ($root in $searchRoots) {
    $candidates += @(Get-ChildItem -LiteralPath $root -Filter 'office-return-package*.zip' -File -ErrorAction SilentlyContinue)
  }
  $candidate = $candidates | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($candidate) {
    return $candidate.FullName
  }

  throw 'PackagePath is required, or place office-return-package*.zip in the current directory, Desktop, Downloads, Documents, or storage\office-return-packages.'
}

function Resolve-PackageRoot {
  param(
    [string]$PackagePath,
    [string]$ExtractRoot
  )

  if (Test-Path $PackagePath -PathType Container) {
    return (Resolve-Path $PackagePath).Path
  }

  if (-not (Test-Path $PackagePath -PathType Leaf)) {
    throw "package_not_found: $PackagePath"
  }

  if (Test-Path $ExtractRoot) {
    Remove-Item -LiteralPath $ExtractRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Path $ExtractRoot -Force | Out-Null
  Expand-Archive -LiteralPath $PackagePath -DestinationPath $ExtractRoot -Force
  return $ExtractRoot
}

function Copy-StorageFiles {
  param(
    [string]$StorageZipPath,
    [string]$FilesRoot,
    [string]$WorkRoot,
    [bool]$Overwrite
  )

  if (-not (Test-Path $StorageZipPath -PathType Leaf)) {
    return [ordered]@{
      restored = 0
      skippedExisting = 0
      sourceFileCount = 0
      note = 'storage_zip_not_found'
    }
  }

  $extractRoot = Join-Path $WorkRoot 'storage-files'
  if (Test-Path $extractRoot) {
    Remove-Item -LiteralPath $extractRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Path $extractRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $FilesRoot -Force | Out-Null
  Expand-Archive -LiteralPath $StorageZipPath -DestinationPath $extractRoot -Force

  $sourceFiles = @(Get-ChildItem -LiteralPath $extractRoot -File -Recurse -ErrorAction SilentlyContinue)
  $restored = 0
  $skippedExisting = 0
  foreach ($file in $sourceFiles) {
    $relative = Get-RelativePath -Root $extractRoot -FullPath $file.FullName
    $target = Join-Path $FilesRoot $relative
    $targetDir = [System.IO.Path]::GetDirectoryName($target)
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    if ((Test-Path $target -PathType Leaf) -and -not $Overwrite) {
      $skippedExisting += 1
      continue
    }
    Copy-Item -LiteralPath $file.FullName -Destination $target -Force
    $restored += 1
  }

  return [ordered]@{
    restored = $restored
    skippedExisting = $skippedExisting
    sourceFileCount = $sourceFiles.Count
    note = if ($Overwrite) { 'storage_files_merged_with_overwrite' } else { 'storage_files_merged_without_overwrite' }
  }
}

function Invoke-DocumentStorageVerify {
  param([string]$ServerDir)

  $verifyScript = Join-Path $ServerDir 'src\scripts\verifyDocumentStorage.js'
  if (-not (Test-Path $verifyScript)) {
    return [ordered]@{
      ok = $false
      skipped = $true
      reason = 'verifyDocumentStorage.js_not_found'
    }
  }

  Push-Location $ServerDir
  try {
    $raw = & node $verifyScript
    $exitCode = $LASTEXITCODE
    $json = ($raw | Out-String).Trim()
    $parsed = $null
    if (-not [string]::IsNullOrWhiteSpace($json)) {
      $parsed = $json | ConvertFrom-Json
    }

    return [ordered]@{
      ok = ($exitCode -eq 0)
      skipped = $false
      exitCode = $exitCode
      result = $parsed
    }
  } finally {
    Pop-Location
  }
}

$resolvedServerDir = Resolve-ServerDir -ExplicitServerDir $ServerDir
$storageRoot = Get-ConfiguredStorageRoot -ServerDir $resolvedServerDir
$filesRoot = Join-Path $storageRoot 'files'
$resolvedPackagePath = Resolve-PackagePath -ExplicitPath $PackagePath -ServerDir $resolvedServerDir -StorageRoot $storageRoot
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$workRoot = Join-Path $storageRoot "tmp\office-return-restore-$timestamp"
$packageRoot = Resolve-PackageRoot -PackagePath $resolvedPackagePath -ExtractRoot (Join-Path $workRoot 'package')
$manifestPath = Join-Path $packageRoot 'manifest.json'

if (-not (Test-Path $manifestPath -PathType Leaf)) {
  throw "manifest_not_found: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
if ($manifest.packageType -ne 'kpi-office-return') {
  throw "unsupported_package_type: $($manifest.packageType)"
}

$databaseUrl = if ($env:KPI_DATABASE_URL) {
  $env:KPI_DATABASE_URL
} else {
  Get-EnvFileValue -ServerDir $resolvedServerDir -Key 'KPI_DATABASE_URL'
}
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
  $databaseUrl = 'postgresql://postgres:postgres@127.0.0.1:5432/postgres'
}

$dumpRelativePath = if ($manifest.database.dumpRelativePath) { $manifest.database.dumpRelativePath } else { 'database/kpi-home-return.dump' }
$storageZipRelativePath = if ($manifest.storage.zipRelativePath) { $manifest.storage.zipRelativePath } else { 'storage/storage-files.zip' }
$dumpPath = Join-Path $packageRoot $dumpRelativePath
$storageZipPath = Join-Path $packageRoot $storageZipRelativePath
$databaseValidation = Test-PostgresDumpReadable -ServerDir $resolvedServerDir -DumpPath $dumpPath -ExpectedSha256 $manifest.database.sha256
$storageValidation = Test-ZipArchiveReadable -ZipPath $storageZipPath -ExpectedSha256 $manifest.storage.sha256
$baselineFingerprintRelativePath = if ($manifest.safety.officeBaselineFingerprintRelativePath) {
  $manifest.safety.officeBaselineFingerprintRelativePath
} else {
  $null
}
$baselineFingerprintPath = if ($baselineFingerprintRelativePath) {
  Join-Path $packageRoot $baselineFingerprintRelativePath
} else {
  ''
}
$baselineFingerprint = if ($baselineFingerprintPath) {
  Read-JsonFile -Path $baselineFingerprintPath
} else {
  $null
}
$packageFingerprintPath = if ($manifest.database.fingerprintRelativePath) {
  Join-Path $packageRoot $manifest.database.fingerprintRelativePath
} else {
  ''
}
$packageFingerprint = if ($packageFingerprintPath) {
  Read-JsonFile -Path $packageFingerprintPath
} else {
  $null
}
$packageFingerprintComparison = if ($baselineFingerprint -and $packageFingerprint) {
  Compare-DatabaseFingerprints -Baseline $baselineFingerprint -Current $packageFingerprint
} else {
  [ordered]@{
    available = $false
    matches = $null
    reason = if (-not $baselineFingerprint) { 'baseline_fingerprint_not_found' } else { 'package_fingerprint_not_found' }
  }
}
$currentFingerprintState = $null
$databaseFingerprintComparison = [ordered]@{
  available = $false
  matches = $null
  reason = if ($baselineFingerprintRelativePath) { 'current_fingerprint_not_run' } else { 'baseline_fingerprint_not_in_package' }
}
if ((-not $SkipDatabase) -and $baselineFingerprint) {
  $currentFingerprintOutputPath = Join-Path $workRoot 'office-current-database.fingerprint.json'
  $currentFingerprintState = Invoke-DatabaseFingerprint -ServerDir $resolvedServerDir -PackageRoot $packageRoot -OutputPath $currentFingerprintOutputPath -Label 'office-target-before-return-restore'
  if ($currentFingerprintState.ok -eq $true -and $currentFingerprintState.result) {
    $databaseFingerprintComparison = Compare-DatabaseFingerprints -Baseline $baselineFingerprint -Current $currentFingerprintState.result
  } else {
    $databaseFingerprintComparison = [ordered]@{
      available = $false
      matches = $null
      reason = if ($currentFingerprintState.reason) { $currentFingerprintState.reason } elseif ($currentFingerprintState.error) { $currentFingerprintState.error } else { 'current_fingerprint_failed' }
      state = $currentFingerprintState
    }
  }
}

$plan = [ordered]@{
  ok = $true
  mode = if ($Force) { 'restore' } else { 'preview' }
  serverDir = $resolvedServerDir
  packagePath = $resolvedPackagePath
  packageCreatedAt = $manifest.createdAt
  databaseUrl = ConvertTo-RedactedDatabaseUrl -DatabaseUrl $databaseUrl
  database = [ordered]@{
    enabled = -not $SkipDatabase
    dumpPath = $dumpPath
    dumpExists = Test-Path $dumpPath -PathType Leaf
    validation = $databaseValidation
    packageFingerprintPath = $packageFingerprintPath
    packageDeltaFromBaseline = $packageFingerprintComparison
    baselineFingerprintPath = $baselineFingerprintPath
    baselineComparison = $databaseFingerprintComparison
    passwordHashPreservation = [ordered]@{
      enabled = -not $SkipDatabase
      matchKeys = @('id', 'username')
      note = 'Before DB restore, the script exports office app_users.password_hash values and reapplies them after restore for matching users so office passwords are not replaced by export-placeholder hashes.'
    }
    restoreMode = 'full_db_replace_with_pg_restore_clean_if_exists'
  }
  safety = [ordered]@{
    officeDbUnchangedConfirmationRequired = -not $SkipDatabase
    officeDbUnchangedConfirmed = [bool]$ConfirmOfficeDbUnchanged
    officeDbDriftOverrideAllowed = [bool]$AllowOfficeDbDrift
    applyCommand = if ($SkipDatabase) { 'npm run restore-package:office-return -- -PackagePath "<office-return-package.zip>" -Force -SkipDatabase' } else { 'npm run restore-package:office-return -- -PackagePath "<office-return-package.zip>" -Force -ConfirmOfficeDbUnchanged' }
    note = 'Full DB restore replaces the target office DB. Use -ConfirmOfficeDbUnchanged only after confirming nobody changed the office DB while the home copy was being edited. If baselineComparison.matches is false, review office-side changes before using -AllowOfficeDbDrift.'
  }
  storage = [ordered]@{
    enabled = -not $SkipStorage
    storageZipPath = $storageZipPath
    storageZipExists = Test-Path $storageZipPath -PathType Leaf
    validation = $storageValidation
    filesRoot = $filesRoot
    overwriteStorage = [bool]$OverwriteStorage
    restoreMode = 'merge_package_files_into_office_storage'
  }
  note = if ($Force) { 'Applying package after taking backups.' } else { 'Preview only. Add -Force and, for DB restore, -ConfirmOfficeDbUnchanged to back up the office DB/storage and apply this package.' }
}

if (-not $Force) {
  $plan | ConvertTo-Json -Depth 8
  exit 0
}

if ((-not $SkipDatabase) -and (-not $ConfirmOfficeDbUnchanged)) {
  throw 'office_db_unchanged_confirmation_required: rerun with -ConfirmOfficeDbUnchanged only after confirming nobody changed the office DB while the home copy was being edited. Use -SkipDatabase if you only want to merge storage files.'
}
if ((-not $SkipDatabase) -and $baselineFingerprint -and ($databaseFingerprintComparison.available -ne $true)) {
  throw "office_db_baseline_comparison_unavailable: $($databaseFingerprintComparison.reason)"
}
if ((-not $SkipDatabase) -and $baselineFingerprint -and ($databaseFingerprintComparison.matches -eq $false) -and (-not $AllowOfficeDbDrift)) {
  throw "office_db_baseline_mismatch: preview the package and review database.baselineComparison.mismatchedTables. Rerun with -AllowOfficeDbDrift only if you intentionally accept office-side DB changes being overwritten."
}
if ((-not $SkipDatabase) -and (-not (Test-Path $dumpPath -PathType Leaf))) {
  throw "database_dump_not_found: $dumpPath"
}
if ((-not $SkipDatabase) -and ($databaseValidation.readable -ne $true)) {
  throw "database_dump_not_readable: $($databaseValidation.error)"
}
if ((-not $SkipDatabase) -and ($databaseValidation.hashMatches -eq $false)) {
  throw "database_dump_hash_mismatch: $($databaseValidation.sha256)"
}
if ((-not $SkipStorage) -and ($manifest.storage.zipRelativePath) -and ($storageValidation.readable -ne $true)) {
  throw "storage_zip_not_readable: $($storageValidation.error)"
}
if ((-not $SkipStorage) -and ($storageValidation.hashMatches -eq $false)) {
  throw "storage_zip_hash_mismatch: $($storageValidation.sha256)"
}

$dbBackupPath = $null
$userPasswordHashBackup = $null
$userPasswordHashRestore = $null
$storageBackupRoot = $null
$storageRestore = $null
$verify = $null

if (-not $SkipDatabase) {
  $dbBackupRoot = Join-Path $storageRoot 'backups\office-return-pre-restore\postgres-dumps'
  New-Item -ItemType Directory -Path $dbBackupRoot -Force | Out-Null
  $dbBackupPath = Join-Path $dbBackupRoot "office-pre-return-$timestamp.dump"
  Invoke-PostgresDump -ServerDir $resolvedServerDir -DatabaseUrl $databaseUrl -OutputPath $dbBackupPath | Out-Null
  $userPasswordHashBackupPath = Join-Path $dbBackupRoot "office-pre-return-user-password-hashes-$timestamp.csv"
  $userPasswordHashBackup = Export-OfficeUserPasswordHashes -ServerDir $resolvedServerDir -DatabaseUrl $databaseUrl -OutputPath $userPasswordHashBackupPath -WorkRoot $workRoot
  Invoke-PostgresRestore -ServerDir $resolvedServerDir -DatabaseUrl $databaseUrl -DumpPath $dumpPath | Out-Null
  $userPasswordHashRestore = Restore-OfficeUserPasswordHashes -ServerDir $resolvedServerDir -DatabaseUrl $databaseUrl -BackupPath $userPasswordHashBackupPath -WorkRoot $workRoot
}

if (-not $SkipStorage) {
  if (Test-Path $filesRoot -PathType Container) {
    $storageBackupRoot = Join-Path $storageRoot "backups\office-return-pre-restore\file-storage\$timestamp"
    New-Item -ItemType Directory -Path $storageBackupRoot -Force | Out-Null
    Copy-Item -LiteralPath $filesRoot -Destination $storageBackupRoot -Recurse -Force
  }
  $storageRestore = Copy-StorageFiles -StorageZipPath $storageZipPath -FilesRoot $filesRoot -WorkRoot $workRoot -Overwrite ([bool]$OverwriteStorage)
}

$verify = Invoke-DocumentStorageVerify -ServerDir $resolvedServerDir
$overallOk = $true
if (($verify.skipped -ne $true) -and ($verify.ok -ne $true)) {
  $overallOk = $false
  $global:LASTEXITCODE = 2
}

[ordered]@{
  ok = $overallOk
  mode = 'restore'
  serverDir = $resolvedServerDir
  packagePath = $resolvedPackagePath
  packageCreatedAt = $manifest.createdAt
  databaseBackupPath = $dbBackupPath
  userPasswordHashBackup = $userPasswordHashBackup
  userPasswordHashRestore = $userPasswordHashRestore
  storageBackupRoot = $storageBackupRoot
  databaseRestored = -not $SkipDatabase
  databaseBaselineComparison = $databaseFingerprintComparison
  storageRestore = $storageRestore
  verifyDocumentStorage = $verify
} | ConvertTo-Json -Depth 12

if (-not $overallOk) {
  exit 2
}
