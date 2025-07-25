@echo off
setlocal enabledelayedexpansion

REM Minimal batch file for NSSM - just start Next.js
set LOGFILE=c:\Users\BobM\TallmanDashboard\minimal.log
set APPDIR=c:\Users\BobM\TallmanDashboard

echo Minimal service starting at %date% %time% > %LOGFILE%

cd /d "%APPDIR%"
echo Changed to directory: %CD% >> %LOGFILE%

REM Kill any existing processes
taskkill /f /im node.exe >nul 2>&1
echo Killed existing node processes >> %LOGFILE%

REM Try to start Next.js directly
echo Attempting to start Next.js... >> %LOGFILE%

REM Try different approaches
if exist "node_modules\next\dist\bin\next" (
    echo Using local Next.js installation >> %LOGFILE%
    node node_modules\next\dist\bin\next dev -p 5500 >> %LOGFILE% 2>&1
) else (
    echo Using npx Next.js >> %LOGFILE%
    npx next dev -p 5500 >> %LOGFILE% 2>&1
)

set EXITCODE=!errorlevel!
echo Service stopped with exit code !EXITCODE! at %date% %time% >> %LOGFILE%

exit /b !EXITCODE!
