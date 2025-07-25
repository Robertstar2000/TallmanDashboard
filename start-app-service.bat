@echo off
setlocal enabledelayedexpansion

REM Service-optimized batch file for NSSM
REM No interactive elements (pause, etc.)
REM Comprehensive logging for service debugging

set LOGFILE=c:\Users\BobM\TallmanDashboard\service.log
set APPDIR=c:\Users\BobM\TallmanDashboard

echo ======================================== >> %LOGFILE%
echo Starting Tallman Dashboard Service >> %LOGFILE%
echo Time: %date% %time% >> %LOGFILE%
echo ======================================== >> %LOGFILE%

REM Change to correct directory
cd /d "%APPDIR%"
if errorlevel 1 (
    echo ERROR: Could not change to application directory >> %LOGFILE%
    exit /b 1
)
echo Current directory: %CD% >> %LOGFILE%

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH >> %LOGFILE%
    exit /b 1
)

REM Log Node.js version
for /f "delims=" %%i in ('node --version 2^>^&1') do echo Node.js version: %%i >> %LOGFILE%

REM Kill any existing Next.js processes on port 5500
echo Checking for existing processes on port 5500... >> %LOGFILE%
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5500 2^>nul') do (
    echo Killing existing process %%a >> %LOGFILE%
    taskkill /f /pid %%a >nul 2>&1
)

REM Create cache refresh markers
echo Creating cache refresh markers... >> %LOGFILE%
if not exist "data" mkdir data
echo %date% %time% > data\refresh_required
echo %date% %time% > data\cache-refresh.txt
echo {"timestamp":"%date% %time%","reason":"Service startup"} > data\force_refresh.json
echo %date% %time% > data\.next-cache-reset

REM Clear Next.js cache for fresh start
echo Clearing Next.js cache... >> %LOGFILE%
if exist ".next" (
    rmdir /s /q .next
    if errorlevel 1 (
        echo WARNING: Could not completely remove .next directory >> %LOGFILE%
    ) else (
        echo Successfully cleared .next directory >> %LOGFILE%
    )
)

REM Install any missing dependencies (only if package-lock.json is newer than node_modules)
echo Checking dependencies... >> %LOGFILE%
if not exist "node_modules" (
    echo node_modules not found, running npm install... >> %LOGFILE%
    call npm install --silent >> %LOGFILE% 2>&1
    if errorlevel 1 (
        echo ERROR: npm install failed >> %LOGFILE%
        exit /b 1
    )
) else (
    echo node_modules exists, skipping npm install >> %LOGFILE%
)

REM Log environment info
echo Environment: >> %LOGFILE%
echo   NODE_ENV=%NODE_ENV% >> %LOGFILE%
echo   PATH=%PATH% >> %LOGFILE%
echo   Working Directory: %CD% >> %LOGFILE%

REM Start the application
echo Starting Tallman Dashboard on port 5500... >> %LOGFILE%
echo Command: npx next dev -p 5500 >> %LOGFILE%

REM Start Next.js and redirect output to log file
npx next dev -p 5500 >> %LOGFILE% 2>&1
set EXITCODE=!errorlevel!

REM Log the exit
echo ======================================== >> %LOGFILE%
echo Server stopped >> %LOGFILE%
echo Exit code: !EXITCODE! >> %LOGFILE%
echo Time: %date% %time% >> %LOGFILE%
echo ======================================== >> %LOGFILE%

REM Exit with the same code as Next.js
exit /b !EXITCODE!
