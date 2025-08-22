@echo off
echo Starting Backend Server on Port 3001...
cd /d "%~dp0backend"
echo.
echo Backend starting at: %date% %time%
echo Working directory: %cd%
echo.
node server-fixed.js
pause
