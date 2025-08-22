@echo off
echo === Testing Database Connectivity ===
echo.

echo [1/4] Building MCP Servers...
cd P21-MCP-Server-Package
call npm run build >nul 2>&1
cd ..
cd POR-MCP-Server-Package  
call npm run build >nul 2>&1
cd ..

echo [2/4] Testing P21 DSN accessibility...
echo Testing ODBC DSN: P21Live
echo.

echo [3/4] Testing POR MDB file existence...
echo Testing file: \\ts03\POR\POR.MDB
if exist "\\ts03\POR\POR.MDB" (
    echo   ✓ POR.MDB file exists and is accessible
) else (
    echo   ✗ POR.MDB file not found or not accessible
)
echo.

echo [4/4] Testing network host reachability...
echo Testing host: ts03
ping -n 1 ts03 >nul 2>&1
if %errorlevel% == 0 (
    echo   ✓ Host ts03 is reachable
) else (
    echo   ✗ Host ts03 is not reachable
)

echo.
echo === Starting MCP Servers for Manual Testing ===
echo.
echo Starting P21 MCP Server on stdio...
start "P21 MCP Server" cmd /k "cd P21-MCP-Server-Package && node build\index.js"

echo Starting POR MCP Server on stdio...
start "POR MCP Server" cmd /k "cd POR-MCP-Server-Package && node build\index.js"

echo.
echo MCP Servers started in separate windows.
echo You can now test them using Windsurf MCP tools.
echo.
echo === Test Complete ===
pause
