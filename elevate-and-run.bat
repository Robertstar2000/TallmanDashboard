@echo off
:: This script ensures the main script runs with elevation

:: Get the current directory
set "SCRIPT_DIR=%~dp0"

:: Request elevation and run the main script
powershell -NoProfile -ExecutionPolicy Bypass -Command "
    $psi = New-Object System.Diagnostics.ProcessStartInfo;
    $psi.FileName = 'powershell.exe';
    $psi.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + "%SCRIPT_DIR%startup_fixed.ps1" + '"';
    $psi.Verb = 'runas';
    $psi.WorkingDirectory = "%SCRIPT_DIR%";
    [System.Diagnostics.Process]::Start($psi) | Out-Null;
"

exit /b
