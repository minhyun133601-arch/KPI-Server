param(
  [string]$TaskName = 'KPI Internal Server Startup',
  [int]$DelaySeconds = 20
)

$ErrorActionPreference = 'Stop'

$startupScriptPath = (Resolve-Path (Join-Path $PSScriptRoot 'start-central-stack.startup.ps1')).Path
$argumentList = "-NoProfile -ExecutionPolicy Bypass -File `"$startupScriptPath`" -DelaySeconds $DelaySeconds"

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argumentList
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description 'Starts the KPI internal server stack at Windows startup.' `
  -Force | Out-Null

Write-Host "Registered startup task: $TaskName"
Write-Host "Action: powershell.exe $argumentList"
