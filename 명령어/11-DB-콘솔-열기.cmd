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
echo [DB Console]
echo This window is a text-input console.
echo You do not need to click or select anything.
echo Type a command and press Enter.
echo.
echo Examples:
echo   \dt
echo   select * from app_users;
echo.
echo Exit:
echo   \q
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%SERVER_DIR%\scripts\windows\open-db-console.ps1"
set "STATUS_CODE=%ERRORLEVEL%"

if not "%STATUS_CODE%"=="0" (
  echo.
  echo DB console could not be opened.
  echo Press any key to close this window.
  pause >nul
)

endlocal & exit /b %STATUS_CODE%
