@echo off
echo === Fixing Node.js Issues ===

echo.
echo 1. Killing all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js processes terminated
) else (
    echo ⚠️  No Node.js processes found or already terminated
)

echo.
echo 2. Clearing npm cache...
npm cache clean --force
if %errorlevel% equ 0 (
    echo ✅ NPM cache cleared
) else (
    echo ❌ Failed to clear npm cache
)

echo.
echo 3. Removing node_modules directory...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ node_modules removed
) else (
    echo ⚠️  node_modules directory not found
)

echo.
echo 4. Reinstalling dependencies...
npm install
if %errorlevel% equ 0 (
    echo ✅ Dependencies reinstalled successfully
) else (
    echo ❌ Failed to reinstall dependencies
    pause
    exit /b 1
)

echo.
echo 5. Checking installation...
if exist node_modules (
    echo ✅ node_modules directory created
    dir node_modules | find "Directory" | find /c "Directory"
) else (
    echo ❌ node_modules directory missing
)

echo.
echo === Node.js Issues Fixed ===
echo Ready to test MCP functionality
pause
