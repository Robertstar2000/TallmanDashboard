# Direct MCP Table List Test - PowerShell Version
Write-Host "=== MCP Table List Test ===" -ForegroundColor Green
Write-Host ""

# Build MCP servers first
Write-Host "[1/4] Building P21 MCP Server..." -ForegroundColor Yellow
Set-Location "P21-MCP-Server-Package"
npm run build | Out-Null
Set-Location ".."

Write-Host "[2/4] Building POR MCP Server..." -ForegroundColor Yellow
Set-Location "POR-MCP-Server-Package"
npm run build | Out-Null
Set-Location ".."

Write-Host "[3/4] Testing P21 Database Connection..." -ForegroundColor Yellow

# Test P21 connection directly using PowerShell ODBC
try {
    $connectionString = "DSN=P21Live"
    $connection = New-Object System.Data.Odbc.OdbcConnection($connectionString)
    $connection.Open()
    
    $command = $connection.CreateCommand()
    $command.CommandText = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
    $reader = $command.ExecuteReader()
    
    Write-Host "P21 Tables Found:" -ForegroundColor Green
    $tableCount = 0
    while ($reader.Read()) {
        $tableName = $reader["TABLE_NAME"]
        Write-Host "  - $tableName" -ForegroundColor White
        $tableCount++
    }
    Write-Host "Total P21 Tables: $tableCount" -ForegroundColor Cyan
    
    $reader.Close()
    $connection.Close()
} catch {
    Write-Host "P21 Connection Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "[4/4] Testing POR Database Connection..." -ForegroundColor Yellow

# Test POR connection using Access OLEDB
try {
    $porPath = "\\ts03\POR\POR.MDB"
    $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$porPath"
    
    $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
    $connection.Open()
    
    # Get table names from Access database
    $tables = $connection.GetSchema("Tables")
    
    Write-Host "POR Tables Found:" -ForegroundColor Green
    $tableCount = 0
    foreach ($table in $tables) {
        if ($table.TABLE_TYPE -eq "TABLE") {
            $tableName = $table.TABLE_NAME
            Write-Host "  - $tableName" -ForegroundColor White
            $tableCount++
        }
    }
    Write-Host "Total POR Tables: $tableCount" -ForegroundColor Cyan
    
    $connection.Close()
} catch {
    Write-Host "POR Connection Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying alternative connection method..." -ForegroundColor Yellow
    
    try {
        # Try with Jet provider as fallback
        $connectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$porPath"
        $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
        $connection.Open()
        
        $tables = $connection.GetSchema("Tables")
        
        Write-Host "POR Tables Found (Jet Provider):" -ForegroundColor Green
        $tableCount = 0
        foreach ($table in $tables) {
            if ($table.TABLE_TYPE -eq "TABLE") {
                $tableName = $table.TABLE_NAME
                Write-Host "  - $tableName" -ForegroundColor White
                $tableCount++
            }
        }
        Write-Host "Total POR Tables: $tableCount" -ForegroundColor Cyan
        
        $connection.Close()
    } catch {
        Write-Host "POR Alternative Connection Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Green
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
