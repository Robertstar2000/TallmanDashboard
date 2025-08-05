@echo off
echo ========================================
echo POR MCP Server Installation
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found: 
node --version

echo.
echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Building server...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build server
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy .env.example to .env
echo 2. Edit .env and set POR_DB_PATH to your database file
echo 3. Add server to Claude MCP configuration
echo.
echo See README.md for detailed configuration instructions.
echo.
pause
