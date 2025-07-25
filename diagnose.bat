@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Tallman Dashboard Diagnostic
echo ========================================

cd /d "c:\Users\BobM\TallmanDashboard"
echo Current directory: %CD%

echo.
echo Node.js version:
node --version

echo.
echo npm version:
npm --version

echo.
echo Checking for package.json:
if exist "package.json" (
    echo ✓ package.json exists
) else (
    echo ✗ package.json missing
)

echo.
echo Checking for node_modules:
if exist "node_modules" (
    echo ✓ node_modules exists
    if exist "node_modules\next" (
        echo ✓ Next.js installed
    ) else (
        echo ✗ Next.js not found in node_modules
    )
) else (
    echo ✗ node_modules missing
)

echo.
echo Checking for .next:
if exist ".next" (
    echo ✓ .next directory exists
) else (
    echo ✗ .next directory missing (normal for first run)
)

echo.
echo Checking port 5500:
netstat -aon | findstr :5500
if errorlevel 1 (
    echo ✓ Port 5500 is free
) else (
    echo ✗ Port 5500 is in use
)

echo.
echo Testing Next.js command:
echo Running: npx next --help
npx next --help

echo.
echo ========================================
echo Diagnostic complete
echo ========================================

pause
