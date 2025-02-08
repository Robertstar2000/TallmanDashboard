# IIS and Node.js Diagnostics Script

# Ensure running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator"
    exit
}

# Check Node.js installation
Write-Host "Node.js Version:" -ForegroundColor Green
try {
    node -v
} catch {
    Write-Host "Node.js is not installed or not in PATH" -ForegroundColor Red
}

# Check IIS Installation
Write-Host "`nIIS Installation Check:" -ForegroundColor Green
try {
    $iisService = Get-Service -Name W3SVC
    Write-Host "IIS Service Status: $($iisService.Status)" -ForegroundColor Cyan
} catch {
    Write-Host "IIS Service not found" -ForegroundColor Red
}

# Check Web Management Service
Write-Host "`nWeb Management Service:" -ForegroundColor Green
try {
    $wmsService = Get-Service -Name WMSVC
    Write-Host "Web Management Service Status: $($wmsService.Status)" -ForegroundColor Cyan
} catch {
    Write-Host "Web Management Service not found" -ForegroundColor Red
}

# Check Installed Windows Features related to Web Hosting
Write-Host "`nWeb Hosting Windows Features:" -ForegroundColor Green
$webFeatures = @(
    "IIS-WebServer",
    "IIS-WebServerRole",
    "IIS-CommonHttpFeatures",
    "IIS-StaticContent",
    "IIS-DefaultDocument",
    "IIS-DirectoryBrowsing",
    "IIS-HttpErrors",
    "IIS-ApplicationDevelopment",
    "IIS-NetFxExtensibility45",
    "IIS-ISAPIExtensions",
    "IIS-ISAPIFilter",
    "IIS-HttpLogging",
    "IIS-RequestMonitor",
    "IIS-HttpTracing",
    "IIS-URLAuthorization",
    "IIS-RequestFiltering",
    "IIS-IPSecurity"
)

foreach ($feature in $webFeatures) {
    $status = (Get-WindowsOptionalFeature -Online | Where-Object { $_.FeatureName -eq $feature }).State
    Write-Host "$feature : $status" -ForegroundColor Cyan
}

# Check Node.js Handler Configuration
Write-Host "`nNode.js Handler Configuration:" -ForegroundColor Green
try {
    $nodeHandlers = & "$env:windir\system32\inetsrv\appcmd.exe" list config /section:system.webServer/handlers | Select-String "node"
    if ($nodeHandlers) {
        Write-Host "Node Handlers Found:" -ForegroundColor Cyan
        $nodeHandlers
    } else {
        Write-Host "No Node.js handlers configured" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not retrieve handler configuration" -ForegroundColor Red
}

# Check Specific Application Pool
Write-Host "`nApplication Pool Details:" -ForegroundColor Green
try {
    $appPoolName = "TallmanDashboardPool"
    $appPool = & "$env:windir\system32\inetsrv\appcmd.exe" list apppool $appPoolName
    if ($appPool) {
        Write-Host "Application Pool $appPoolName Details:" -ForegroundColor Cyan
        $appPool
    } else {
        Write-Host "Application Pool $appPoolName not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not retrieve Application Pool information" -ForegroundColor Red
}

# Detailed Node.js Environment
Write-Host "`nNode.js Environment:" -ForegroundColor Green
$env:Path -split ';' | Where-Object { $_ -like '*nodejs*' } | ForEach-Object {
    Write-Host "Node.js Path: $_" -ForegroundColor Cyan
}

Write-Host "`nDiagnostics Complete" -ForegroundColor Green
