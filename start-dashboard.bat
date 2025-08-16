@echo off
echo ================================
echo Starting Tallman Dashboard System
echo ================================

REM Load POR_FILE_PATH from root .env if present
set "POR_FILE_PATH="
if exist "%~dp0.env" (
  for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0.env") do (
    if /I "%%A"=="POR_FILE_PATH" set "POR_FILE_PATH=%%B"
  )
)

echo.
echo [1/6] Killing any existing processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo [2/6] Starting Backend Server with Background Worker...
start "Backend Server" /D "%~dp0backend" cmd /k "npm start"

echo.
echo [3/6] Starting Frontend Development Server...
start "Frontend Dev Server" /D "%~dp0" cmd /k "npm run dev"

echo.
echo [4/6] Starting P21 MCP Server...
REM Build only if needed
if not exist "P21-MCP-Server-Package\build\index.js" (
  start "P21 MCP (build+start)" /D "%~dp0P21-MCP-Server-Package" cmd /k "npm run build && npm start"
  goto :after_p21
)
start "P21 MCP" /D "%~dp0P21-MCP-Server-Package" cmd /k "npm start"
:after_p21

echo.
echo [5/6] Starting POR MCP Server...
REM Build only if needed
if not exist "POR-MCP-Server-Package\build\index.js" (
  if not defined POR_FILE_PATH (
    echo ERROR: POR_FILE_PATH not found in .env. Please set POR_FILE_PATH in %~dp0.env
  )
  start "POR MCP (build+start)" /D "%~dp0POR-MCP-Server-Package" cmd /k "echo Using POR_FILE_PATH=%POR_FILE_PATH% && npm run build && set POR_FILE_PATH=%POR_FILE_PATH% && npm start"
  goto :after_por
)
if not defined POR_FILE_PATH (
  echo ERROR: POR_FILE_PATH not found in .env. Please set POR_FILE_PATH in %~dp0.env
)
start "POR MCP" /D "%~dp0POR-MCP-Server-Package" cmd /k "echo Using POR_FILE_PATH=%POR_FILE_PATH% && set POR_FILE_PATH=%POR_FILE_PATH% && npm start"
:after_por

echo.
echo [6/6] Waiting for services to initialize...
timeout /t 7 /nobreak >nul

echo.
echo ================================
echo All services started successfully!
echo ================================
echo.
echo SERVICES RUNNING:
echo - Backend Server: http://localhost:3001 (with Background Worker)
echo - Frontend: http://localhost:5173
echo - MCP P21 Server: started in its own window
echo - MCP POR Server: started in its own window
echo.
echo IMPORTANT NOTES
echo - MCP servers are now launched explicitly by this script
echo - Backend may still create transient connections as needed
echo - Admin controls: Start/Stop background worker from admin page
echo.
echo MCP SERVER STATUS:
echo - P21 MCP Server: running in separate window
echo - POR MCP Server: running in separate window
echo - Both communicate via stdio protocol with the backend
echo.
echo NOTE: If a server window closes immediately, check its logs.
echo.
echo Press any key to exit this window...
pause >nul
