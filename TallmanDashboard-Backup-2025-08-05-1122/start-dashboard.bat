@echo off
echo ================================
echo Starting Tallman Dashboard System
echo ================================

echo.
echo [1/4] Killing any existing processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo [2/4] Starting Backend Server with Background Worker...
start "Backend Server" cmd /c "cd backend && npm start"

echo.
echo [3/4] Starting Frontend Development Server...
start "Frontend Dev Server" cmd /c "npm run dev"

echo.
echo [4/4] Waiting for services to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ================================
echo All services started successfully!
echo ================================
echo.
echo SERVICES RUNNING:
echo - Backend Server: http://localhost:3001 (with Background Worker)
echo - Frontend: http://localhost:5173
echo.
echo IMPORTANT: Background Worker Architecture
echo - Backend automatically spawns MCP connections on demand
echo - Background worker continuously processes SQL queries  
echo - MCP servers started by backend as child processes
echo - Production mode: Auto-executes queries via MCP servers
echo - Admin controls: Start/Stop worker from admin page
echo.
echo MCP SERVER STATUS:
echo - P21 MCP Server: Auto-spawned by Backend Worker
echo - POR MCP Server: Auto-spawned by Backend Worker
echo - Both servers communicate via stdio protocol
echo - Background worker manages MCP connections automatically
echo.
echo NOTE: MCP servers are now managed by the backend process
echo and will be spawned automatically when needed for queries.
echo.
echo Press any key to exit this window...
pause >nul
