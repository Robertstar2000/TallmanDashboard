@echo off
echo === Starting Clean Backend ===

echo.
echo 1. Killing any remaining Node processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo 2. Starting backend server in new window...
cd /d "%~dp0backend"
start "TallmanDashboard Backend" cmd /k "node server-fixed.js"

echo.
echo 3. Backend server started in separate window
echo Check the backend window for startup messages
echo Wait 10 seconds then test the SQL Query Tool

pause
