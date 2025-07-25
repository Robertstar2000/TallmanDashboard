@echo off
setlocal enabledelayedexpansion

echo Starting Tallman Dashboard Application...
echo Current directory: %CD%
echo Time: %date% %time%

REM Change to correct directory
cd /d "c:\Users\BobM\TallmanDashboard"
if errorlevel 1 (
    echo ERROR: Could not change to application directory
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Kill any existing Next.js processes on port 5500
echo Checking for existing processes on port 5500...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5500 2^>nul') do (
    echo Killing process %%a
    taskkill /f /pid %%a >nul 2>&1
)

REM Create cache refresh markers
echo Creating cache refresh markers...
if not exist "data" mkdir data
echo %date% %time% > data\refresh_required
echo %date% %time% > data\cache-refresh.txt
echo {"timestamp":"%date% %time%","reason":"Application startup"} > data\force_refresh.json
echo %date% %time% > data\.next-cache-reset

REM Clear Next.js cache for fresh start
echo Clearing Next.js cache...
if exist ".next" (
    rmdir /s /q .next
    if errorlevel 1 echo WARNING: Could not completely remove .next directory
)

REM Install any missing dependencies
echo Checking dependencies...
call npm install --silent
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

REM Start the application
echo Starting Tallman Dashboard on port 5500...
echo.
echo ========================================
echo   TALLMAN DASHBOARD STARTING
echo   URL: http://localhost:5500
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

echo Running: npx next dev -p 5500
npx next dev -p 5500
set EXITCODE=!errorlevel!

echo.
echo ========================================
echo   SERVER STOPPED
echo   Exit code: !EXITCODE!
echo   Time: %date% %time%
echo ========================================

if !EXITCODE! neq 0 (
    echo ERROR: Server exited with error code !EXITCODE!
)

pause
