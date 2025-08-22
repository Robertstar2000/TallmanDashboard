# Direct test of MCP endpoint using PowerShell
Write-Host "=== Testing SQL Query Tool MCP Endpoint ===" -ForegroundColor Green

$baseUrl = "http://localhost:3001"

# Test 1: List P21 tables
Write-Host "`n1. Testing P21 table list..." -ForegroundColor Yellow
try {
    $body = @{
        query = "list tables"
        server = "P21"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/mcp/execute-query" -Method POST -Body $body -ContentType "application/json"
    
    if ($response -is [array]) {
        Write-Host "✅ P21 returned $($response.Count) tables" -ForegroundColor Green
        Write-Host "Sample tables: $($response[0..4] -join ', ')" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  P21 returned non-array: $($response.GetType().Name)" -ForegroundColor Yellow
        Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ P21 test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Simple P21 query
Write-Host "`n2. Testing simple P21 query..." -ForegroundColor Yellow
try {
    $body = @{
        query = "SELECT COUNT(*) as value FROM customer"
        server = "P21"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/mcp/execute-query" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ P21 query result: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Green
} catch {
    Write-Host "❌ P21 query failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: List POR tables
Write-Host "`n3. Testing POR table list..." -ForegroundColor Yellow
try {
    $body = @{
        query = "list tables"
        server = "POR"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/mcp/execute-query" -Method POST -Body $body -ContentType "application/json"
    
    if ($response -is [array]) {
        Write-Host "✅ POR returned $($response.Count) tables" -ForegroundColor Green
        Write-Host "Sample tables: $($response[0..4] -join ', ')" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  POR returned non-array: $($response.GetType().Name)" -ForegroundColor Yellow
        Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ POR test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
