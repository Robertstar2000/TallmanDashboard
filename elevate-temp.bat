@echo off
:: This script uses VBS to request elevation and run the main script

set "SCRIPT_DIR=%~dp0"
set "VBS_SCRIPT=%TEMP%\elevate.vbs"

:: Create a VBS script to handle elevation
echo Set UAC = CreateObject("Shell.Application") > "%VBS_SCRIPT%"
echo UAC.ShellExecute "cmd.exe", "/c """%SCRIPT_DIR%startup_fixed.ps1""", "%SCRIPT_DIR%", "runas", 1 >> "%VBS_SCRIPT%"

:: Run the VBS script
cscript //nologo "%VBS_SCRIPT%"

del "%VBS_SCRIPT%" >nul 2>&1
exit /b
