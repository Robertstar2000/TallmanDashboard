# Download and install URL Rewrite Module
$urlRewriteInstaller = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
$installerPath = Join-Path $env:TEMP "rewrite_amd64_en-US.msi"

Write-Host "Downloading URL Rewrite Module..."
Invoke-WebRequest -Uri $urlRewriteInstaller -OutFile $installerPath

Write-Host "Installing URL Rewrite Module..."
Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait

# Clean up
Remove-Item $installerPath

Write-Host "Installation complete. Please restart IIS using: iisreset"
