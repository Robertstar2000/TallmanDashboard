@echo off
echo P21 MCP Server Installation Script
echo ==================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18 or higher from https://nodejs.org/
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
echo Building the server...
npm run build

if %errorlevel% neq 0 (
    echo ERROR: Failed to build the server
    pause
    exit /b 1
)

echo.
echo Installation completed successfully!
echo.
echo Next steps:
echo 1. Configure your .env file with P21_DSN
echo 2. Set up ODBC DSN for your P21 database
echo 3. Add this server to your Claude MCP configuration
echo.
echo See README.md for detailed configuration instructions.
echo.
pause
