@echo off
echo ================================
echo Starting Tallman Dashboard System
echo ================================

echo.
echo [1/5] Killing processes on required ports...
echo Killing processes on port 3001 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
echo Killing processes on port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1
echo Killing any remaining node.exe processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo [2/5] Starting Backend Server (includes MCP servers)...
start "Backend Server" /d "%~dp0backend" cmd /k "npm start"

echo.
echo [3/5] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [4/5] Starting Frontend Development Server...
start "Frontend Dev Server" /d "%~dp0" cmd /k "npm run dev"

echo.
echo [5/5] Waiting for all services to initialize...
timeout /t 8 /nobreak >nul

echo.
echo ================================
echo Verifying Services are Running...
echo ================================

echo.
echo Checking Backend (port 3001)...
netstat -ano | findstr :3001 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ✅ Backend Server: RUNNING on port 3001
) else (
    echo ❌ Backend Server: NOT RUNNING on port 3001
)

echo.
echo Checking Frontend (port 5173)...
netstat -ano | findstr :5173 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ✅ Frontend Dev Server: RUNNING on port 5173
) else (
    echo ❌ Frontend Dev Server: NOT RUNNING on port 5173
)

echo.
echo ================================
echo Services Status Summary
echo ================================
echo.
echo You should now see 3 windows total:
echo 1. This main window (batch file)
echo 2. Backend Server window (includes MCP servers)
echo 3. Frontend Dev Server window
echo.
echo SERVICES:
echo - Backend API: http://localhost:3001
echo - Frontend Dashboard: http://localhost:5173
echo - P21 MCP Server: Auto-spawned by Backend
echo - POR MCP Server: Auto-spawned by Backend
echo.
echo Opening dashboard in browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo.
echo ================================
echo Dashboard started successfully!
echo Press any key to exit this window...
pause >nul
