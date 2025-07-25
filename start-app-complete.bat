@echo off
setlocal enabledelayedexpansion

REM Complete service batch file for NSSM
REM Includes dependency rebuild and comprehensive error handling

set LOGFILE=c:\Users\BobM\TallmanDashboard\service.log
set APPDIR=c:\Users\BobM\TallmanDashboard

REM Create log file with timestamp
echo ======================================== > %LOGFILE%
echo Tallman Dashboard Service Starting >> %LOGFILE%
echo Time: %date% %time% >> %LOGFILE%
echo ======================================== >> %LOGFILE%

REM Change to application directory
cd /d "%APPDIR%"
if errorlevel 1 (
    echo FATAL: Cannot change to application directory >> %LOGFILE%
    exit /b 1
)
echo Working directory: %CD% >> %LOGFILE%

REM Check Node.js
node --version >> %LOGFILE% 2>&1
if errorlevel 1 (
    echo FATAL: Node.js not available >> %LOGFILE%
    exit /b 1
)

REM Check npm
npm --version >> %LOGFILE% 2>&1
if errorlevel 1 (
    echo FATAL: npm not available >> %LOGFILE%
    exit /b 1
)

REM Kill any existing processes on port 5500
echo Cleaning up existing processes... >> %LOGFILE%
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5500 2^>nul') do (
    echo Killing process %%a >> %LOGFILE%
    taskkill /f /pid %%a >nul 2>&1
)

REM Clean up old processes by name
taskkill /f /im node.exe /fi "WINDOWTITLE eq *next*" >nul 2>&1
taskkill /f /im node.exe /fi "MEMUSAGE gt 100000" >nul 2>&1

REM Check if node_modules exists and is healthy
if not exist "node_modules" (
    echo node_modules missing, will install... >> %LOGFILE%
    set NEED_INSTALL=1
) else (
    echo node_modules exists, checking health... >> %LOGFILE%
    REM Check if key packages exist
    if not exist "node_modules\next" (
        echo Next.js missing from node_modules, will reinstall... >> %LOGFILE%
        set NEED_INSTALL=1
    ) else (
        echo node_modules appears healthy >> %LOGFILE%
        set NEED_INSTALL=0
    )
)

REM Install dependencies if needed
if "!NEED_INSTALL!"=="1" (
    echo Installing dependencies... >> %LOGFILE%
    
    REM Clean install
    if exist "node_modules" (
        echo Removing old node_modules... >> %LOGFILE%
        rmdir /s /q node_modules >nul 2>&1
    )
    
    if exist "package-lock.json" (
        echo Removing package-lock.json... >> %LOGFILE%
        del package-lock.json >nul 2>&1
    )
    
    echo Running npm install... >> %LOGFILE%
    npm install >> %LOGFILE% 2>&1
    if errorlevel 1 (
        echo FATAL: npm install failed >> %LOGFILE%
        exit /b 1
    )
    echo Dependencies installed successfully >> %LOGFILE%
)

REM Clear Next.js cache
if exist ".next" (
    echo Clearing Next.js cache... >> %LOGFILE%
    rmdir /s /q .next >nul 2>&1
)

REM Create required directories
if not exist "data" mkdir data

REM Set environment variables
set NODE_ENV=development
set NODE_OPTIONS=--max-old-space-size=2048

REM Start the application
echo Starting Next.js development server on port 5500... >> %LOGFILE%
echo Command: npx next dev -p 5500 >> %LOGFILE%
echo ======================================== >> %LOGFILE%

REM Start Next.js with output to log
npx next dev -p 5500 >> %LOGFILE% 2>&1
set EXITCODE=!errorlevel!

REM Log the exit
echo ======================================== >> %LOGFILE%
echo Service stopped >> %LOGFILE%
echo Exit code: !EXITCODE! >> %LOGFILE%
echo Time: %date% %time% >> %LOGFILE%
echo ======================================== >> %LOGFILE%

exit /b !EXITCODE!
