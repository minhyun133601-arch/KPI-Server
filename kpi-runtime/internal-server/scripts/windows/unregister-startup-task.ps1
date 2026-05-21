param(
  [string]$TaskName = 'KPI Internal Server Startup',
  [string]$StartupFileName = 'KPI-Central-Autostart.vbs',
  [string]$LegacyShortcutName = 'KPI Internal Server Startup.lnk'
)

$ErrorActionPreference = 'Stop'

$startupDirectory = [Environment]::GetFolderPath('Startup')
if ([string]::IsNullOrWhiteSpace($startupDirectory)) {
  throw 'Windows Startup folder could not be resolved.'
}

$startupFilePath = Join-Path $startupDirectory $StartupFileName
$legacyShortcutPath = Join-Path $startupDirectory $LegacyShortcutName
$removedItems = @()

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  $removedItems += "Scheduled task: $TaskName"
}

if (Test-Path -LiteralPath $startupFilePath) {
  Remove-Item -LiteralPath $startupFilePath -Force
  $removedItems += $startupFilePath
}

if (Test-Path -LiteralPath $legacyShortcutPath) {
  Remove-Item -LiteralPath $legacyShortcutPath -Force
  $removedItems += $legacyShortcutPath
}

if (-not $removedItems.Count) {
  Write-Host "Startup autorun was not registered."
  exit 0
}

Write-Host "Removed startup autorun entries:"
$removedItems | ForEach-Object { Write-Host $_ }
