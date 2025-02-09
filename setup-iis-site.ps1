# Run this script as Administrator
param(
    [string]$SiteName = "TallmanDashboard",
    [string]$AppPoolName = "TallmanDashboardPool",
    [string]$PhysicalPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard",
    [int]$Port = 5000
)

# Import the IIS module
Import-Module WebAdministration

Write-Host "Setting up IIS site '$SiteName'..."

# Create Application Pool if it doesn't exist
if (!(Test-Path "IIS:\AppPools\$AppPoolName")) {
    Write-Host "Creating Application Pool '$AppPoolName'..."
    New-WebAppPool -Name $AppPoolName
    Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "managedRuntimeVersion" -Value ""
    Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "processModel.identityType" -Value "NetworkService"
    Write-Host "Application Pool created successfully."
}

# Stop the app pool if it's running
if ((Get-WebAppPoolState -Name $AppPoolName).Value -eq 'Started') {
    Write-Host "Stopping Application Pool..."
    Stop-WebAppPool -Name $AppPoolName
}

# Remove existing site if it exists
if (Test-Path "IIS:\Sites\$SiteName") {
    Write-Host "Removing existing site..."
    Remove-Website -Name $SiteName
}

# Create the website
Write-Host "Creating website..."
New-Website -Name $SiteName -PhysicalPath $PhysicalPath -ApplicationPool $AppPoolName -Port $Port -Force

# Set permissions
$acl = Get-Acl $PhysicalPath
$networkServiceSid = New-Object System.Security.Principal.SecurityIdentifier 'S-1-5-20'
$networkServiceAccount = $networkServiceSid.Translate([System.Security.Principal.NTAccount])
$permission = $networkServiceAccount.Value, "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl $PhysicalPath $acl

# Create iisnode directory if it doesn't exist
$iisnodePath = Join-Path $PhysicalPath "iisnode"
if (!(Test-Path $iisnodePath)) {
    New-Item -ItemType Directory -Path $iisnodePath -Force
}

# Set permissions for iisnode directory
$acl = Get-Acl $iisnodePath
$acl.SetAccessRule($accessRule)
Set-Acl $iisnodePath $acl

# Start the site and app pool
Write-Host "Starting Application Pool and Website..."
Start-WebAppPool -Name $AppPoolName
Start-Website -Name $SiteName

Write-Host "Setup complete! The site should be accessible at:"
Write-Host "http://localhost:$Port"
Write-Host "http://127.0.0.1:$Port"

# Check if site is running
$site = Get-Website -Name $SiteName
Write-Host "`nWebsite Status: $($site.State)"
Write-Host "Application Pool Status: $((Get-WebAppPoolState -Name $AppPoolName).Value)"
