@echo off
echo ===================================
echo Starting TallmanDashboard Servers
echo ===================================
echo.

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

echo Starting Backend Server...
start "Backend Server - Port 3001" "%~dp0start-backend.bat"

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server - Port 5500" "%~dp0start-frontend.bat"

echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5500
echo.
pause
