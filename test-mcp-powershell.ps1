# PowerShell-based MCP test to avoid Node.js hanging issues
Write-Host "=== MCP Server Test via PowerShell ===" -ForegroundColor Green

# Function to test HTTP endpoint
function Test-Endpoint {
    param($Url, $Method = "GET", $Body = $null, $ContentType = "application/json")
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body $Body -ContentType $ContentType -TimeoutSec 15
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -TimeoutSec 15
        }
        return $response
    } catch {
        Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Kill existing Node processes
Write-Host "`n1. Cleaning up Node.js processes..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Start-Sleep 2
    Write-Host "✅ Node.js processes terminated" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Some processes may still be running" -ForegroundColor Yellow
}

# Start backend server
Write-Host "`n2. Starting backend server..." -ForegroundColor Yellow
$backendPath = "C:\Users\BobM\Desktop\TallmanDashboard\backend"
Start-Process -FilePath "node" -ArgumentList "server-fixed.js" -WorkingDirectory $backendPath -WindowStyle Minimized
Start-Sleep 8

# Test backend status
Write-Host "`n3. Testing backend status..." -ForegroundColor Yellow
$status = Test-Endpoint -Url "http://localhost:3001/api/status"
if ($status) {
    Write-Host "✅ Backend server is responding" -ForegroundColor Green
} else {
    Write-Host "❌ Backend server not responding" -ForegroundColor Red
    exit 1
}

# Test P21 MCP
Write-Host "`n4. Testing P21 MCP list_tables..." -ForegroundColor Yellow
$p21Body = @{
    query = "list tables"
    server = "P21"
} | ConvertTo-Json

$p21Result = Test-Endpoint -Url "http://localhost:3001/api/mcp/execute-query" -Method "POST" -Body $p21Body
if ($p21Result) {
    if ($p21Result -is [array] -and $p21Result.Count -gt 0) {
        Write-Host "✅ P21 returned $($p21Result.Count) tables" -ForegroundColor Green
        Write-Host "Sample: $($p21Result[0..4] -join ', ')" -ForegroundColor Cyan
    } else {
        Write-Host "❌ P21 returned empty or invalid result" -ForegroundColor Red
        Write-Host "Result: $($p21Result | ConvertTo-Json -Depth 1)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ P21 MCP test failed" -ForegroundColor Red
}

# Test POR MCP
Write-Host "`n5. Testing POR MCP list_tables..." -ForegroundColor Yellow
$porBody = @{
    query = "list tables"
    server = "POR"
} | ConvertTo-Json

$porResult = Test-Endpoint -Url "http://localhost:3001/api/mcp/execute-query" -Method "POST" -Body $porBody
if ($porResult) {
    if ($porResult -is [array] -and $porResult.Count -gt 0) {
        Write-Host "✅ POR returned $($porResult.Count) tables" -ForegroundColor Green
        Write-Host "Sample: $($porResult[0..4] -join ', ')" -ForegroundColor Cyan
    } elseif ($porResult -eq 99999) {
        Write-Host "❌ POR returned sentinel value 99999 - MCP connection failed" -ForegroundColor Red
    } else {
        Write-Host "❌ POR returned unexpected result" -ForegroundColor Red
        Write-Host "Result: $($porResult | ConvertTo-Json -Depth 1)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ POR MCP test failed" -ForegroundColor Red
}

# Test connection status endpoint
Write-Host "`n6. Testing connection status..." -ForegroundColor Yellow
$connections = Test-Endpoint -Url "http://localhost:3001/api/connections/status"
if ($connections) {
    Write-Host "✅ Connection status endpoint working" -ForegroundColor Green
    foreach ($conn in $connections) {
        $status = if ($conn.status -eq "Connected") { "✅" } else { "❌" }
        Write-Host "$status $($conn.name): $($conn.status)" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Connection status test failed" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "Backend should now be running. Test the SQL Query Tool in the dashboard." -ForegroundColor Cyan
