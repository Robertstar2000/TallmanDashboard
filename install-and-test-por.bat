@echo off
echo Installing 3 MS Access libraries for POR server...
cd /d "C:\Users\BobM\Desktop\TallmanDashboard\mcp-servers"

echo.
echo Installing node-adodb, mdb-tools-js, node-mdb...
call npm install

echo.
echo Testing POR 3-Library MCP server...
cd /d "C:\Users\BobM\Desktop\TallmanDashboard"

echo.
echo Starting POR server test...
set POR_DB_PATH=\\ts03\POR\POR.MDB
node mcp-servers/por-server-3lib.js

pause
