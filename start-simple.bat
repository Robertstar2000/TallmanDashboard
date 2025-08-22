@echo off
echo Starting TallmanDashboard - Simple Version
echo =========================================

REM Kill existing processes
taskkill /f /im node.exe >nul 2>&1

REM Start backend in new window
echo Starting backend server...
start "Backend" cmd /k "cd /d backend && node server-fixed.js"

REM Wait a moment
timeout /t 5 /nobreak >nul

REM Start frontend in new window  
echo Starting frontend server...
start "Frontend" cmd /k "npm run dev"

REM Wait and check
timeout /t 10 /nobreak >nul
echo.
echo Checking if servers are running...
netstat -an | findstr :3001 >nul && echo Backend (3001): RUNNING || echo Backend (3001): NOT RUNNING
netstat -an | findstr :5500 >nul && echo Frontend (5500): RUNNING || echo Frontend (5500): NOT RUNNING

echo.
echo Opening browser...
start http://localhost:5500

echo.
echo Done! Check the Backend and Frontend windows for any errors.
pause
