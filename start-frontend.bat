@echo off
title Frontend Server - Port 5500
echo ===================================
echo Starting TallmanDashboard Frontend
echo ===================================
echo.

cd /d "%~dp0"

echo Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Or add Node.js to your system PATH
    echo.
    echo Common Node.js locations:
    echo - C:\Program Files\nodejs\
    echo - C:\Program Files (x86)\nodejs\
    echo - %USERPROFILE%\AppData\Local\Programs\nodejs\
    echo.
    pause
    exit /b 1
)

echo Node.js found. Starting frontend server...
echo.
npm run dev

echo.
echo Frontend server stopped.
pause
