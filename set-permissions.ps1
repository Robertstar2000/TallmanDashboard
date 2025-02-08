# Get the application path
$appPath = Split-Path $MyInvocation.MyCommand.Path
$iisAppPool = "IIS AppPool\DefaultAppPool"
$networkService = "NT AUTHORITY\NETWORK SERVICE"

# Function to set permissions
function Set-FolderPermissions {
    param (
        [string]$folderPath,
        [string]$identity
    )
    
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force
    }
    
    $acl = Get-Acl $folderPath
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $identity,
        "FullControl",
        "ContainerInherit,ObjectInherit",
        "None",
        "Allow"
    )
    
    # Remove existing rules for this identity
    $acl.Access | Where-Object { $_.IdentityReference.Value -eq $identity } | 
        ForEach-Object { $acl.RemoveAccessRule($_) }
    
    # Add new rule
    $acl.AddAccessRule($rule)
    Set-Acl $folderPath $acl
    Write-Host "Set permissions for $identity on $folderPath"
}

# Create and set permissions for required directories
$directories = @(
    (Join-Path $appPath "iisnode_logs"),
    (Join-Path $appPath "logs"),
    (Join-Path $appPath "node_modules")
)

foreach ($dir in $directories) {
    Set-FolderPermissions -folderPath $dir -identity $iisAppPool
    Set-FolderPermissions -folderPath $dir -identity $networkService
}

# Set permissions on the root application directory
Set-FolderPermissions -folderPath $appPath -identity $iisAppPool
Set-FolderPermissions -folderPath $appPath -identity $networkService

# Ensure IIS has permission to execute node.exe
$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) {
    Set-FolderPermissions -folderPath $nodePath -identity $iisAppPool
    Set-FolderPermissions -folderPath $nodePath -identity $networkService
}

Write-Host "All permissions have been set successfully"
