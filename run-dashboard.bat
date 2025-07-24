@echo off
:: Simple batch file to run the dashboard with elevation

:: Kill any existing Node.js processes
taskkill /F /IM node.exe >nul 2>&1

:: Run the PowerShell script with elevation
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%~dp0startup_fixed.ps1""' -Verb RunAs -WorkingDirectory ""%~dp0"""

exit /b
