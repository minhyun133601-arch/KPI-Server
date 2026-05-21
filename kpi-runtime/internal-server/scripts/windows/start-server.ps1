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

function Resolve-NodeExecutablePath {
  $command = Get-Command node -ErrorAction SilentlyContinue
  if ($command -and $command.Source -and (Test-Path $command.Source)) {
    return $command.Source
  }

  $candidatePaths = @(
    'C:\Program Files\nodejs\node.exe'
  )

  foreach ($candidatePath in $candidatePaths) {
    if (Test-Path $candidatePath) {
      return $candidatePath
    }
  }

  $userRoot = 'C:\Users'
  if (Test-Path $userRoot) {
    $wingetPackages = Get-ChildItem -Path $userRoot -Directory -ErrorAction SilentlyContinue |
      ForEach-Object {
        Join-Path $_.FullName 'AppData\Local\Microsoft\WinGet\Packages'
      } |
      Where-Object { Test-Path $_ }

    foreach ($packagesRoot in $wingetPackages) {
      $packageDirs = Get-ChildItem -Path $packagesRoot -Directory -Filter 'OpenJS.NodeJS.LTS_Microsoft.Winget.Source_*' -ErrorAction SilentlyContinue |
        Sort-Object FullName
      foreach ($packageDir in $packageDirs) {
        $nodeDir = Get-ChildItem -Path $packageDir.FullName -Directory -Filter 'node-*' -ErrorAction SilentlyContinue |
          Sort-Object Name -Descending |
          Select-Object -First 1
        if (-not $nodeDir) {
          continue
        }
        $candidatePath = Join-Path $nodeDir.FullName 'node.exe'
        if (Test-Path $candidatePath) {
          return $candidatePath
        }
      }
    }
  }

  throw 'Node.js executable was not found. Install Node.js or add node.exe to PATH.'
}

function Resolve-EnvFilePath {
  param(
    [string]$ServerDir,
    [string]$Environment,
    [string]$EnvFile
  )

  if ($EnvFile) {
    throw 'The -EnvFile override is no longer supported. Copy the server env file to .env.production.local, .env.development.local, or .env inside kpi-runtime/internal-server.'
  }

  $candidatePaths = switch ($Environment) {
    'Development' { @((Join-Path $ServerDir '.env.development.local'), (Join-Path $ServerDir '.env')) }
    'Production' { @((Join-Path $ServerDir '.env.production.local'), (Join-Path $ServerDir '.env')) }
    default {
      @(
        (Join-Path $ServerDir '.env.production.local'),
        (Join-Path $ServerDir '.env.development.local'),
        (Join-Path $ServerDir '.env')
      )
    }
  }

  foreach ($candidatePath in $candidatePaths) {
    if (Test-Path $candidatePath) {
      return (Resolve-Path $candidatePath).Path
    }
  }

  throw 'No env file was found. Copy the server env file to .env.production.local, .env.development.local, or .env inside kpi-runtime/internal-server.'
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

$nodeExecutablePath = Resolve-NodeExecutablePath
$resolvedEnvFile = Resolve-EnvFilePath -ServerDir $serverDir -Environment $Environment -EnvFile $EnvFile
$envMap = Read-EnvMap -FilePath $resolvedEnvFile
$serverHost = '127.0.0.1'
if ($envMap.ContainsKey('KPI_SERVER_HOST')) {
  $configuredHost = ([string]$envMap['KPI_SERVER_HOST']).Trim()
  if ($configuredHost) {
    $serverHost = $configuredHost
  }
}
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

$previousRuntimeEnvironment = $env:KPI_RUNTIME_ENV
try {
  $resolvedEnvFileName = [System.IO.Path]::GetFileName($resolvedEnvFile)
  if ($Environment -eq 'Production' -or $resolvedEnvFileName -eq '.env.production.local') {
    $env:KPI_RUNTIME_ENV = 'production'
  } elseif ($Environment -eq 'Development' -or $resolvedEnvFileName -eq '.env.development.local') {
    $env:KPI_RUNTIME_ENV = 'development'
  } else {
    Remove-Item Env:KPI_RUNTIME_ENV -ErrorAction SilentlyContinue
  }

  $process = Start-Process `
    -FilePath $nodeExecutablePath `
    -ArgumentList 'src/server.js' `
    -WorkingDirectory $serverDir `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr
} finally {
  if ($null -eq $previousRuntimeEnvironment) {
    Remove-Item Env:KPI_RUNTIME_ENV -ErrorAction SilentlyContinue
  } else {
    $env:KPI_RUNTIME_ENV = $previousRuntimeEnvironment
  }
}

Start-Sleep -Seconds 2

Write-Host "Started KPI internal server."
Write-Host "Environment: $Environment"
Write-Host "Env file: $resolvedEnvFile"
Write-Host "Node: $nodeExecutablePath"
Write-Host "PID: $($process.Id)"
Write-Host "Bind: $serverHost`:$port"
Write-Host "Health: http://127.0.0.1:$port/api/health"
if ($serverHost -eq '0.0.0.0') {
  Write-Host "LAN: http://<server-ip>:$port/login"
}
Write-Host "Stdout: $stdout"
Write-Host "Stderr: $stderr"
