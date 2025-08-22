@echo off
setlocal enabledelayedexpansion
echo ================================
echo Starting Tallman Dashboard System
echo ================================

echo.
echo [1/6] Checking Node.js installation...
set NODE_PATH=
if exist "C:\Program Files\nodejs\node.exe" (
    set NODE_PATH=C:\Program Files\nodejs\
    echo ✅ Found Node.js at: C:\Program Files\nodejs\
) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set NODE_PATH=C:\Program Files (x86)\nodejs\
    echo ✅ Found Node.js at: C:\Program Files (x86)\nodejs\
) else if exist "%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe" (
    set NODE_PATH=%USERPROFILE%\AppData\Local\Programs\nodejs\
    echo ✅ Found Node.js at: %USERPROFILE%\AppData\Local\Programs\nodejs\
) else (
    echo ❌ ERROR: Node.js not found in standard locations
    echo Please install Node.js and try again
    pause
    exit /b 1
)

echo.
echo [2/6] Checking port availability...
echo Checking if port 3001 is available...
netstat -ano | findstr :3001 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ⚠️  Port 3001 is in use - killing processes...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
) else (
    echo ✅ Port 3001 is available
)

echo Checking if port 5500 is available...
netstat -ano | findstr :5500 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ⚠️  Port 5500 is in use - killing processes...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5500') do taskkill /f /pid %%a >nul 2>&1
) else (
    echo ✅ Port 5500 is available
)

echo Killing any remaining node.exe processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo [3/6] Starting Backend Server with full Node.js path...
start "TallmanDashboard Backend" cmd /k "title TallmanDashboard Backend && cd /d "%~dp0backend" && echo Starting Backend Server... && "!NODE_PATH!node.exe" server-fixed.js && echo Backend stopped - press any key to close && pause"

echo.
echo [4/6] Waiting for backend to initialize...
set /a "attempts=0"
:wait_backend
set /a "attempts+=1"
if !attempts! gtr 15 (
    echo ❌ Backend failed to start after 15 attempts
    goto :skip_frontend
)
timeout /t 2 /nobreak >nul
netstat -ano | findstr :3001 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ✅ Backend is responding on port 3001
    goto :start_frontend
) else (
    echo ⏳ Waiting for backend... attempt !attempts!/15
    goto :wait_backend
)

:start_frontend
echo.
echo [5/6] Starting Frontend Development Server...
start "TallmanDashboard Frontend" cmd /k "title TallmanDashboard Frontend && cd /d "%~dp0" && echo Starting Frontend Dev Server... && "!NODE_PATH!npm.cmd" run dev && echo Frontend stopped - press any key to close && pause"

echo.
echo [6/6] Waiting for frontend to initialize...
set /a "attempts=0"
:wait_frontend
set /a "attempts+=1"
if !attempts! gtr 15 (
    echo ❌ Frontend failed to start after 15 attempts
    goto :final_status
)
timeout /t 2 /nobreak >nul
netstat -ano | findstr :5500 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ✅ Frontend is responding on port 5500
    goto :final_status
) else (
    echo ⏳ Waiting for frontend... attempt !attempts!/15
    goto :wait_frontend
)

:skip_frontend
echo ⚠️  Skipping frontend startup due to backend failure

:final_status
echo.
echo ================================
echo Final System Status Check
echo ================================

echo.
echo Checking Backend (port 3001)...
netstat -ano | findstr :3001 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ✅ Backend Server: RUNNING on port 3001
    set "backend_running=1"
) else (
    echo ❌ Backend Server: NOT RUNNING on port 3001
    set "backend_running=0"
)

echo.
echo Checking Frontend (port 5500)...
netstat -ano | findstr :5500 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ✅ Frontend Dev Server: RUNNING on port 5500
    set "frontend_running=1"
) else (
    echo ❌ Frontend Dev Server: NOT RUNNING on port 5500
    set "frontend_running=0"
)

echo.
echo ================================
echo Services Status Summary
echo ================================
echo.
if "!backend_running!"=="1" if "!frontend_running!"=="1" (
    echo 🎉 ALL SYSTEMS OPERATIONAL
    echo.
    echo You should now see 3 windows total:
    echo 1. This main window (startup status)
    echo 2. TallmanDashboard Backend window
    echo 3. TallmanDashboard Frontend window
    echo.
    echo SERVICES:
    echo - Backend API: http://localhost:3001 ✅
    echo - Frontend Dashboard: http://localhost:5500 ✅
    echo - P21 MCP Server: Auto-spawned by Backend ✅
    echo - POR MCP Server: Auto-spawned by Backend ✅
    echo - SQL Internal DB: Integrated with Backend ✅
    echo.
    echo Opening dashboard in browser in 5 seconds...
    timeout /t 5 /nobreak >nul
    start http://localhost:5500
    echo.
    echo ================================
    echo Dashboard started successfully!
    echo All connections should show green dots
) else (
    echo ⚠️  PARTIAL SYSTEM FAILURE
    echo.
    echo Please check the individual server windows for error messages
    echo Backend running: !backend_running!
    echo Frontend running: !frontend_running!
    echo.
    if "!backend_running!"=="0" (
        echo 🔧 Backend troubleshooting:
        echo - Check if Node.js is properly installed
        echo - Verify backend/server-fixed.js exists
        echo - Check for port conflicts on 3001
    )
    if "!frontend_running!"=="0" (
        echo 🔧 Frontend troubleshooting:
        echo - Check if npm dependencies are installed
        echo - Verify package.json exists in root directory
        echo - Check for port conflicts on 5500
    )
)

echo.
echo Press any key to exit this startup window...
pause >nul
