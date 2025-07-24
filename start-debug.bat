@echo off
:: Start Next.js with debug logging

echo Stopping any running Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Starting Next.js with debug logging...
set DEBUG=next:*
start "" cmd /c "npm run dev"

echo Waiting for server to start...
timeout /t 5 >nul

start "" http://localhost:60005
echo Server started. Check the terminal for debug output.
