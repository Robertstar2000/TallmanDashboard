@echo off
echo Testing Backend Server...
cd /d "%~dp0backend"
echo Current directory: %cd%
echo.
echo Checking dependencies...
npm list express cors
echo.
echo Starting server...
node verbose-server.cjs
echo.
echo Server exited with code: %errorlevel%
pause
