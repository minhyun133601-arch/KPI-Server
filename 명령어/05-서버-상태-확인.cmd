@echo off
chcp 65001 >nul
setlocal

for /d %%D in ("%~dp0..\06_*") do (
  if exist "%%~fD\internal-server\package.json" (
    set "SERVER_DIR=%%~fD\internal-server"
  )
)

if not defined SERVER_DIR (
  echo KPI internal server directory was not found.
  echo.
  echo Press any key to close this window.
  pause >nul
  exit /b 1
)

set "ENV_FILE=%SERVER_DIR%\.env.production.local"
set "PORT=3100"

if exist "%ENV_FILE%" (
  for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
    if /I "%%A"=="KPI_SERVER_PORT" set "PORT=%%B"
  )
)

cd /d "%SERVER_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%SERVER_DIR%\scripts\windows\check-server-status.ps1" -BaseUrl "http://127.0.0.1:%PORT%"

set "STATUS_CODE=%ERRORLEVEL%"

if not "%STATUS_CODE%"=="0" (
  echo.
  echo If the server is down, run the server-open command in this folder.
)

echo.
echo Press any key to close this window.
pause >nul

endlocal & exit /b %STATUS_CODE%
