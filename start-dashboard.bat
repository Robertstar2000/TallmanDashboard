@echo off
:: Batch file to start TallmanDashboard with proper cleanup and error handling
:: Automatically requests elevation if needed

SETLOCAL EnableDelayedExpansion

:: Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"

:: Change to the script directory
cd /d "%SCRIPT_DIR%"

:: Check for elevation
net session >nul 2>nul
if %errorLevel% == 0 (
    set ELEVATED=1
) else (
    set ELEVATED=0
)

:: If not elevated, relaunch with elevation
if %ELEVATED% EQU 0 (
    echo Requesting administrator privileges...
    set "ELEVATE_CMDLINE=cd /d "%CD%" && "%~f0" %*"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c "%ELEVATE_CMDLINE%"' -Verb RunAs -WorkingDirectory \"%CD%\""
    exit /b
)

:: Kill any existing Node.js processes (now that we're elevated)
taskkill /F /IM node.exe >nul 2>&1

echo ====================================================
echo  Tallman Dashboard Startup - Port 60005
echo  %date% %time%
echo ====================================================
echo [INFO] Running from: %CD%
echo [INFO] Running with administrator privileges
echo.

:: Clean up any existing Node.js processes
echo [INFO] Cleaning up any existing Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /i "node.exe" >nul
if %ERRORLEVEL% == 0 (
    taskkill /F /IM node.exe >nul 2>&1
    if %ERRORLEVEL% == 0 (
        echo [INFO] Stopped all Node.js processes
    ) else (
        echo [WARNING] Could not stop all Node.js processes. Some may still be running.
    )
    timeout /t 2 >nul
) else (
    echo [INFO] No Node.js processes found
)

:: Check if port 60005 is in use and kill the process
echo [INFO] Checking if port 60005 is in use...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":60005" ^| findstr "LISTENING"') do (
    echo [INFO] Found process using port 60005, PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %ERRORLEVEL% == 0 (
        echo [INFO] Stopped process with PID: %%a
    ) else (
        echo [WARNING] Could not stop process with PID: %%a
    )
    timeout /t 2 >nul
)

:: Run the fixed PowerShell script with execution policy bypass
echo.
echo [INFO] Starting Next.js development server...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\startup_fixed.ps1"
set EXIT_CODE=!errorlevel!

:: Pause to show any error messages
if !EXIT_CODE! NEQ 0 (
    echo.
    echo [ERROR] Startup script failed with exit code !EXIT_CODE!
    echo.
    pause
) else (
    echo.
    echo [INFO] Startup completed successfully
    timeout /t 3 >nul
)

ENDLOCAL
exit /b %EXIT_CODE%
