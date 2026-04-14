@echo off
chcp 65001 >nul
setlocal

set "APP_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%APP_DIR%scripts\start-ops-console.ps1"
set "STATUS_CODE=%ERRORLEVEL%"

if not "%STATUS_CODE%"=="0" (
  echo.
  echo KPI 서버 관리 앱을 열지 못했습니다.
  echo Press any key to close this window.
  pause >nul
)

endlocal & exit /b %STATUS_CODE%
