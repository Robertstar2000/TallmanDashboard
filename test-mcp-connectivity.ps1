# PowerShell script to test MCP server connectivity to P21 and POR databases
Write-Host "=== MCP Database Connectivity Test ===" -ForegroundColor Cyan
Write-Host ""

# Test P21 Connection
Write-Host "[1/2] Testing P21 Database Connection..." -ForegroundColor Yellow
Write-Host "DSN: P21Live" -ForegroundColor Gray

try {
    # Create ODBC connection to P21
    $connectionString = "DSN=P21Live"
    $connection = New-Object System.Data.Odbc.OdbcConnection($connectionString)
    $connection.Open()
    
    Write-Host "✅ P21 Connection: SUCCESS" -ForegroundColor Green
    
    # Test simple query
    $command = $connection.CreateCommand()
    $command.CommandText = "SELECT TOP 5 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
    $reader = $command.ExecuteReader()
    
    Write-Host "📋 P21 Tables Found:" -ForegroundColor Green
    $tableCount = 0
    while ($reader.Read() -and $tableCount -lt 5) {
        Write-Host "  - $($reader[0])" -ForegroundColor White
        $tableCount++
    }
    
    $reader.Close()
    $connection.Close()
    Write-Host "✅ P21 Test Complete - $tableCount tables retrieved" -ForegroundColor Green
    
} catch {
    Write-Host "❌ P21 Connection: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test POR Connection
Write-Host "[2/2] Testing POR Database Connection..." -ForegroundColor Yellow
Write-Host "Path: \\ts03\POR\POR.MDB" -ForegroundColor Gray

try {
    # Test if POR file exists
    $porPath = "\\ts03\POR\POR.MDB"
    if (Test-Path $porPath) {
        Write-Host "✅ POR File: EXISTS" -ForegroundColor Green
        
        # Create Access connection
        $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$porPath"
        $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
        $connection.Open()
        
        Write-Host "✅ POR Connection: SUCCESS" -ForegroundColor Green
        
        # Get table list
        $schema = $connection.GetSchema("Tables")
        $tables = $schema | Where-Object { $_.TABLE_TYPE -eq "TABLE" -and $_.TABLE_NAME -notlike "MSys*" }
        
        Write-Host "📋 POR Tables Found: $($tables.Count)" -ForegroundColor Green
        $tables | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - $($_.TABLE_NAME)" -ForegroundColor White
        }
        
        $connection.Close()
        Write-Host "✅ POR Test Complete - $($tables.Count) tables found" -ForegroundColor Green
        
    } else {
        Write-Host "❌ POR File: NOT FOUND at $porPath" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ POR Connection: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== MCP Connectivity Test Complete ===" -ForegroundColor Cyan
Write-Host "If both tests show SUCCESS, your MCP servers can access the external databases." -ForegroundColor Yellow
