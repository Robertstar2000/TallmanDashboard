@echo off
echo ================================
echo Starting Tallman Dashboard System
echo ================================

echo.
echo [1/4] Killing any existing processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo [2/4] Starting Backend Server with Background Worker...
start "Backend Server" /d "%~dp0backend" cmd /k "npm start"

echo.
echo [3/4] Starting Frontend Development Server...
start "Frontend Dev Server" /d "%~dp0" cmd /k "npm run dev"

echo.
echo [4/4] Waiting for services to initialize...
timeout /t 8 /nobreak >nul

echo.
echo ================================
echo All services started successfully!
echo ================================
echo.
echo SERVICES RUNNING:
echo - Backend Server: http://localhost:3001 (with Background Worker)
echo - Frontend: http://localhost:5173
echo.
echo You should now see 3 windows total:
echo 1. This main window (batch file)
echo 2. Backend Server window
echo 3. Frontend Dev Server window
echo.
echo Opening dashboard in browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul
