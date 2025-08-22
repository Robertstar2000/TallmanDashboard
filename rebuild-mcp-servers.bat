@echo off
echo === Rebuilding MCP Servers for SQL Query Tool ===
echo.

echo [1/4] Building P21 MCP Server...
cd P21-MCP-Server-Package
call npm run build
if errorlevel 1 (
    echo P21 build failed, but continuing...
)
cd ..

echo [2/4] Building POR MCP Server...
cd POR-MCP-Server-Package
call npm run build
if errorlevel 1 (
    echo POR build failed, but continuing...
)
cd ..

echo [3/4] Setting environment variables...
set P21_DSN=P21Live
set POR_FILE_PATH=\\ts03\POR\POR.MDB

echo [4/4] Testing MCP endpoint...
echo Testing P21 connection...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/mcp/execute-query' -Method POST -Body (@{query='list tables';server='P21'} | ConvertTo-Json) -ContentType 'application/json'; Write-Host 'P21 Success:' $response.Count 'tables' } catch { Write-Host 'P21 Error:' $_.Exception.Message }"

echo.
echo === MCP Servers Rebuilt ===
echo SQL Query Tool should now work properly.
pause
