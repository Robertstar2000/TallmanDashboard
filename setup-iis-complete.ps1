if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Please re-run it in an elevated PowerShell session."
    exit 1
}

# Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"
$projectPath = Split-Path $MyInvocation.MyCommand.Path
$logFile = Join-Path $projectPath "iis-setup.log"

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

try {
    Write-Log "Starting IIS setup process..."

    # 1. Install IIS Features
    Write-Log "Installing IIS features..."
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
        Write-Log "Installing feature: $feature"
        Install-WindowsFeature -Name $feature -IncludeManagementTools
    }

    # 2. Configure Application Pool
    Write-Log "Configuring IIS Application Pool..."
    Import-Module WebAdministration

    $poolName = "DefaultAppPool"
    
    # Stop the app pool if it exists
    if (Test-Path "IIS:\AppPools\$poolName") {
        Stop-WebAppPool -Name $poolName
    }

    # Configure app pool settings
    Set-ItemProperty "IIS:\AppPools\$poolName" -Name "managedRuntimeVersion" -Value ""
    Set-ItemProperty "IIS:\AppPools\$poolName" -Name "enable32BitAppOnWin64" -Value $false
    Set-ItemProperty "IIS:\AppPools\$poolName" -Name "processModel.identityType" -Value "ApplicationPoolIdentity"
    Set-ItemProperty "IIS:\AppPools\$poolName" -Name "queueLength" -Value 1000
    Set-ItemProperty "IIS:\AppPools\$poolName" -Name "startMode" -Value "AlwaysRunning"

    # 3. Set Directory Permissions
    Write-Log "Setting directory permissions..."
    $directories = @(
        $projectPath,
        (Join-Path $projectPath "iisnode_logs"),
        (Join-Path $projectPath "node_modules"),
        "C:\inetpub\wwwroot\TallmanDashboard"
    )

    $acl = $null
    $rule = $null
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force
        }

        $acl = Get-Acl $dir
        $identities = @(
            "IIS AppPool\$poolName",
            "NT AUTHORITY\NETWORK SERVICE",
            "NT AUTHORITY\IUSR",
            "NT AUTHORITY\LOCAL SERVICE"
        )

        foreach ($identity in $identities) {
            $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
                $identity,
                "FullControl",
                "ContainerInherit,ObjectInherit",
                "None",
                "Allow"
            )
            $acl.AddAccessRule($rule)
        }
        
        Set-Acl -Path $dir -AclObject $acl
        Write-Log "Set permissions for $dir"
    }

    # 4. Configure IIS Handler Mappings
    Write-Log "Configuring IIS Handler Mappings..."
    
    # Add handler mapping for node.js files
    $handlerName = "iisnode"
    $handlerPath = "*.js"
    $handlerModule = "iisnode"
    
    New-WebHandler -Name $handlerName -Path $handlerPath -Verb "*" -Modules $handlerModule -RequireAccess "Script"

    # 5. Restart IIS
    Write-Log "Restarting IIS..."
    Stop-Service -Name W3SVC -Force
    Start-Service -Name W3SVC

    # 6. Verify Node.js installation
    Write-Log "Verifying Node.js installation..."
    $nodePath = "C:\Program Files\nodejs\node.exe"
    if (Test-Path $nodePath) {
        $nodeVersion = & $nodePath --version
        Write-Log "Node.js version: $nodeVersion"
    } else {
        throw "Node.js not found at expected location: $nodePath"
    }

    # 7. Verify IISNode installation
    Write-Log "Verifying IISNode installation..."
    $iisNodePath = "${env:ProgramFiles}\iisnode\iisnode.dll"
    if (Test-Path $iisNodePath) {
        $version = (Get-Item $iisNodePath).VersionInfo.FileVersion
        Write-Log "IISNode version: $version"
    } else {
        throw "IISNode not found at expected location: $iisNodePath"
    }

    Write-Log "Setup completed successfully!"

} catch {
    Write-Log "Error occurred during setup: $_"
    Write-Log $_.ScriptStackTrace
    throw
} finally {
    Write-Log "Setup process finished. Check $logFile for details."
}
