@echo off
:: Simple script to start the Next.js server directly

:: Kill any existing Node.js processes
taskkill /F /IM node.exe >nul 2>&1

:: Start the Next.js server
start "" cmd /c "cd /d %~dp0 && npm run dev"

echo Server is starting on port 60005...
start "" http://localhost:60005

pause
