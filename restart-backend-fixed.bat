@echo off
echo === Restart Backend with POR Fix ===

echo.
echo Setting environment variables...
set POR_DB_PATH=\\ts03\POR\POR.MDB

echo.
echo Stopping any existing backend processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Starting backend with fixed POR connection...
cd /d "C:\Users\BobM\Desktop\TallmanDashboard\backend"
echo Backend starting on port 3001...
echo POR using mdbreader at: %POR_DB_PATH%
echo.
node server.js