# IIS Deployment Script for TallmanDashboard

# Requires elevation (Run as Administrator)
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Output "Please run this script as Administrator!"
    break
}

Write-Output "Installing IIS and necessary features..." 

# Comprehensive IIS and Web Feature Installation
$features = @(
    "Web-Server",
    "Web-WebServer",
    "Web-Common-Http",
    "Web-Static-Content",
    "Web-Default-Doc",
    "Web-Dir-Browsing",
    "Web-Http-Errors",
    "Web-Http-Redirect",
    "Web-App-Dev",
    "Web-Asp-Net45",
    "Web-Net-Ext45",
    "Web-ISAPI-Ext",
    "Web-ISAPI-Filter",
    "Web-Mgmt-Tools",
    "Web-Mgmt-Console",
    "Web-Mgmt-Service",
    "Web-Http-Logging",
    "Web-Request-Monitor",
    "Web-Security",
    "Web-Filtering",
    "Web-Basic-Auth",
    "Web-Windows-Auth"
)

$installedFeatures = @()
$failedFeatures = @()

Write-Output "Starting IIS Feature Installation..."

foreach ($feature in $features) {
    try {
        $result = Install-WindowsFeature -Name $feature -ErrorAction Stop
        
        if ($result.Success) {
            $installedFeatures += $feature
            Write-Output "Installed: $feature"
        }
        else {
            $failedFeatures += $feature
            Write-Output "Failed: $feature"
        }
    }
    catch {
        $failedFeatures += $feature
        Write-Output "Error installing: $feature"
    }
}

Write-Output "`nInstallation Summary:"
Write-Output "Installed Features: $($installedFeatures.Count)"
Write-Output "Failed Features: $($failedFeatures.Count)"

if ($failedFeatures.Count -gt 0) {
    Write-Output "`nFailed Features:"
    $failedFeatures | ForEach-Object { Write-Output "- $_" }
}

# Restart IIS
Restart-Service -Name W3SVC -Force

# Additional DISM-based feature installation for robustness
function Install-WebServerFeaturesDISM {
    $dismFeatures = @(
        "IIS-WebServerRole",
        "IIS-WebServer", 
        "IIS-CommonHttpFeatures", 
        "IIS-ManagementConsole", 
        "IIS-ManagementService", 
        "NetFx4Extended-ASPNET45"
    )

    Write-Host "Starting DISM Feature Installation"

    foreach ($feature in $dismFeatures) {
        try {
            Write-Host "Attempting DISM installation of feature: $feature"
            $result = Dism /Online /Enable-Feature /FeatureName:$feature /All /Quiet
            
            # Check if the command was successful
            if ($LASTEXITCODE -ne 0) {
                Write-Host "DISM could not install feature $feature. Exit code: $LASTEXITCODE"
            }
            else {
                Write-Host "Successfully installed feature: $feature"
            }
        }
        catch {
            Write-Host "Error installing feature $feature : $_"
        }
    }

    # List all available features for reference
    Write-Host "`nAvailable DISM Features:"
    $availableFeatures = Dism /Online /Get-Features | Select-String "Feature Name"
    $availableFeatures | ForEach-Object { Write-Host $_.Line }
}

# Ensure the script runs with full output
$ErrorActionPreference = 'Continue'
$WarningPreference = 'Continue'

# Create log directory if it doesn't exist
if (!(Test-Path "C:\Temp")) {
    New-Item -ItemType Directory -Path "C:\Temp" | Out-Null
}

# Call the DISM feature installation function
Install-WebServerFeaturesDISM

# Verify installed features
function Confirm-WebServerFeatures {
    Write-Output "Verifying Web Server Features..." 
    
    $requiredFeatures = @(
        "Web-Server",
        "Web-WebServer",
        "Web-Common-Http",
        "Web-Asp-Net45", 
        "Web-Net-Ext45",
        "Web-Mgmt-Tools", 
        "Web-Mgmt-Console",
        "Web-Http-Redirect",
        "Web-Static-Content"
    )

    $missingFeatures = @()

    foreach ($feature in $requiredFeatures) {
        $featureStatus = Get-WindowsOptionalFeature -Online | Where-Object { $_.FeatureName -eq $feature }
        
        if ($featureStatus) {
            if ($featureStatus.State -eq 'Enabled') {
                Write-Output " $feature is installed and enabled"
            }
            else {
                Write-Output " $feature is installed but not enabled"
                $missingFeatures += $feature
            }
        }
        else {
            Write-Output " $feature is NOT installed"
            $missingFeatures += $feature
        }
    }

    if ($missingFeatures.Count -gt 0) {
        Write-Output "`nMissing or Disabled Features:"
        $missingFeatures | ForEach-Object { Write-Output "- $_" }
        return $false
    }

    return $true
}

# Call feature verification function
$featuresVerified = Confirm-WebServerFeatures
if (-not $featuresVerified) {
    Write-Output "Some web server features are missing or not enabled. Please review and reinstall."
}

Write-Output "Downloading URL Rewrite Module..." 

# Download URL Rewrite Module
$downloadUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
$installerPath = "$env:TEMP\rewrite_amd64_en-US.msi"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath
} catch {
    Write-Error "Failed to download URL Rewrite Module. Please download manually from: https://www.iis.net/downloads/microsoft/url-rewrite"
    break
}

Write-Output "Installing URL Rewrite Module..." 

# Install URL Rewrite Module
Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait

# Clean up installer
Remove-Item $installerPath -Force

# Import WebAdministration Module
Import-Module WebAdministration

# Set up the application pool
$appPoolName = "TallmanDashboardPool"
$siteName = "TallmanDashboard"
$sitePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard"
$port = 3200

# Create Application Pool if it doesn't exist
if (!(Test-Path IIS:\AppPools\$appPoolName)) {
    Write-Output "Creating Application Pool: $appPoolName" 
    New-WebAppPool -Name $appPoolName
    Set-ItemProperty IIS:\AppPools\$appPoolName -name "managedRuntimeVersion" -value ""
    Set-ItemProperty IIS:\AppPools\$appPoolName -name "startMode" -value "AlwaysRunning"
}

# Remove existing site if it exists
if (Test-Path IIS:\Sites\$siteName) {
    Remove-WebSite -Name $siteName
}

# Create the website
Write-Output "Creating Website: $siteName on port $port" 
New-Website -Name $siteName -PhysicalPath $sitePath -ApplicationPool $appPoolName -Port $port -Force

# Set website to start automatically
Set-ItemProperty IIS:\Sites\$siteName -name serverAutoStart -value "True"

Write-Output "Restarting IIS..." 
try {
    Stop-Service -Name W3SVC -Force
    Start-Service -Name W3SVC
} catch {
    Write-Warning "Failed to restart IIS. Please restart manually using IISReset command."
}

Write-Output "Installation and configuration completed!" 
Write-Output "Your application should now be accessible at http://localhost:$port" 

# Project Configuration
$sitePhysicalPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard"
$appPoolName = "TallmanDashboardPool"
$port = 3200

# Remove existing website and app pool if they exist
Remove-Website -Name $siteName -ErrorAction SilentlyContinue
Remove-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue

# Create Application Pool
New-WebAppPool -Name $appPoolName
Set-ItemProperty -Path "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""

# Create Website
New-Website -Name $siteName `
    -PhysicalPath $sitePhysicalPath `
    -ApplicationPool $appPoolName `
    -Port $port

# Configure Reverse Proxy
$webConfig = Join-Path $sitePhysicalPath "web.config"
[xml]$config = Get-Content $webConfig

# Add URL Rewrite Rule if not exists
$rewriteRules = $config.configuration.'system.webServer'.rewrite.rules
$existingRule = $rewriteRules.rule | Where-Object { $_.name -eq 'NextJS' }

if (-not $existingRule) {
    $newRule = $config.CreateElement("rule")
    $newRule.SetAttribute("name", "NextJS")
    $newRule.SetAttribute("stopProcessing", "true")

    $match = $config.CreateElement("match")
    $match.SetAttribute("url", "(.*)")
    $newRule.AppendChild($match)

    $conditions = $config.CreateElement("conditions")
    $conditions.SetAttribute("logicalGrouping", "MatchAll")

    $condition1 = $config.CreateElement("add")
    $condition1.SetAttribute("input", "{REQUEST_FILENAME}")
    $condition1.SetAttribute("matchType", "IsFile")
    $condition1.SetAttribute("negate", "true")
    $conditions.AppendChild($condition1)

    $condition2 = $config.CreateElement("add")
    $condition2.SetAttribute("input", "{REQUEST_FILENAME}")
    $condition2.SetAttribute("matchType", "IsDirectory")
    $condition2.SetAttribute("negate", "true")
    $conditions.AppendChild($condition2)

    $newRule.AppendChild($conditions)

    $action = $config.CreateElement("action")
    $action.SetAttribute("type", "Rewrite")
    $action.SetAttribute("url", "http://localhost:3000/{R:1}")
    $newRule.AppendChild($action)

    $rewriteRules.AppendChild($newRule)
}

$config.Save($webConfig)

# Open Firewall Ports
New-NetFirewallRule -Name "NodeJS" -DisplayName "NodeJS" -Protocol TCP -LocalPort 3000 -Action Allow -Enabled True

# Restart IIS
Restart-Service -Name W3SVC

Write-Output "TallmanDashboard IIS deployment complete!"

function Test-NodeJsIISDiagnostics {
    # Create a diagnostics report
    $reportPath = "C:\Temp\NodeJsIISDiagnostics.txt"
    New-Item -Path $reportPath -Force | Out-Null

    # Function to add diagnostic information to the report
    function Add-DiagnosticInfo {
        param([string]$Message)
        Add-Content -Path $reportPath -Value $Message
    }

    # Start Diagnostics
    Add-DiagnosticInfo "Node.js and IIS Diagnostic Report"
    Add-DiagnosticInfo "Generated on: $(Get-Date)"
    Add-DiagnosticInfo "=" * 50

    # 1. Node.js Installation Check
    try {
        $nodeVersion = & node --version 2>$null
        Add-DiagnosticInfo "Node.js Installation: INSTALLED"
        Add-DiagnosticInfo "Node.js Version: $nodeVersion"
    }
    catch {
        Add-DiagnosticInfo "Node.js Installation: NOT FOUND"
    }

    # 2. Node.js PATH Check
    $nodePath = $env:Path -split ';' | Where-Object { $_ -like '*nodejs*' }
    if ($nodePath) {
        Add-DiagnosticInfo "Node.js in PATH: YES"
        Add-DiagnosticInfo "Node.js PATH: $nodePath"
    }
    else {
        Add-DiagnosticInfo "Node.js in PATH: NO"
    }

    # 3. IIS Service Status
    $iisService = Get-Service -Name W3SVC -ErrorAction SilentlyContinue
    if ($iisService) {
        Add-DiagnosticInfo "IIS Service Status: $($iisService.Status)"
    }
    else {
        Add-DiagnosticInfo "IIS Service: NOT INSTALLED"
    }

    # 4. Web Hosting Features
    $webFeatures = @(
        "Web-Server",
        "Web-Asp-Net45",
        "Web-Mgmt-Tools",
        "Web-Mgmt-Console"
    )

    Add-DiagnosticInfo "`nWeb Hosting Features:"
    foreach ($feature in $webFeatures) {
        $featureStatus = Get-WindowsOptionalFeature -Online | Where-Object { $_.FeatureName -eq $feature }
        if ($featureStatus) {
            Add-DiagnosticInfo "$feature : $($featureStatus.State)"
        }
        else {
            Add-DiagnosticInfo "$feature : NOT FOUND"
        }
    }

    # 5. Application Pool Configuration
    try {
        $appPools = Get-IISAppPool
        Add-DiagnosticInfo "`nApplication Pools:"
        foreach ($pool in $appPools) {
            Add-DiagnosticInfo "Name: $($pool.Name)"
            Add-DiagnosticInfo "State: $($pool.State)"
            Add-DiagnosticInfo "Runtime Version: $($pool.RuntimeVersion)"
        }
    }
    catch {
        Add-DiagnosticInfo "Unable to retrieve Application Pool information"
    }

    # 6. Node.js Handlers
    try {
        $handlers = Get-WebHandler
        Add-DiagnosticInfo "`nWeb Handlers:"
        foreach ($handler in $handlers) {
            if ($handler.Name -like '*node*') {
                Add-DiagnosticInfo "Node Handler: $($handler.Name)"
                Add-DiagnosticInfo "Path: $($handler.Path)"
                Add-DiagnosticInfo "Modules: $($handler.Modules)"
            }
        }
    }
    catch {
        Add-DiagnosticInfo "Unable to retrieve Web Handlers"
    }

    # 7. Environment Variables related to Node.js
    Add-DiagnosticInfo "`nNode.js Environment Variables:"
    $nodeEnvVars = Get-ChildItem env: | Where-Object { $_.Name -like '*NODE*' -or $_.Name -like '*NPM*' }
    foreach ($var in $nodeEnvVars) {
        Add-DiagnosticInfo "$($var.Name): $($var.Value)"
    }

    # Ensure the report is written and visible
    Write-Output "Diagnostic report generated at $reportPath"
    Get-Content $reportPath
}

# Run the diagnostic function
Test-NodeJsIISDiagnostics

# Pause to keep the window open
Read-Host "Press Enter to continue..."

# Return results for potential external capture
$results
