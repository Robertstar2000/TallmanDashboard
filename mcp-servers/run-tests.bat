@echo off
echo === Installing MCP Dependencies ===
cd /d "C:\Users\BobM\Desktop\TallmanDashboard\mcp-servers"
call npm install --timeout=30000

echo.
echo === Testing P21 Connection ===
node test-p21-simple.js

echo.
echo === Testing POR Connection ===
node test-por-simple.js

echo.
echo === All Tests Complete ===
pause