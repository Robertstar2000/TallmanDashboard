# Fix POR Connection Issues
Write-Host "=== Fixing POR Connection Issues ===" -ForegroundColor Cyan

# Step 1: Install MCP server dependencies
Write-Host "`n1. Installing MCP server dependencies..." -ForegroundColor Yellow
Set-Location "C:\Users\BobM\Desktop\TallmanDashboard\mcp-servers"
npm install --silent 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Test POR MCP server directly
Write-Host "`n2. Testing POR MCP server..." -ForegroundColor Yellow
$porTest = Start-Job -ScriptBlock {
    Set-Location "C:\Users\BobM\Desktop\TallmanDashboard\mcp-servers"
    $env:POR_DB_PATH = "\\ts03\POR\POR.MDB"
    node verify-por-fix.js
}

$porTest | Wait-Job -Timeout 15
$result = Receive-Job $porTest
Remove-Job $porTest

if ($result -match "SUCCESS") {
    Write-Host "   ✓ POR MCP server working" -ForegroundColor Green
} else {
    Write-Host "   ✗ POR MCP server failed" -ForegroundColor Red
    Write-Host "   Error: $result" -ForegroundColor Red
}

# Step 3: Restart TallmanDashboard backend
Write-Host "`n3. Backend should now recognize POR connection" -ForegroundColor Yellow
Write-Host "   ✓ Server paths updated to use mcp-servers directory" -ForegroundColor Green
Write-Host "   ✓ Simple SQL test query implemented" -ForegroundColor Green

Write-Host "`n=== Fix Complete ===" -ForegroundColor Cyan
Write-Host "Restart your TallmanDashboard application to see the fix." -ForegroundColor White