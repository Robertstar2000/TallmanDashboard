@echo off
echo === Simple MCP Test ===

echo.
echo 1. Killing existing Node processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo 2. Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0backend && node server-fixed.js"

echo.
echo 3. Waiting for server startup...
timeout /t 8 /nobreak >nul

echo.
echo 4. Testing backend status...
curl -s http://localhost:3001/api/status

echo.
echo 5. Testing P21 list tables...
curl -s -X POST -H "Content-Type: application/json" -d "{\"query\":\"list tables\",\"server\":\"P21\"}" http://localhost:3001/api/mcp/execute-query

echo.
echo 6. Testing POR list tables...
curl -s -X POST -H "Content-Type: application/json" -d "{\"query\":\"list tables\",\"server\":\"POR\"}" http://localhost:3001/api/mcp/execute-query

echo.
echo === Test Complete ===
pause
