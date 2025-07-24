@echo off
echo Starting Tallman Dashboard with Bypass Mode...

REM Kill any existing Next.js processes on port 5500
echo Checking for existing processes on port 5500...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5500') do (
    echo Killing process %%a
    taskkill /f /pid %%a >nul 2>&1
)

REM Create cache refresh markers
echo Creating cache refresh markers...
if not exist "data" mkdir data
echo %date% %time% > data\refresh_required
echo %date% %time% > data\cache-refresh.txt
echo {"timestamp":"%date% %time%","reason":"Bypass startup"} > data\force_refresh.json
echo %date% %time% > .next-cache-reset

REM Clear Next.js cache
echo Clearing Next.js cache...
if exist ".next" rmdir /s /q .next

REM Start the application
echo Starting dashboard on port 5500...
npx next dev -p 5500

pause
