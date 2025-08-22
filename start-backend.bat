@echo off
title Backend Server - Port 3001
echo ===================================
echo Starting TallmanDashboard Backend
echo ===================================
echo.

cd /d "%~dp0backend"

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

echo Node.js found. Starting backend server...
echo.
node server-fixed.js

echo.
echo Backend server stopped.
pause
