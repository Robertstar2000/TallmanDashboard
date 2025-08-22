@echo off
cd /d "C:\Users\BobM\Desktop\TallmanDashboard\mcp-servers"
set POR_DB_PATH=\\ts03\POR\POR.MDB
node auto-fix-por.js
pause