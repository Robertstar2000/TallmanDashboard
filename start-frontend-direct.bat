@echo off
title Frontend Server - Port 5500
echo ===================================
echo Starting TallmanDashboard Frontend
echo ===================================
echo.

cd /d "%~dp0"

echo Trying different Node.js paths...
echo.

if exist "C:\Program Files\nodejs\node.exe" (
    echo Found Node.js at: C:\Program Files\nodejs\node.exe
    "C:\Program Files\nodejs\node.exe" --version
    echo Starting frontend server...
    "C:\Program Files\nodejs\npm.cmd" run dev
    goto :end
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo Found Node.js at: C:\Program Files (x86)\nodejs\node.exe
    "C:\Program Files (x86)\nodejs\node.exe" --version
    echo Starting frontend server...
    "C:\Program Files (x86)\nodejs\npm.cmd" run dev
    goto :end
)

if exist "%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe" (
    echo Found Node.js at: %USERPROFILE%\AppData\Local\Programs\nodejs\node.exe
    "%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe" --version
    echo Starting frontend server...
    "%USERPROFILE%\AppData\Local\Programs\nodejs\npm.cmd" run dev
    goto :end
)

echo ERROR: Node.js not found in standard locations
echo Please check Node.js installation
echo.
pause

:end
echo.
echo Frontend server stopped.
pause
