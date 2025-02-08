# Install IIS features required for Node.js applications
Write-Host "Installing required IIS features..."

$features = @(
    'Web-Server',
    'Web-WebServer',
    'Web-Common-Http',
    'Web-Default-Doc',
    'Web-Dir-Browsing',
    'Web-Http-Errors',
    'Web-Static-Content',
    'Web-Http-Redirect',
    'Web-Health',
    'Web-Http-Logging',
    'Web-Custom-Logging',
    'Web-Log-Libraries',
    'Web-Request-Monitor',
    'Web-Http-Tracing',
    'Web-Performance',
    'Web-Stat-Compression',
    'Web-Dyn-Compression',
    'Web-Security',
    'Web-Filtering',
    'Web-Basic-Auth',
    'Web-Windows-Auth',
    'Web-App-Dev',
    'Web-Net-Ext45',
    'Web-ASP',
    'Web-Asp-Net45',
    'Web-ISAPI-Ext',
    'Web-ISAPI-Filter',
    'Web-Mgmt-Tools',
    'Web-Mgmt-Console'
)

foreach ($feature in $features) {
    Write-Host "Installing $feature..."
    Install-WindowsFeature -Name $feature -IncludeManagementTools
}

Write-Host "IIS features installation complete."

# Check if IISNode is installed
$iisNodePath = "${env:ProgramFiles}\iisnode\iisnode.dll"
if (-not (Test-Path $iisNodePath)) {
    Write-Host "IISNode not found. Please install from: https://github.com/azure/iisnode/releases"
}

# Check if URL Rewrite Module is installed
$urlRewritePath = "${env:ProgramFiles}\Reference Assemblies\Microsoft\IIS\IISUrlRewriteModule.dll"
if (-not (Test-Path $urlRewritePath)) {
    Write-Host "URL Rewrite Module not found. Please install from: https://www.iis.net/downloads/microsoft/url-rewrite"
}

Write-Host "Setup complete. Please install any missing components indicated above."
