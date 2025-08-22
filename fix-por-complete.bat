@echo off
echo === Complete POR Connection Fix ===

echo.
echo Step 1: Installing MCP server dependencies...
cd /d "C:\Users\BobM\Desktop\TallmanDashboard\mcp-servers"
call npm install --silent --no-progress

echo.
echo Step 2: Testing POR MCP server directly...
node verify-por-fix.js

echo.
echo Step 3: Testing through backend controller...
cd /d "C:\Users\BobM\Desktop\TallmanDashboard\backend"
node quick-por-test.js

echo.
echo === Fix Complete ===
echo Restart your TallmanDashboard application to see POR as Connected
pause