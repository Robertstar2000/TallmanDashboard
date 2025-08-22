@echo off
echo Starting TallmanDashboard
echo ========================

REM Kill any existing node processes
taskkill /f /im node.exe >nul 2>&1

echo Starting backend server...
start "TallmanDashboard-Backend" cmd /k "cd backend && node server-fixed.js"

echo Waiting for backend...
timeout /t 5 /nobreak >nul

echo Starting frontend server...
start "TallmanDashboard-Frontend" cmd /k "npm run dev"

echo Waiting for frontend...
timeout /t 8 /nobreak >nul

echo Opening dashboard...
start http://localhost:5500

echo.
echo Dashboard should be starting in your browser.
echo Check the Backend and Frontend windows for any errors.
pause
