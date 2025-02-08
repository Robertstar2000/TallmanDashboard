# Register IISNode module
Write-Host "Registering IISNode module..."

$iisNodePath = "${env:ProgramFiles}\iisnode\iisnode.dll"
if (Test-Path $iisNodePath) {
    # Add handler mapping
    & "$env:windir\system32\inetsrv\appcmd.exe" set config /section:handlers /+"[name='iisnode',path='*.js',verb='*',modules='iisnode']"
    
    # Enable 32-bit applications if needed
    & "$env:windir\system32\inetsrv\appcmd.exe" set apppool "DefaultAppPool" /enable32BitAppOnWin64:true
    
    Write-Host "IISNode module registered successfully"
} else {
    Write-Host "IISNode module not found at: $iisNodePath"
    Write-Host "Please install IISNode from: https://github.com/azure/iisnode/releases"
}
