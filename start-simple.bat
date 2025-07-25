@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Starting Tallman Dashboard (Simple)
echo Time: %date% %time%
echo ========================================

REM Change to the correct directory
cd /d "c:\Users\BobM\TallmanDashboard"
echo Current directory: %CD%

REM Kill any existing processes on port 5500
echo Killing any existing processes on port 5500...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5500 2^>nul') do (
    echo Found process %%a on port 5500, killing...
    taskkill /f /pid %%a >nul 2>&1
)

REM Clear cache
echo Clearing cache...
if exist ".next" rmdir /s /q ".next" 2>nul

REM Create log file for debugging
set LOGFILE=start-app.log
echo Starting application at %date% %time% > %LOGFILE%

echo Starting Next.js development server...
echo Command: npx next dev -p 5500
echo.

REM Start the server and capture output
npx next dev -p 5500 2>&1

REM Capture the exit code
set EXITCODE=!errorlevel!
echo. >> %LOGFILE%
echo Server stopped with exit code: !EXITCODE! >> %LOGFILE%
echo Time: %date% %time% >> %LOGFILE%

echo.
echo ========================================
echo Server stopped with exit code: !EXITCODE!
echo Check %LOGFILE% for details
echo ========================================

REM Don't auto-close so we can see what happened
pause
