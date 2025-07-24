# PowerShell script to run TallmanDashboard as a Windows Service using NSSM
# This script will install NSSM if not present, and set up the service

$ErrorActionPreference = 'Stop'

# Configuration
$serviceName = "TallmanDashboard"
$nodePath = (Get-Command node).Source
$appDir = "$PSScriptRoot"
$entryScript = "node_modules\next\dist\bin\next"  # Adjust if your entry point is different
$appPort = 3000

# Check for NSSM
$nssmExe = "$env:ProgramFiles\nssm\win64\nssm.exe"
if (!(Test-Path $nssmExe)) {
    Write-Output "NSSM not found. Downloading and installing..."
    $nssmZip = "$env:TEMP\nssm.zip"
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $nssmZip
    Expand-Archive $nssmZip -DestinationPath "$env:ProgramFiles" -Force
    Remove-Item $nssmZip
    $nssmExe = "$env:ProgramFiles\nssm-2.24\win64\nssm.exe"
    if (!(Test-Path $nssmExe)) {
        throw "NSSM installation failed. Please install NSSM manually from https://nssm.cc/."
    }
}

# Remove existing service if it exists
& $nssmExe remove $serviceName confirm

# Install the service
& $nssmExe install $serviceName $nodePath "$appDir\$entryScript" start -p $appPort

# Set working directory
& $nssmExe set $serviceName AppDirectory $appDir

# Set service to auto-start
& $nssmExe set $serviceName Start SERVICE_AUTO_START

# Set service recovery options
& $nssmExe set $serviceName AppRestartDelay 5000
& $nssmExe set $serviceName AppStdout "$appDir\service.log"
& $nssmExe set $serviceName AppStderr "$appDir\service-error.log"

# Start the service
& $nssmExe start $serviceName

Write-Output "Service '$serviceName' installed and started."
Write-Output "To uninstall: & $nssmExe remove $serviceName confirm"
