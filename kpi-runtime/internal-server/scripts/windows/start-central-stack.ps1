param(
  [switch]$BootstrapOwner
)

$ErrorActionPreference = 'Stop'

& (Join-Path $PSScriptRoot 'initialize-central-runtime.ps1') -StartServer -BootstrapOwner:$BootstrapOwner

Write-Host "Central KPI stack is ready."
Write-Host "Bind: 0.0.0.0:3100"
Write-Host "Health: http://127.0.0.1:3100/api/health"
Write-Host "Login: http://127.0.0.1:3100/login"
Write-Host "LAN Login: http://<server-ip>:3100/login"
