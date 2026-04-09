param(
  [switch]$ForceRestart,
  [ValidateSet('Default', 'Development', 'Production')]
  [string]$Environment = 'Default',
  [string]$EnvFile
)

$ErrorActionPreference = 'Stop'

$serverDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$logDir = Join-Path $serverDir 'var\logs'
$stdout = Join-Path $logDir 'server.stdout.log'
$stderr = Join-Path $logDir 'server.stderr.log'

function Resolve-EnvFilePath {
  param(
    [string]$ServerDir,
    [string]$Environment,
    [string]$EnvFile
  )

  if ($EnvFile) {
    $candidate = if ([System.IO.Path]::IsPathRooted($EnvFile)) { $EnvFile } else { Join-Path $ServerDir $EnvFile }
    if (-not (Test-Path $candidate)) {
      throw "Requested env file was not found: $candidate"
    }
    return (Resolve-Path $candidate).Path
  }

  $preferred = switch ($Environment) {
    'Development' { Join-Path $ServerDir '.env.development.local' }
    'Production' { Join-Path $ServerDir '.env.production.local' }
    default { Join-Path $ServerDir '.env' }
  }

  if (Test-Path $preferred) {
    return (Resolve-Path $preferred).Path
  }

  $fallback = Join-Path $ServerDir '.env'
  if (Test-Path $fallback) {
    return (Resolve-Path $fallback).Path
  }

  throw "No env file was found. Create $preferred or $fallback first."
}

function Read-EnvMap {
  param([string]$FilePath)

  $map = @{}
  foreach ($line in Get-Content -Path $FilePath -Encoding utf8) {
    $trimmed = ([string]$line).Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) {
      continue
    }

    $separatorIndex = $trimmed.IndexOf('=')
    if ($separatorIndex -le 0) {
      continue
    }

    $key = $trimmed.Substring(0, $separatorIndex).Trim()
    if (-not $key) {
      continue
    }

    $value = $trimmed.Substring($separatorIndex + 1).Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $map[$key] = $value
  }

  return $map
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$resolvedEnvFile = Resolve-EnvFilePath -ServerDir $serverDir -Environment $Environment -EnvFile $EnvFile
$envMap = Read-EnvMap -FilePath $resolvedEnvFile
$port = 3100
if ($envMap.ContainsKey('KPI_SERVER_PORT')) {
  $parsedPort = 0
  if ([int]::TryParse($envMap['KPI_SERVER_PORT'], [ref]$parsedPort) -and $parsedPort -gt 0) {
    $port = $parsedPort
  }
}

$listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
if ($listener) {
  if (-not $ForceRestart) {
    Write-Host "KPI internal server is already listening on port $port. Use -ForceRestart to replace it."
    exit 0
  }

  Stop-Process -Id $listener.OwningProcess -Force
  Start-Sleep -Seconds 1
}

$previousEnvFile = $env:KPI_ENV_FILE
try {
  $env:KPI_ENV_FILE = $resolvedEnvFile
  $process = Start-Process `
    -FilePath node `
    -ArgumentList 'src/server.js' `
    -WorkingDirectory $serverDir `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr
} finally {
  if ($null -eq $previousEnvFile) {
    Remove-Item Env:KPI_ENV_FILE -ErrorAction SilentlyContinue
  } else {
    $env:KPI_ENV_FILE = $previousEnvFile
  }
}

Start-Sleep -Seconds 2

Write-Host "Started KPI internal server."
Write-Host "Environment: $Environment"
Write-Host "Env file: $resolvedEnvFile"
Write-Host "PID: $($process.Id)"
Write-Host "Health: http://127.0.0.1:$port/api/health"
Write-Host "Stdout: $stdout"
Write-Host "Stderr: $stderr"
