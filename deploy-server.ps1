# Requires -RunAsAdministrator

Import-Module WebAdministration

$siteName = "TallmanDashboard"
$appPoolName = "TallmanDashboardPool"
$deployPath = "C:\inetpub\wwwroot\$siteName"
$port = 3200

Write-Host "=== Starting IIS Node.js Application Deployment ===" -ForegroundColor Green

# Create deployment directory
if (-not (Test-Path $deployPath)) {
    New-Item -ItemType Directory -Path $deployPath -Force
}

# Copy application files
Copy-Item ".\*" -Destination $deployPath -Recurse -Force -Exclude @("*.git*", "node_modules", "*.ps1")

# Stop and remove existing site/app pool if they exist
if (Test-Path "IIS:\Sites\$siteName") {
    & $env:windir\system32\inetsrv\appcmd.exe stop site "$siteName"
    & $env:windir\system32\inetsrv\appcmd.exe delete site "$siteName"
}

if (Test-Path "IIS:\AppPools\$appPoolName") {
    & $env:windir\system32\inetsrv\appcmd.exe stop apppool "$appPoolName"
    & $env:windir\system32\inetsrv\appcmd.exe delete apppool "$appPoolName"
}

# Create app pool and set to LocalSystem
& $env:windir\system32\inetsrv\appcmd.exe add apppool /name:"$appPoolName"
& $env:windir\system32\inetsrv\appcmd.exe set apppool "$appPoolName" /processModel.identityType:LocalSystem

# Create website with correct binding
$bindingInfo = "http/*:$($port):"
& $env:windir\system32\inetsrv\appcmd.exe add site /name:"$siteName" /bindings:$bindingInfo /physicalPath:"$deployPath"
& $env:windir\system32\inetsrv\appcmd.exe set site "$siteName" /applicationDefaults.applicationPool:"$appPoolName"

# Set permissions
$acl = Get-Acl $deployPath
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS AppPool\$appPoolName", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($rule)
Set-Acl $deployPath $acl

Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Your application should now be accessible at: http://localhost:$port" -ForegroundColor Green
