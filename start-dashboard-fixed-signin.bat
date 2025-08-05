@echo off
echo ================================
echo Starting Tallman Dashboard System
echo ================================

echo.
echo [1/6] Killing processes on required ports...
echo Killing processes on port 3001 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
echo Killing processes on port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1
echo Killing any remaining node.exe processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo [2/6] Installing/updating backend dependencies...
cd /d "%~dp0backend"
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)
cd /d "%~dp0"

echo.
echo [3/6] Starting Backend Server (includes MCP servers)...
start "Backend Server" /d "%~dp0backend" cmd /k "node server.js"

echo.
echo [4/6] Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

echo.
echo [5/6] Verifying Backend is running...
netstat -ano | findstr :3001 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ✅ Backend Server: RUNNING on port 3001
    goto :start_frontend
) else (
    echo ❌ Backend Server: NOT RUNNING on port 3001
    echo ⚠️  Checking for backend errors...
    echo Please check the Backend Server window for error messages
    goto :backend_failed
)

:start_frontend
echo.
echo [6/6] Starting Frontend Development Server...
start "Frontend Dev Server" /d "%~dp0" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

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
echo.
echo If sign-in fails:
echo 1. Check Backend Server window for errors
echo 2. Verify port 3001 is accessible
echo 3. Try refreshing the browser
goto :end

:backend_failed
echo.
echo [6/6] Skipping frontend due to backend issues...
echo.
echo ================================
echo ❌ STARTUP FAILED
echo ================================
echo.
echo The backend server failed to start properly.
echo Please check the Backend Server window for error messages.
echo.
echo Common issues:
echo - Missing dependencies (run: npm install in backend folder)
echo - Port 3001 already in use
echo - Module loading errors
echo - MCP server configuration issues

:end
echo.
echo Press any key to exit this window...
pause >nul
