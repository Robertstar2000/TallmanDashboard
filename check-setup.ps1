# Basic checks that don't require admin rights
Write-Host "=== Basic IIS Node.js Configuration Check ===" -ForegroundColor Cyan

# Check Node.js
Write-Host "`n1. Checking Node.js Installation:" -ForegroundColor Yellow
$nodePath = "C:\Program Files\nodejs\node.exe"
if (Test-Path $nodePath) {
    Write-Host "✓ Node.js found at expected location" -ForegroundColor Green
    $nodeVersion = & $nodePath --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found at $nodePath" -ForegroundColor Red
}

# Check IISNode module
Write-Host "`n2. Checking IISNode Installation:" -ForegroundColor Yellow
$iisNodePath = "${env:ProgramFiles}\iisnode\iisnode.dll"
if (Test-Path $iisNodePath) {
    Write-Host "✓ IISNode module found" -ForegroundColor Green
} else {
    Write-Host "✗ IISNode module not found at $iisNodePath" -ForegroundColor Red
    Write-Host "Please install IISNode from: https://github.com/azure/iisnode/releases" -ForegroundColor Yellow
}

# Check Directory Permissions
Write-Host "`n3. Checking Directory Permissions:" -ForegroundColor Yellow
$dirs = @(
    (Get-Location),
    (Join-Path (Get-Location) "iisnode_logs"),
    (Join-Path (Get-Location) "node_modules")
)

foreach ($dir in $dirs) {
    Write-Host "`nChecking permissions for: $dir" -ForegroundColor Yellow
    if (Test-Path $dir) {
        $acl = Get-Acl $dir
        Write-Host "Owner: $($acl.Owner)"
        Write-Host "Access Rules:"
        $acl.Access | ForEach-Object {
            Write-Host "  $($_.IdentityReference) : $($_.FileSystemRights)"
        }
    } else {
        Write-Host "✗ Directory does not exist: $dir" -ForegroundColor Red
    }
}

# Check web.config
Write-Host "`n4. Checking web.config:" -ForegroundColor Yellow
$webConfigPath = Join-Path (Get-Location) "web.config"
if (Test-Path $webConfigPath) {
    Write-Host "✓ web.config found" -ForegroundColor Green
    $webConfig = Get-Content $webConfigPath -Raw
    if ($webConfig -match "iisnode") {
        Write-Host "✓ iisnode configuration found in web.config" -ForegroundColor Green
    } else {
        Write-Host "✗ No iisnode configuration found in web.config" -ForegroundColor Red
    }
} else {
    Write-Host "✗ web.config not found" -ForegroundColor Red
}

Write-Host "`n=== End of Basic Check ===" -ForegroundColor Cyan
