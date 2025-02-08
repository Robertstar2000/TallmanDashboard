@echo off
echo === Starting IIS Node.js Application Deployment ===

set SITE_NAME=TallmanDashboard
set APP_POOL=TallmanDashboardPool
set DEPLOY_PATH=C:\inetpub\wwwroot\TallmanDashboard
set PORT=3200

echo Creating deployment directory...
if not exist "%DEPLOY_PATH%" mkdir "%DEPLOY_PATH%"

echo Copying files...
xcopy /E /Y /I * "%DEPLOY_PATH%"

echo Configuring IIS...
%windir%\system32\inetsrv\appcmd.exe delete site "%SITE_NAME%" /commit:apphost
%windir%\system32\inetsrv\appcmd.exe delete apppool "%APP_POOL%" /commit:apphost

%windir%\system32\inetsrv\appcmd.exe add apppool /name:"%APP_POOL%"
%windir%\system32\inetsrv\appcmd.exe set apppool "%APP_POOL%" /processModel.identityType:LocalSystem

%windir%\system32\inetsrv\appcmd.exe add site /name:"%SITE_NAME%" /bindings:http/*:%PORT%: /physicalPath:"%DEPLOY_PATH%"
%windir%\system32\inetsrv\appcmd.exe set site "%SITE_NAME%" /applicationDefaults.applicationPool:"%APP_POOL%"

echo Setting permissions...
icacls "%DEPLOY_PATH%" /grant "IIS AppPool\%APP_POOL%":(OI)(CI)(F)

echo === Deployment Complete ===
echo Your application should now be accessible at: http://localhost:%PORT%
pause
