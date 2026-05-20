param(
  [string]$SourcePath = '..\..\KPI-DB-export.xlsx',
  [string]$OutputPath = 'var\prod\office-import-baseline\database-fingerprint.json',
  [switch]$KeepScratchSchema
)

$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Convert-ToAbsolutePath {
  param(
    [string]$BaseDir,
    [string]$PathValue
  )

  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    return [System.IO.Path]::GetFullPath($BaseDir)
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
    baseUrl = "$($uri.Scheme)://$($uri.Authority)/$databaseName"
  }
}

function Resolve-PostgresToolPath {
  param([string]$ToolName)

  $configuredBinDir = Get-EnvFileValue -ServerDir $serverDir -Key 'KPI_POSTGRES_BIN_DIR'
  if (-not [string]::IsNullOrWhiteSpace($env:KPI_POSTGRES_BIN_DIR)) {
    $configuredBinDir = $env:KPI_POSTGRES_BIN_DIR
  }
  if (-not [string]::IsNullOrWhiteSpace($configuredBinDir)) {
    $configuredPath = Convert-ToAbsolutePath -BaseDir $serverDir -PathValue (Join-Path $configuredBinDir "$ToolName.exe")
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

  throw "$ToolName`_not_found"
}

function Invoke-JsonNode {
  param(
    [string]$ScriptPath,
    [string[]]$ArgumentList
  )

  $raw = & node $ScriptPath @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "node_script_failed: $ScriptPath exit $LASTEXITCODE`n$($raw -join "`n")"
  }

  $json = ($raw | Out-String).Trim()
  if ([string]::IsNullOrWhiteSpace($json)) {
    throw "node_script_returned_empty_json: $ScriptPath"
  }

  return $json | ConvertFrom-Json
}

function Invoke-PsqlCommand {
  param(
    [object]$Connection,
    [string]$Command
  )

  $psqlPath = Resolve-PostgresToolPath -ToolName 'psql'
  $previousPgPassword = $env:PGPASSWORD
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    if (-not [string]::IsNullOrEmpty($Connection.password)) {
      $env:PGPASSWORD = $Connection.password
    }

    $arguments = @(
      '--set=ON_ERROR_STOP=1',
      "--host=$($Connection.host)",
      "--port=$($Connection.port)"
    )
    if (-not [string]::IsNullOrWhiteSpace($Connection.user)) {
      $arguments += "--username=$($Connection.user)"
    }
    $arguments += "--dbname=$($Connection.databaseName)"
    $arguments += "--command=$Command"

    $ErrorActionPreference = 'Continue'
    $raw = & $psqlPath @arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "psql_failed: exit $LASTEXITCODE`n$($raw -join "`n")"
    }
    return @($raw | ForEach-Object { [string]$_ })
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
    $env:PGPASSWORD = $previousPgPassword
  }
}

function Get-SchemaDatabaseUrl {
  param(
    [string]$DatabaseUrl,
    [string]$SchemaName
  )

  $separator = if ($DatabaseUrl.Contains('?')) { '&' } else { '?' }
  $options = [Uri]::EscapeDataString("-c search_path=$SchemaName,public")
  return "$DatabaseUrl${separator}options=$options"
}

$sourceFullPath = Convert-ToAbsolutePath -BaseDir $serverDir -PathValue $SourcePath
if (-not (Test-Path $sourceFullPath -PathType Leaf)) {
  throw "source_export_not_found: $sourceFullPath"
}

$outputFullPath = Convert-ToAbsolutePath -BaseDir $serverDir -PathValue $OutputPath
$databaseUrl = if ($env:KPI_DATABASE_URL) {
  $env:KPI_DATABASE_URL
} else {
  Get-EnvFileValue -ServerDir $serverDir -Key 'KPI_DATABASE_URL'
}
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
  $databaseUrl = 'postgresql://postgres:postgres@127.0.0.1:5434/postgres'
}

$connection = Convert-DatabaseUrl -DatabaseUrl $databaseUrl
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$scratchSchema = "kpi_office_import_baseline_$timestamp"
$schemaCreated = $false

$previousDatabaseUrl = $env:KPI_DATABASE_URL
$previousRuntimeEnv = $env:KPI_RUNTIME_ENV
try {
  Invoke-PsqlCommand -Connection $connection -Command "create schema $scratchSchema;" | Out-Null
  $schemaCreated = $true

  $env:KPI_DATABASE_URL = Get-SchemaDatabaseUrl -DatabaseUrl $databaseUrl -SchemaName $scratchSchema
  $env:KPI_RUNTIME_ENV = 'production'

  Push-Location $serverDir
  try {
    $migrationResult = Invoke-JsonNode -ScriptPath (Join-Path $serverDir 'src\scripts\migrate.js') -ArgumentList @()
    Invoke-PsqlCommand -Connection $connection -Command "set search_path to $scratchSchema, public; delete from util_production_daily_state;" | Out-Null
    $importResult = Invoke-JsonNode -ScriptPath (Join-Path $serverDir 'src\scripts\importKpiDbExportWorkbook.js') -ArgumentList @(
      '--force',
      "--source=$sourceFullPath"
    )
    $fingerprint = Invoke-JsonNode -ScriptPath (Join-Path $serverDir 'src\scripts\fingerprintDatabaseState.js') -ArgumentList @(
      '--label=office-import-baseline',
      "--source-file=$sourceFullPath",
      "--output=$outputFullPath"
    )
  } finally {
    Pop-Location
  }
} finally {
  if ($null -eq $previousDatabaseUrl) {
    Remove-Item Env:KPI_DATABASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:KPI_DATABASE_URL = $previousDatabaseUrl
  }

  if ($null -eq $previousRuntimeEnv) {
    Remove-Item Env:KPI_RUNTIME_ENV -ErrorAction SilentlyContinue
  } else {
    $env:KPI_RUNTIME_ENV = $previousRuntimeEnv
  }

  if ($schemaCreated -and -not $KeepScratchSchema) {
    Invoke-PsqlCommand -Connection $connection -Command "drop schema if exists $scratchSchema cascade;" | Out-Null
  }
}

[ordered]@{
  ok = $true
  mode = 'office_export_baseline_capture'
  sourcePath = $sourceFullPath
  outputPath = $outputFullPath
  scratchSchema = $scratchSchema
  scratchSchemaKept = [bool]$KeepScratchSchema
  migration = [ordered]@{
    applied = @($migrationResult.applied)
    adopted = @($migrationResult.adopted)
  }
  importMode = $importResult.mode
  importStats = $importResult.importStats
  fingerprintSummary = $fingerprint.summary
} | ConvertTo-Json -Depth 12
