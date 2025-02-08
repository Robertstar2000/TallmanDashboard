# Requires -RunAsAdministrator

# Configuration
$siteName = "TallmanDashboard"
$appPoolName = "TallmanDashboardPool"
$deployPath = "C:\inetpub\wwwroot\$siteName"
$port = 3200

# Function to check if a command exists
function Test-CommandExists {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try {
        if (Get-Command $command) { return $true }
    } catch {
        return $false
    } finally {
        $ErrorActionPreference = $oldPreference
    }
}

Write-Host "=== Starting IIS Node.js Application Deployment ===" -ForegroundColor Green

# 1. Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Error: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# 2. Check/Install IIS
Write-Host "Checking IIS installation..." -ForegroundColor Yellow
if (-not (Get-WindowsFeature Web-Server).Installed) {
    Write-Host "Installing IIS..." -ForegroundColor Yellow
    Install-WindowsFeature -Name Web-Server -IncludeManagementTools
}

# 3. Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
if (-not (Test-CommandExists node)) {
    Write-Host "Error: Node.js is not installed. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
$nodeVersion = node -v
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# 4. Check iisnode installation
Write-Host "Checking iisnode installation..." -ForegroundColor Yellow
$iisnodePath = "C:\Program Files\iisnode\iisnode.dll"
if (-not (Test-Path $iisnodePath)) {
    Write-Host "Error: iisnode is not installed. Please install from https://github.com/Azure/iisnode/releases" -ForegroundColor Red
    exit 1
}

# 5. Check URL Rewrite Module
Write-Host "Checking URL Rewrite Module..." -ForegroundColor Yellow
$urlRewritePath = "${env:ProgramFiles}\Reference Assemblies\Microsoft\IIS\Microsoft.Web.Iis.Rewrite.dll"
if (-not (Test-Path $urlRewritePath)) {
    Write-Host "Error: URL Rewrite Module is not installed. Please install from https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Red
    exit 1
}

# 6. Create deployment directory
Write-Host "Creating deployment directory..." -ForegroundColor Yellow
if (-not (Test-Path $deployPath)) {
    New-Item -ItemType Directory -Path $deployPath
}

# 7. Copy application files
Write-Host "Copying application files..." -ForegroundColor Yellow
$sourcePath = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item "$sourcePath\*" -Destination $deployPath -Recurse -Force -Exclude "*.git*","node_modules"

# 8. Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location $deployPath
if (Test-Path "package.json") {
    npm install --production
} else {
    Write-Host "Warning: No package.json found" -ForegroundColor Yellow
}

# 9. Configure IIS
Write-Host "Configuring IIS..." -ForegroundColor Yellow

# Remove existing site/app pool if they exist
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Remove-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
}
if (Test-Path "IIS:\Sites\$siteName") {
    Remove-Website -Name $siteName -ErrorAction SilentlyContinue
}

# Create new app pool
$appPool = New-WebAppPool -Name $appPoolName
Set-ItemProperty IIS:\AppPools\$appPoolName -name processModel.identityType -value LocalSystem

# Create new website
New-Website -Name $siteName -PhysicalPath $deployPath -ApplicationPool $appPoolName -Port $port -Force

# Set permissions
$acl = Get-Acl $deployPath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS AppPool\$appPoolName", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl $deployPath $acl

Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Your application should now be accessible at: http://localhost:$port" -ForegroundColor Green
Write-Host "If you encounter any issues, check the following:" -ForegroundColor Yellow
Write-Host "1. IIS Manager -> Application Pools -> $appPoolName -> Advanced Settings -> Identity is set to LocalSystem" -ForegroundColor Yellow
Write-Host "2. The web.config file exists and is properly configured" -ForegroundColor Yellow
Write-Host "3. Check the Event Viewer for any error messages" -ForegroundColor Yellow
