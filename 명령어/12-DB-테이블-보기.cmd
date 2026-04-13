@echo off
chcp 65001 >nul
setlocal

for /d %%D in ("%~dp0..\06_*") do (
  if exist "%%~fD\internal-server\scripts\windows\open-db-console.ps1" (
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

cd /d "%SERVER_DIR%"
echo.
echo [DB Table List]
echo This window only shows the table list.
echo You do not need to type anything.
echo You do not need to select anything.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%SERVER_DIR%\scripts\windows\open-db-console.ps1" -ListTables
set "STATUS_CODE=%ERRORLEVEL%"

echo.
echo Press any key to close this window.
pause >nul

endlocal & exit /b %STATUS_CODE%
