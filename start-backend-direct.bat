@echo off
title Backend Server - Port 3001
echo ===================================
echo Starting TallmanDashboard Backend
echo ===================================
echo.

cd /d "%~dp0backend"

echo Trying different Node.js paths...
echo.

if exist "C:\Program Files\nodejs\node.exe" (
    echo Found Node.js at: C:\Program Files\nodejs\node.exe
    "C:\Program Files\nodejs\node.exe" --version
    echo Starting backend server...
    "C:\Program Files\nodejs\node.exe" server-fixed.js
    goto :end
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo Found Node.js at: C:\Program Files (x86)\nodejs\node.exe
    "C:\Program Files (x86)\nodejs\node.exe" --version
    echo Starting backend server...
    "C:\Program Files (x86)\nodejs\node.exe" server-fixed.js
    goto :end
)

if exist "%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe" (
    echo Found Node.js at: %USERPROFILE%\AppData\Local\Programs\nodejs\node.exe
    "%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe" --version
    echo Starting backend server...
    "%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe" server-fixed.js
    goto :end
)

echo ERROR: Node.js not found in standard locations
echo Please check Node.js installation
echo.
pause

:end
echo.
echo Backend server stopped.
pause
