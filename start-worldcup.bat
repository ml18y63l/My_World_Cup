@echo off
REM ============================================================
REM  2026 World Cup Dashboard - Launcher
REM  Starts the Next.js dev server and opens it in the browser
REM ============================================================
title World Cup 2026 Dashboard

set "PROJECT_DIR=%~dp0my-world-cup"

REM Check the project directory exists
if not exist "%PROJECT_DIR%\package.json" (
    echo [ERROR] Cannot find project at %PROJECT_DIR%
    pause
    exit /b 1
)

echo ============================================
echo   Starting World Cup 2026 Dashboard...
echo ============================================
echo.
echo Project: %PROJECT_DIR%
echo URL:     http://localhost:3000
echo.
echo This window must stay open while the app runs.
echo Close it to stop the server.
echo.

cd /d "%PROJECT_DIR%"

REM Start the dev server in the background, then open the browser after a short delay
start "WC2026 Dev Server" cmd /c "npm run dev"

REM Wait for the server to boot before opening the browser
timeout /t 6 /nobreak >nul

REM Open the default browser to the app
start "" "http://localhost:3000"

echo.
echo Browser opened. You can minimize this window.
echo.
