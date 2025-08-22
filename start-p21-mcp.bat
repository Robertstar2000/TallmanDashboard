@echo off
echo Starting P21 MCP Server for Windsurf testing...
echo =============================================

cd /d "P21-MCP-Server-Package"

echo Building P21 MCP Server...
call npm run build

echo.
echo Starting P21 MCP Server...
echo Press Ctrl+C to stop the server
echo.

node build/index.js
