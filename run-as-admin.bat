@echo off
:: Simple batch file to run the dashboard with elevation

:: Kill any existing Node.js processes first
taskkill /F /IM node.exe >nul 2>&1

:: Run the main script with elevation
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c cd /d "%CD%" && start-dashboard.bat' -Verb RunAs"

:: Keep the window open to see any errors
pause
