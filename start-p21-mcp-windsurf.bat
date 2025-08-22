@echo off
echo Starting P21 MCP Server for Windsurf MCP Tools
echo ==============================================

cd P21-MCP-Server-Package

echo Building P21 MCP Server...
npm run build

if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Starting P21 MCP Server...
echo This server will run in the background for Windsurf MCP tools
echo Keep this window open while testing
echo.

node build/index.js
