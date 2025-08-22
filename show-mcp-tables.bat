@echo off
echo === MCP Table List Retrieval Test ===
echo.

echo [1/3] Building P21 MCP Server...
cd P21-MCP-Server-Package
call npm run build >nul 2>&1
cd ..

echo [2/3] Building POR MCP Server...
cd POR-MCP-Server-Package
call npm run build >nul 2>&1
cd ..

echo [3/3] Running MCP table list test...
echo.
echo This will show actual tables from your P21 and POR databases:
echo.

node test-mcp-list-tables.js

echo.
echo === Test Complete ===
pause
