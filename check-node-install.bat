@echo off
echo ================================
echo Node.js Installation Check
echo ================================
echo.

echo Checking standard installation paths...
echo.

if exist "C:\Program Files\nodejs\node.exe" (
    echo ✓ Found: C:\Program Files\nodejs\node.exe
    "C:\Program Files\nodejs\node.exe" --version
    echo.
) else (
    echo ✗ Not found: C:\Program Files\nodejs\node.exe
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo ✓ Found: C:\Program Files (x86)\nodejs\node.exe
    "C:\Program Files (x86)\nodejs\node.exe" --version
    echo.
) else (
    echo ✗ Not found: C:\Program Files (x86)\nodejs\node.exe
)

if exist "%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe" (
    echo ✓ Found: %USERPROFILE%\AppData\Local\Programs\nodejs\node.exe
    "%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe" --version
    echo.
) else (
    echo ✗ Not found: %USERPROFILE%\AppData\Local\Programs\nodejs\node.exe
)

echo.
echo Checking PATH environment variable...
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js is in PATH
    node --version
    npm --version
) else (
    echo ✗ Node.js is NOT in PATH
    echo.
    echo To fix this, you need to:
    echo 1. Add Node.js installation directory to your system PATH
    echo 2. Or restart your command prompt/IDE after Node.js installation
    echo 3. Or restart Windows to refresh environment variables
)

echo.
echo Current PATH contains:
echo %PATH% | findstr /i node
if %errorlevel% neq 0 (
    echo No Node.js paths found in PATH variable
)

echo.
pause
