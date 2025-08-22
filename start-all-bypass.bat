@echo off
setlocal enabledelayedexpansion

echo === TallmanDashboard Complete Startup Script ===
echo.

:: Kill any existing processes
echo [1/6] Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start Backend Server
echo [2/6] Starting Backend Server...
start "TallmanDashboard Backend" cmd /k "cd /d %~dp0backend && node server-fixed.js"
timeout /t 3 /nobreak >nul

:: Start P21 MCP Server
echo [3/6] Starting P21 MCP Server...
start "P21 MCP Server" cmd /k "cd /d %~dp0P21-MCP-Server-Package && set P21_DSN=P21Live && npm run build >nul 2>&1 && node build\index.js"
timeout /t 2 /nobreak >nul

:: Start POR MCP Server
echo [4/6] Starting POR MCP Server...
start "POR MCP Server" cmd /k "cd /d %~dp0POR-MCP-Server-Package && set POR_FILE_PATH=\\ts03\POR\POR.MDB && npm run build >nul 2>&1 && node build\index.js"
timeout /t 2 /nobreak >nul

:: Start Frontend Server
echo [5/6] Starting Frontend Server...
start "TallmanDashboard Frontend" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

:: Open Dashboard in Browser
echo [6/6] Opening Dashboard in Browser...
timeout /t 3 /nobreak >nul
start http://localhost:5500

echo.
echo === All Services Started ===
echo Backend:    http://localhost:3001
echo Frontend:   http://localhost:5500
echo P21 MCP:    Running on stdio
echo POR MCP:    Running on stdio
echo.
echo Dashboard should open automatically in your browser.
echo Keep all server windows open for the dashboard to work properly.
echo.
pause
