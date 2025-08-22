@echo off
echo === Starting POR MCP Server for Windsurf ===
echo.

echo Building POR MCP Server...
cd POR-MCP-Server-Package
call npm run build
if errorlevel 1 (
    echo Build failed, trying to continue anyway...
)

echo.
echo Starting POR MCP Server...
echo Server will run in this window - keep it open for Windsurf MCP tools to work
echo.
echo Environment: POR_FILE_PATH=\\ts03\POR\POR.MDB
echo.

set POR_FILE_PATH=\\ts03\POR\POR.MDB
node build\index.js
