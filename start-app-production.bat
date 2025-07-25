@echo off
setlocal enabledelayedexpansion

REM Production service batch file for NSSM
REM Optimized for Windows Service deployment
REM Minimal logging, maximum reliability

set LOGFILE=c:\Users\BobM\TallmanDashboard\production.log
set APPDIR=c:\Users\BobM\TallmanDashboard
set NODE_ENV=production

REM Rotate log file if it gets too large (>10MB)
if exist "%LOGFILE%" (
    for %%A in ("%LOGFILE%") do (
        if %%~zA gtr 10485760 (
            move "%LOGFILE%" "%LOGFILE%.old" >nul 2>&1
        )
    )
)

echo [%date% %time%] Service starting >> %LOGFILE%

REM Change to application directory
cd /d "%APPDIR%" || (
    echo [%date% %time%] FATAL: Cannot access application directory >> %LOGFILE%
    exit /b 1
)

REM Verify Node.js
node --version >nul 2>&1 || (
    echo [%date% %time%] FATAL: Node.js not available >> %LOGFILE%
    exit /b 1
)

REM Clean up any existing processes
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5500 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM Ensure data directory exists
if not exist "data" mkdir data

REM Quick cache cleanup
if exist ".next" rmdir /s /q .next >nul 2>&1

REM Set production environment
set NODE_ENV=production
set NODE_OPTIONS=--max-old-space-size=2048

REM Start the application
echo [%date% %time%] Starting Next.js server on port 5500 >> %LOGFILE%

REM For production, use next start instead of next dev
REM But first check if we have a build
if not exist ".next" (
    echo [%date% %time%] No build found, running development server >> %LOGFILE%
    npx next dev -p 5500 >> %LOGFILE% 2>&1
) else (
    echo [%date% %time%] Using production build >> %LOGFILE%
    npx next start -p 5500 >> %LOGFILE% 2>&1
)

set EXITCODE=!errorlevel!
echo [%date% %time%] Service stopped with exit code !EXITCODE! >> %LOGFILE%

exit /b !EXITCODE!
