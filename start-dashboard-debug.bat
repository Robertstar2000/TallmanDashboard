@echo off
echo ================================
echo Starting Tallman Dashboard System (Debug Mode)
echo ================================

echo.
echo [1/4] Killing any existing processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo [2/4] Starting Backend Server...
cd backend
echo Starting backend in: %CD%
start "Backend Server" cmd /k "npm start"
cd ..

echo.
echo [3/4] Waiting for backend to initialize...
timeout /t 10 /nobreak >nul

echo.
echo [4/4] Starting Frontend Development Server...
echo Starting frontend in: %CD%
start "Frontend Dev Server" cmd /k "npm run dev"

echo.
echo ================================
echo Services starting...
echo ================================
echo.
echo SERVICES:
echo - Backend Server: http://localhost:3001
echo - Frontend: http://localhost:5173
echo.
echo Check the individual command windows for any errors.
echo.
pause
