@echo off
chcp 65001 >nul
setlocal

set "SERVER_DIR="
set "SCRIPT_PATH="

for /d %%D in ("%~dp0..\06_*") do (
  if exist "%%~fD\internal-server\scripts\windows\recover-central-stack.ps1" (
    set "SERVER_DIR=%%~fD\internal-server"
    set "SCRIPT_PATH=%%~fD\internal-server\scripts\windows\recover-central-stack.ps1"
  )
)

if not defined SCRIPT_PATH (
  echo KPI internal server directory was not found.
  echo.
  echo Press any key to close this window.
  pause >nul
  exit /b 1
)

cd /d "%SERVER_DIR%"
echo.
echo [KPI Recovery Restart]
echo Use this when 03-서버-열기.cmd looks stuck or PostgreSQL startup looks broken.
echo It stops the current server, cleans a stale postmaster.pid when safe, and starts the stack again.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%"
set "STATUS_CODE=%ERRORLEVEL%"

echo.
if "%STATUS_CODE%"=="0" (
  echo Recovery restart completed.
) else (
  echo Recovery restart failed. Check the message above.
)
echo Press any key to close this window.
pause >nul

endlocal & exit /b %STATUS_CODE%
