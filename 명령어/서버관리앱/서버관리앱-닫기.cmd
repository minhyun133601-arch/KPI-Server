@echo off
chcp 65001 >nul
setlocal

set "APP_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%APP_DIR%scripts\stop-ops-console.ps1"
set "STATUS_CODE=%ERRORLEVEL%"

echo.
echo Press any key to close this window.
pause >nul

endlocal & exit /b %STATUS_CODE%
