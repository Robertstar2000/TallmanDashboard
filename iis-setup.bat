@echo off
REM IIS and Web Management Tools Installation Script

REM Enable IIS Features
dism /online /Enable-Feature /FeatureName:IIS-WebServerRole /All
dism /online /Enable-Feature /FeatureName:IIS-WebServer /All
dism /online /Enable-Feature /FeatureName:IIS-WebServerManagementTools /All
dism /online /Enable-Feature /FeatureName:IIS-ManagementConsole /All
dism /online /Enable-Feature /FeatureName:IIS-WebSockets /All
dism /online /Enable-Feature /FeatureName:IIS-ApplicationDevelopment /All

REM Configure IIS Site and App Pool
%windir%\system32\inetsrv\appcmd.exe delete site "TallmanDashboard"
%windir%\system32\inetsrv\appcmd.exe delete apppool "TallmanDashboardPool"

%windir%\system32\inetsrv\appcmd.exe add apppool /name:"TallmanDashboardPool" /managedRuntimeVersion:""
%windir%\system32\inetsrv\appcmd.exe add site /name:"TallmanDashboard" /physicalPath:"C:\Users\BobM\CascadeProjects\TallmanDashboard" /applicationPool:"TallmanDashboardPool" /bindings:"http/*:3200:"

REM Restart IIS Service
net stop was /y
net start w3svc

echo IIS Configuration Complete!
