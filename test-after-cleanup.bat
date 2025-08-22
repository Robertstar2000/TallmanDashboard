@echo off
echo === Testing MCP After Cleanup ===

echo.
echo 1. Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0backend && node server-fixed.js"

echo.
echo 2. Waiting for server startup...
timeout /t 10 /nobreak

echo.
echo 3. Testing backend status...
curl -s http://localhost:3001/api/status
echo.

echo.
echo 4. Testing P21 list tables...
curl -s -X POST -H "Content-Type: application/json" -d "{\"query\":\"list tables\",\"server\":\"P21\"}" http://localhost:3001/api/mcp/execute-query
echo.

echo.
echo 5. Testing POR list tables...
curl -s -X POST -H "Content-Type: application/json" -d "{\"query\":\"list tables\",\"server\":\"POR\"}" http://localhost:3001/api/mcp/execute-query
echo.

echo.
echo 6. Testing connection status...
curl -s http://localhost:3001/api/connections/status
echo.

echo.
echo === Test Complete ===
echo If you see actual table names above (not empty arrays or 99999), the fix worked!
pause
