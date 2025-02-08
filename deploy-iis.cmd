@echo off
echo === Starting IIS Node.js Application Deployment ===

REM Set variables
set SITE_NAME=TallmanDashboard
set APP_POOL_NAME=TallmanDashboardPool
set DEPLOY_PATH=C:\inetpub\wwwroot\%SITE_NAME%
set PORT=3200

REM Create deployment directory
if not exist "%DEPLOY_PATH%" mkdir "%DEPLOY_PATH%"

REM Copy application files
xcopy /E /Y /I "%~dp0*" "%DEPLOY_PATH%"

REM Create and configure application pool
"%systemroot%\system32\inetsrv\appcmd.exe" delete apppool "%APP_POOL_NAME%" /commit:apphost
"%systemroot%\system32\inetsrv\appcmd.exe" add apppool /name:"%APP_POOL_NAME%"
"%systemroot%\system32\inetsrv\appcmd.exe" set apppool "%APP_POOL_NAME%" /processModel.identityType:LocalSystem

REM Create website
"%systemroot%\system32\inetsrv\appcmd.exe" delete site "%SITE_NAME%" /commit:apphost
"%systemroot%\system32\inetsrv\appcmd.exe" add site /name:"%SITE_NAME%" /physicalPath:"%DEPLOY_PATH%" /bindings:http/*:%PORT%:
"%systemroot%\system32\inetsrv\appcmd.exe" set site "%SITE_NAME%" /applicationDefaults.applicationPool:"%APP_POOL_NAME%"

REM Set permissions
icacls "%DEPLOY_PATH%" /grant "IIS AppPool\%APP_POOL_NAME%":(OI)(CI)(F)

echo === Deployment Complete ===
echo Your application should now be accessible at: http://localhost:%PORT%
pause
