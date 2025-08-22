@echo off
echo === Complete POR Status Fix ===

echo.
echo Step 1: Install dependencies...
cd /d "C:\Users\BobM\Desktop\TallmanDashboard\mcp-servers"
call npm install mdb-reader node-fetch

echo.
echo Step 2: Install node-fetch for testing...
cd /d "C:\Users\BobM\Desktop\TallmanDashboard"
call npm install node-fetch

echo.
echo Step 3: Test POR MCP server directly...
cd /d "C:\Users\BobM\Desktop\TallmanDashboard"
set POR_DB_PATH=\\ts03\POR\POR.MDB
node test-por-status.js

echo.
echo Step 4: Test backend status endpoint...
node test-status-endpoint.js

echo.
echo Step 5: Restart backend with fixed POR connection...
echo ** MANUAL STEP **
echo Please restart your backend server:
echo   cd backend
echo   set POR_DB_PATH=\\ts03\POR\POR.MDB
echo   node server.js
echo.
echo Then refresh your dashboard to see POR as Connected.

pause