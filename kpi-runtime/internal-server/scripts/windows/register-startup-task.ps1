param(
  [string]$TaskName = 'KPI Internal Server Startup',
  [int]$DelaySeconds = 20,
  [string]$StartupFileName = 'KPI-Central-Autostart.vbs',
  [string]$LegacyShortcutName = 'KPI Internal Server Startup.lnk'
)

$ErrorActionPreference = 'Stop'

function ConvertTo-SingleQuotedPowerShellString {
  param([string]$Value)
  return "'$($Value.Replace("'", "''"))'"
}

$startupScriptPath = (Resolve-Path (Join-Path $PSScriptRoot 'start-central-stack.startup.ps1')).Path
$internalServerRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$logDirectory = Join-Path $internalServerRoot 'var\logs'
$logPath = Join-Path $logDirectory 'startup-autostart.log'
$startupDirectory = [Environment]::GetFolderPath('Startup')

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

$startupCommand = @(
  '$ErrorActionPreference = ''Stop'''
  '& {0} -DelaySeconds {1} *>> {2}' -f
    (ConvertTo-SingleQuotedPowerShellString $startupScriptPath),
    $DelaySeconds,
    (ConvertTo-SingleQuotedPowerShellString $logPath)
) -join '; '
$encodedCommand = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($startupCommand))
$launcherArguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand $encodedCommand"

try {
  $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  $action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument $launcherArguments `
    -WorkingDirectory $internalServerRoot
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
  $settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)
  $principal = New-ScheduledTaskPrincipal `
    -UserId $currentUser `
    -LogonType Interactive `
    -RunLevel Limited

  Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description 'Start the KPI server stack when the current Windows user logs in.' `
    -Force | Out-Null

  if (-not [string]::IsNullOrWhiteSpace($startupDirectory)) {
    $startupFilePath = Join-Path $startupDirectory $StartupFileName
    $legacyShortcutPath = Join-Path $startupDirectory $LegacyShortcutName
    Remove-Item -LiteralPath $startupFilePath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $legacyShortcutPath -Force -ErrorAction SilentlyContinue
  }

  Write-Host "Registered scheduled task: $TaskName"
  Write-Host "Startup script: $startupScriptPath"
  Write-Host "Log file: $logPath"
  exit 0
} catch {
  Write-Warning "Scheduled task registration failed. Falling back to the Startup folder. $($_.Exception.Message)"
}

if ([string]::IsNullOrWhiteSpace($startupDirectory)) {
  throw 'Windows Startup folder could not be resolved.'
}

$startupFilePath = Join-Path $startupDirectory $StartupFileName
$legacyShortcutPath = Join-Path $startupDirectory $LegacyShortcutName
$launcherCommand = "powershell.exe $launcherArguments"
$scriptBody = @"
Set shell = CreateObject("WScript.Shell")
command = "$launcherCommand"
shell.Run command, 0, False
"@

New-Item -ItemType Directory -Path $startupDirectory -Force | Out-Null
Set-Content -LiteralPath $startupFilePath -Value $scriptBody -Encoding ASCII
Remove-Item -LiteralPath $legacyShortcutPath -Force -ErrorAction SilentlyContinue

Write-Host "Registered startup script: $startupFilePath"
Write-Host "Startup script: $startupScriptPath"
Write-Host "Log file: $logPath"
