@echo off
echo Starting Frontend Server on Port 5500...
cd /d "%~dp0"
echo.
echo Frontend starting at: %date% %time%
echo Working directory: %cd%
echo.
npm run dev
pause
