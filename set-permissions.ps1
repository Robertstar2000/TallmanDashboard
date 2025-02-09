# Get the application path
$appPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard"
$iisAppPool = "IIS APPPOOL\DefaultAppPool"
$networkService = "NT AUTHORITY\NETWORK SERVICE"
$iisUser = "IUSR"
$localService = "NT AUTHORITY\LOCAL SERVICE"

# Create iisnode directory if it doesn't exist
$iisnodePath = Join-Path $appPath "iisnode"
if (-not (Test-Path $iisnodePath)) {
    New-Item -ItemType Directory -Path $iisnodePath -Force
}

# Function to set permissions
function Set-FolderPermissions {
    param(
        [string]$folderPath,
        [string]$identity,
        [string]$permissions = "FullControl"
    )
    
    Write-Host "Setting $permissions permissions for $identity on $folderPath"
    try {
        $acl = Get-Acl $folderPath
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
            $identity, 
            $permissions, 
            "ContainerInherit,ObjectInherit", 
            "None", 
            "Allow"
        )
        $acl.SetAccessRule($rule)
        Set-Acl $folderPath $acl
        Write-Host "Successfully set permissions for $identity on $folderPath"
    }
    catch {
        Write-Host "Error setting permissions for $identity on $folderPath: $_"
    }
}

# Set permissions for all required identities
$identities = @($iisAppPool, $networkService, $iisUser, $localService)
$paths = @(
    $appPath,
    $iisnodePath,
    (Join-Path $appPath "node_modules"),
    (Join-Path $appPath ".next")
)

# Create directories if they don't exist
foreach ($path in $paths) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force
        Write-Host "Created directory: $path"
    }
}

# Set permissions for each path and identity
foreach ($path in $paths) {
    foreach ($identity in $identities) {
        Set-FolderPermissions -folderPath $path -identity $identity
    }
}

# Grant permissions to port 5000
try {
    Write-Host "Granting port permissions..."
    $urls = @(
        "http://+:5000/",
        "http://localhost:5000/"
    )
    
    foreach ($url in $urls) {
        foreach ($identity in @($networkService, $localService)) {
            $netsh = "netsh http add urlacl url=$url user=`"$identity`""
            Write-Host "Running: $netsh"
            Invoke-Expression $netsh
        }
    }
}
catch {
    Write-Host "Error granting port permissions: $_"
}

Write-Host "All permissions have been set successfully"
