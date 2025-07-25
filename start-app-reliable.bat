@echo off
setlocal enabledelayedexpansion

REM Ultra-reliable service batch file for NSSM
REM Minimal operations, maximum reliability

set LOGFILE=c:\Users\BobM\TallmanDashboard\service.log
set APPDIR=c:\Users\BobM\TallmanDashboard

REM Create log file immediately
echo Service batch started at %date% %time% > %LOGFILE%

REM Change directory
echo Changing to %APPDIR% >> %LOGFILE%
cd /d "%APPDIR%"
if errorlevel 1 (
    echo FATAL: Cannot change directory >> %LOGFILE%
    exit /b 1
)

REM Test Node.js availability
echo Testing Node.js... >> %LOGFILE%
node --version >> %LOGFILE% 2>&1
if errorlevel 1 (
    echo FATAL: Node.js not available >> %LOGFILE%
    exit /b 1
)

REM Kill existing processes (simple approach)
echo Killing existing processes... >> %LOGFILE%
taskkill /f /im node.exe /fi "WINDOWTITLE eq *5500*" >nul 2>&1
taskkill /f /im node.exe /fi "MEMUSAGE gt 50000" >nul 2>&1

REM Create minimal required directories
if not exist "data" mkdir data
if not exist ".next" echo No .next directory found >> %LOGFILE%

REM Skip npm install for service - assume dependencies are already installed
echo Skipping npm install for service mode >> %LOGFILE%

REM Set environment for service
set NODE_ENV=development
set NODE_OPTIONS=--max-old-space-size=1024

REM Start Next.js with timeout protection
echo Starting Next.js server... >> %LOGFILE%
echo Command: npx next dev -p 5500 >> %LOGFILE%

REM Use timeout to prevent hanging
timeout /t 5 /nobreak >nul
npx next dev -p 5500 >> %LOGFILE% 2>&1

set EXITCODE=!errorlevel!
echo Service stopped with exit code !EXITCODE! at %date% %time% >> %LOGFILE%

exit /b !EXITCODE!
