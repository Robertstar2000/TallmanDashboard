@echo off
echo Starting Tallman Dashboard Application with Debug Info...
echo Current directory: %CD%
echo Current time: %date% %time%
echo.

REM Check if Node.js is available
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)
echo Node.js version:
node --version

REM Check if npm is available
echo Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)
echo npm version:
npm --version

REM Kill any existing Next.js processes on port 5500
echo Checking for existing processes on port 5500...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5500') do (
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
    echo Removing .next directory...
    rmdir /s /q .next
    if errorlevel 1 (
        echo WARNING: Could not remove .next directory completely
    )
)

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found in current directory
    pause
    exit /b 1
)

REM Install any missing dependencies
echo Checking dependencies...
echo Running npm install...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

REM Check if Next.js is installed
echo Checking Next.js installation...
npx next --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Next.js is not installed
    pause
    exit /b 1
)
echo Next.js version:
npx next --version

REM Start the application with detailed output
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
set EXIT_CODE=%errorlevel%

echo.
echo ========================================
echo   SERVER STOPPED
echo   Exit code: %EXIT_CODE%
echo   Time: %date% %time%
echo ========================================

if %EXIT_CODE% neq 0 (
    echo ERROR: Server exited with error code %EXIT_CODE%
)

pause
