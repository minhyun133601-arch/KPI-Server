@echo off
chcp 65001 >nul
setlocal

for /d %%D in ("%~dp0..\06_*") do (
  if exist "%%~fD\internal-server\scripts\windows\bootstrap-owner-interactive.ps1" (
    set "SERVER_DIR=%%~fD\internal-server"
  )
)

if not defined SERVER_DIR (
  echo KPI internal server directory was not found.
  exit /b 1
)

cd /d "%SERVER_DIR%"
powershell -ExecutionPolicy Bypass -File "%SERVER_DIR%\scripts\windows\bootstrap-owner-interactive.ps1"

endlocal
