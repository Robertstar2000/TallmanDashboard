# Clean up Node.js processes and test MCP functionality
Write-Host "=== Cleaning Up Node.js Processes and Testing MCP ===" -ForegroundColor Green

# Kill all Node.js processes
Write-Host "`n1. Killing all Node.js processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ All Node.js processes terminated" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Some processes may still be running" -ForegroundColor Yellow
}

# Verify processes are gone
$remainingProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($remainingProcesses) {
    Write-Host "⚠️  $($remainingProcesses.Count) Node.js processes still running" -ForegroundColor Yellow
} else {
    Write-Host "✅ All Node.js processes successfully terminated" -ForegroundColor Green
}

# Start only the backend server
Write-Host "`n2. Starting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d C:\Users\BobM\Desktop\TallmanDashboard\backend && node server-fixed.js" -WindowStyle Normal
Start-Sleep -Seconds 5

# Test if backend is running
Write-Host "`n3. Testing backend connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/status" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend server is running on port 3001" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend server may not be ready yet" -ForegroundColor Yellow
}

# Test P21 MCP endpoint
Write-Host "`n4. Testing P21 MCP list_tables..." -ForegroundColor Yellow
try {
    $body = @{
        query = "list tables"
        server = "P21"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/mcp/execute-query" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    
    if ($response -is [array] -and $response.Count -gt 0) {
        Write-Host "✅ P21 returned $($response.Count) tables" -ForegroundColor Green
        Write-Host "Sample P21 tables: $($response[0..4] -join ', ')" -ForegroundColor Cyan
    } else {
        Write-Host "❌ P21 returned empty or invalid result: $($response | ConvertTo-Json -Depth 1)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ P21 test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test POR MCP endpoint
Write-Host "`n5. Testing POR MCP list_tables..." -ForegroundColor Yellow
try {
    $body = @{
        query = "list tables"
        server = "POR"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/mcp/execute-query" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    
    if ($response -is [array] -and $response.Count -gt 0) {
        Write-Host "✅ POR returned $($response.Count) tables" -ForegroundColor Green
        Write-Host "Sample POR tables: $($response[0..4] -join ', ')" -ForegroundColor Cyan
    } elseif ($response -eq 99999) {
        Write-Host "❌ POR returned sentinel value 99999 - MCP connection failed" -ForegroundColor Red
    } else {
        Write-Host "❌ POR returned unexpected result: $($response | ConvertTo-Json -Depth 1)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ POR test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Cleanup and Test Complete ===" -ForegroundColor Green
Write-Host "Backend server should now be running cleanly without process conflicts" -ForegroundColor Cyan
Write-Host "Try the SQL Query Tool again - it should now return actual table lists" -ForegroundColor Cyan
