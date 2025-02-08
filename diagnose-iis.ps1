# Diagnostic script for IIS Node.js setup
Write-Host "=== IIS Node.js Configuration Diagnostic Report ===" -ForegroundColor Cyan

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
    $version = (Get-Item $iisNodePath).VersionInfo.FileVersion
    Write-Host "✓ IISNode version: $version" -ForegroundColor Green
} else {
    Write-Host "✗ IISNode module not found at $iisNodePath" -ForegroundColor Red
}

# Check Application Pool
Write-Host "`n3. Checking IIS Application Pool:" -ForegroundColor Yellow
try {
    Import-Module WebAdministration
    $pool = Get-ItemProperty IIS:\AppPools\DefaultAppPool
    Write-Host "✓ DefaultAppPool found" -ForegroundColor Green
    Write-Host "  - Runtime version: $($pool.managedRuntimeVersion)"
    Write-Host "  - Pipeline mode: $($pool.managedPipelineMode)"
    Write-Host "  - Identity: $($pool.processModel.identityType)"
} catch {
    Write-Host "✗ Could not access IIS Application Pool information" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

# Check Directory Permissions
Write-Host "`n4. Checking Directory Permissions:" -ForegroundColor Yellow
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
Write-Host "`n5. Checking web.config:" -ForegroundColor Yellow
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

# Check for iisnode logs
Write-Host "`n6. Checking IISNode Logs:" -ForegroundColor Yellow
$logsPath = Join-Path (Get-Location) "iisnode_logs"
if (Test-Path $logsPath) {
    Write-Host "✓ iisnode_logs directory exists" -ForegroundColor Green
    $logs = Get-ChildItem $logsPath -File
    if ($logs) {
        Write-Host "Found $($logs.Count) log files:"
        $logs | ForEach-Object {
            Write-Host "  $($_.Name) - Last modified: $($_.LastWriteTime)"
        }
    } else {
        Write-Host "No log files found in iisnode_logs directory"
    }
} else {
    Write-Host "✗ iisnode_logs directory not found" -ForegroundColor Red
}

Write-Host "`n=== End of Diagnostic Report ===" -ForegroundColor Cyan
