# Quick MCP Server Test Script
Write-Host "=== MCP Server Quick Test ===" -ForegroundColor Cyan

# Step 1: Install dependencies
Write-Host "1. Installing dependencies..." -ForegroundColor Yellow
cd "C:\Users\BobM\Desktop\TallmanDashboard\mcp-servers"
npm install --silent --no-progress 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Test P21 connection
Write-Host "`n2. Testing P21 connection..." -ForegroundColor Yellow
try {
    $p21Result = node test-p21-simple.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ P21 connection successful" -ForegroundColor Green
    } else {
        Write-Host "   ✗ P21 connection failed: $p21Result" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ P21 test error: $_" -ForegroundColor Red
}

# Step 3: Test POR connection
Write-Host "`n3. Testing POR connection..." -ForegroundColor Yellow
try {
    $porResult = node test-por-simple.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ POR connection successful" -ForegroundColor Green
    } else {
        Write-Host "   ✗ POR connection failed: $porResult" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ POR test error: $_" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan