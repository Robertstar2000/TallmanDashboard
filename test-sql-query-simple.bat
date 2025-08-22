@echo off
echo === Testing SQL Query Tool Endpoint ===
echo.

echo Testing P21 table list...
curl -X POST http://localhost:3001/api/mcp/execute-query ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"list tables\",\"server\":\"P21\"}"

echo.
echo.
echo Testing simple P21 query...
curl -X POST http://localhost:3001/api/mcp/execute-query ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"SELECT COUNT(*) as value FROM customer\",\"server\":\"P21\"}"

echo.
echo.
echo === Test Complete ===
pause
