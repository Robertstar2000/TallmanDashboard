@echo off
echo Starting TallmanDashboard System
echo =================================

REM Kill existing processes
taskkill /f /im node.exe >nul 2>&1

REM Start backend
echo Starting backend...
start "Backend" cmd /k "cd backend && node server-fixed.js"

REM Wait
timeout /t 8 /nobreak >nul

REM Start frontend
echo Starting frontend...
start "Frontend" cmd /k "npm run dev"

REM Wait and check
timeout /t 10 /nobreak >nul
echo.
echo Checking servers...
netstat -an | findstr :3001 >nul && echo Backend: RUNNING || echo Backend: NOT RUNNING
netstat -an | findstr :5500 >nul && echo Frontend: RUNNING || echo Frontend: NOT RUNNING

echo.
echo Opening browser...
start http://localhost:5500

pause
