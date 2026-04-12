@echo off
setlocal
for /d %%D in ("%~dp006_*") do (
  if exist "%%~fD\internal-server\scripts\windows\stop-server.ps1" (
    set "SERVER_DIR=%%~fD\internal-server"
  )
)
if not defined SERVER_DIR (
  echo KPI internal server directory was not found.
  exit /b 1
)
cd /d "%SERVER_DIR%"
powershell -ExecutionPolicy Bypass -File "%SERVER_DIR%\scripts\windows\stop-server.ps1" -Environment Production
powershell -ExecutionPolicy Bypass -File "%SERVER_DIR%\scripts\windows\stop-local-postgres.ps1"
endlocal
