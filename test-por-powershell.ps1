# Test POR Database Access with PowerShell
Write-Host "=== Testing POR Database Access ===" -ForegroundColor Green

$porPath = "\\ts03\POR\POR.MDB"
Write-Host "Testing file: $porPath" -ForegroundColor Yellow

# Test file existence
if (Test-Path $porPath) {
    Write-Host "✅ POR.MDB file exists and is accessible" -ForegroundColor Green
    
    # Get file info
    $fileInfo = Get-Item $porPath
    Write-Host "File size: $($fileInfo.Length) bytes" -ForegroundColor Cyan
    Write-Host "Last modified: $($fileInfo.LastWriteTime)" -ForegroundColor Cyan
    
    # Try to connect using OLEDB
    try {
        Write-Host "Attempting OLEDB connection..." -ForegroundColor Yellow
        
        # Try ACE provider first
        $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$porPath"
        $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
        $connection.Open()
        
        Write-Host "✅ Connected using ACE OLEDB provider" -ForegroundColor Green
        
        # Get table names
        $tables = $connection.GetSchema("Tables")
        $tableCount = 0
        Write-Host "POR Tables:" -ForegroundColor Green
        
        foreach ($table in $tables) {
            if ($table.TABLE_TYPE -eq "TABLE") {
                Write-Host "  - $($table.TABLE_NAME)" -ForegroundColor White
                $tableCount++
            }
        }
        
        Write-Host "Total tables found: $tableCount" -ForegroundColor Cyan
        $connection.Close()
        
    } catch {
        Write-Host "ACE provider failed: $($_.Exception.Message)" -ForegroundColor Red
        
        # Try Jet provider as fallback
        try {
            Write-Host "Trying Jet provider..." -ForegroundColor Yellow
            $connectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$porPath"
            $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
            $connection.Open()
            
            Write-Host "✅ Connected using Jet OLEDB provider" -ForegroundColor Green
            
            # Get table names
            $tables = $connection.GetSchema("Tables")
            $tableCount = 0
            Write-Host "POR Tables:" -ForegroundColor Green
            
            foreach ($table in $tables) {
                if ($table.TABLE_TYPE -eq "TABLE") {
                    Write-Host "  - $($table.TABLE_NAME)" -ForegroundColor White
                    $tableCount++
                }
            }
            
            Write-Host "Total tables found: $tableCount" -ForegroundColor Cyan
            $connection.Close()
            
        } catch {
            Write-Host "❌ Both OLEDB providers failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "❌ POR.MDB file not found or not accessible" -ForegroundColor Red
    Write-Host "Check network connectivity to \\ts03 and file permissions" -ForegroundColor Yellow
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
