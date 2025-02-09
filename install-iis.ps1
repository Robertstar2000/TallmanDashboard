# Run this script as Administrator to install IIS and required components
Write-Host "Installing IIS and required components..."

# Install IIS
$features = @(
    "IIS-WebServerRole",
    "IIS-WebServer",
    "IIS-CommonHttpFeatures",
    "IIS-ManagementConsole",
    "IIS-DefaultDocument",
    "IIS-DirectoryBrowsing",
    "IIS-HttpErrors",
    "IIS-StaticContent",
    "IIS-HttpLogging",
    "IIS-HttpCompressionStatic",
    "IIS-RequestFiltering",
    "IIS-WebServerManagementTools",
    "IIS-ApplicationInitialization",
    "IIS-WindowsAuthentication",
    "IIS-NetFxExtensibility45",
    "IIS-ASPNET45",
    "NetFx4Extended-ASPNET45",
    "IIS-ISAPIExtensions",
    "IIS-ISAPIFilter",
    "IIS-HttpCompressionDynamic"
)

foreach ($feature in $features) {
    Write-Host "Installing feature: $feature"
    try {
        Enable-WindowsOptionalFeature -Online -FeatureName $feature -All -NoRestart
    } catch {
        Write-Host "Error installing $feature : $_"
    }
}

# Install URL Rewrite Module
Write-Host "Downloading URL Rewrite Module..."
$urlRewriteInstaller = "$env:TEMP\rewrite_amd64_en-US.msi"
Invoke-WebRequest -Uri "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi" -OutFile $urlRewriteInstaller
Write-Host "Installing URL Rewrite Module..."
Start-Process msiexec.exe -ArgumentList "/i `"$urlRewriteInstaller`" /quiet /norestart" -Wait

# Install IISNode
Write-Host "Downloading IISNode..."
$iisNodeInstaller = "$env:TEMP\iisnode-full-iis7-x64-v0.2.21.msi"
Invoke-WebRequest -Uri "https://github.com/azure/iisnode/releases/download/v0.2.21/iisnode-full-iis7-x64-v0.2.21.msi" -OutFile $iisNodeInstaller
Write-Host "Installing IISNode..."
Start-Process msiexec.exe -ArgumentList "/i `"$iisNodeInstaller`" /quiet /norestart" -Wait

Write-Host "Installation complete! Please restart your computer before proceeding with site setup."
Write-Host "After restart, run setup-iis-site.ps1 again to configure your website."
