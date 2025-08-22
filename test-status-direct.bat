@echo off
echo === Testing POR Status Issue ===

echo.
echo Step 1: Install node-fetch for testing...
cd /d "C:\Users\BobM\Desktop\TallmanDashboard"
call npm install node-fetch

echo.
echo Step 2: Testing status endpoint directly...
set POR_DB_PATH=\\ts03\POR\POR.MDB
node test-status-endpoint.js

echo.
echo Step 3: Testing POR MCP connection directly...
node test-por-status.js

pause