@echo off
echo === Manual MCP Table List Test ===
echo.

echo Testing MCP servers manually...
echo This will show actual table results from P21 and POR databases

echo.
echo [1/2] Starting P21 MCP Server test...
cd /d "P21-MCP-Server-Package"
echo Building P21 server...
call npm run build >nul 2>&1

echo.
echo [2/2] Starting POR MCP Server test...
cd /d "..\POR-MCP-Server-Package"
echo Building POR server...
call npm run build >nul 2>&1

echo.
echo Running table list test...
cd /d ".."
node test-mcp-list-tables.js

echo.
echo Test complete!
pause
