@echo off
setlocal
for /d %%D in ("%~dp006_*") do (
  if exist "%%~fD\internal-server\scripts\windows\unregister-startup-task.ps1" (
    set "SERVER_DIR=%%~fD\internal-server"
  )
)
if not defined SERVER_DIR (
  echo KPI internal server directory was not found.
  exit /b 1
)
cd /d "%SERVER_DIR%"
powershell -ExecutionPolicy Bypass -File "%SERVER_DIR%\scripts\windows\unregister-startup-task.ps1"
endlocal
