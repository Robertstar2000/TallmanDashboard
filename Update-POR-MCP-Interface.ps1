# Updated MCP Interface for POR Database using direct Access connection
# This replaces the ODBC wrapper with direct OLEDB connection to match mdb-reader functionality

Write-Host "=== Updating POR MCP Interface ===" -ForegroundColor Green

$porPath = "\\ts03\POR\POR.MDB"

function Test-PORConnection {
    try {
        if (!(Test-Path $porPath)) {
            return @{
                success = $false
                error = "POR.MDB file not found at $porPath"
                database = $porPath
            }
        }

        $fileInfo = Get-Item $porPath
        return @{
            success = $true
            message = "POR connection successful using direct file access"
            database = $porPath
            fileSize = $fileInfo.Length
            lastModified = $fileInfo.LastWriteTime
            provider = "Direct Access (no ODBC required)"
        }
    }
    catch {
        return @{
            success = $false
            error = $_.Exception.Message
            database = $porPath
        }
    }
}

function Get-PORTables {
    try {
        # Try ACE provider first
        $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$porPath"
        $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
        $connection.Open()
        
        $tables = $connection.GetSchema("Tables")
        $tableList = @()
        
        foreach ($table in $tables) {
            if ($table.TABLE_TYPE -eq "TABLE") {
                $tableList += $table.TABLE_NAME
            }
        }
        
        $connection.Close()
        
        return @{
            success = $true
            tables = $tableList
            count = $tableList.Count
            provider = "ACE OLEDB"
        }
    }
    catch {
        try {
            # Fallback to Jet provider
            $connectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$porPath"
            $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
            $connection.Open()
            
            $tables = $connection.GetSchema("Tables")
            $tableList = @()
            
            foreach ($table in $tables) {
                if ($table.TABLE_TYPE -eq "TABLE") {
                    $tableList += $table.TABLE_NAME
                }
            }
            
            $connection.Close()
            
            return @{
                success = $true
                tables = $tableList
                count = $tableList.Count
                provider = "Jet OLEDB"
            }
        }
        catch {
            return @{
                success = $false
                error = $_.Exception.Message
            }
        }
    }
}

function Execute-PORQuery {
    param([string]$query)
    
    try {
        $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$porPath"
        $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
        $connection.Open()
        
        $command = $connection.CreateCommand()
        $command.CommandText = $query
        $adapter = New-Object System.Data.OleDb.OleDbDataAdapter($command)
        $dataset = New-Object System.Data.DataSet
        $adapter.Fill($dataset)
        
        $results = @()
        foreach ($row in $dataset.Tables[0].Rows) {
            $rowData = @{}
            foreach ($column in $dataset.Tables[0].Columns) {
                $rowData[$column.ColumnName] = $row[$column.ColumnName]
            }
            $results += $rowData
        }
        
        $connection.Close()
        
        return @{
            success = $true
            data = $results
            rowCount = $results.Count
        }
    }
    catch {
        try {
            # Fallback to Jet provider
            $connectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$porPath"
            $connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
            $connection.Open()
            
            $command = $connection.CreateCommand()
            $command.CommandText = $query
            $adapter = New-Object System.Data.OleDb.OleDbDataAdapter($command)
            $dataset = New-Object System.Data.DataSet
            $adapter.Fill($dataset)
            
            $results = @()
            foreach ($row in $dataset.Tables[0].Rows) {
                $rowData = @{}
                foreach ($column in $dataset.Tables[0].Columns) {
                    $rowData[$column.ColumnName] = $row[$column.ColumnName]
                }
                $results += $rowData
            }
            
            $connection.Close()
            
            return @{
                success = $true
                data = $results
                rowCount = $results.Count
            }
        }
        catch {
            return @{
                success = $false
                error = $_.Exception.Message
            }
        }
    }
}

# Test the updated interface
Write-Host "1. Testing POR connection..." -ForegroundColor Yellow
$connectionResult = Test-PORConnection
Write-Host "Connection result:" -ForegroundColor Cyan
$connectionResult | ConvertTo-Json -Depth 3

if ($connectionResult.success) {
    Write-Host "`n2. Getting POR tables..." -ForegroundColor Yellow
    $tablesResult = Get-PORTables
    
    if ($tablesResult.success) {
        Write-Host "✅ SUCCESS: Found $($tablesResult.count) POR tables:" -ForegroundColor Green
        for ($i = 0; $i -lt [Math]::Min(10, $tablesResult.tables.Count); $i++) {
            Write-Host "  $($i + 1). $($tablesResult.tables[$i])" -ForegroundColor White
        }
        if ($tablesResult.tables.Count -gt 10) {
            Write-Host "  ... and $($tablesResult.tables.Count - 10) more tables" -ForegroundColor Gray
        }
        
        # Test a simple query
        Write-Host "`n3. Testing simple query..." -ForegroundColor Yellow
        $testQuery = "SELECT COUNT(*) as RecordCount FROM $($tablesResult.tables[0])"
        $queryResult = Execute-PORQuery -query $testQuery
        
        if ($queryResult.success) {
            Write-Host "✅ Query successful: $($queryResult.data[0].RecordCount) records in $($tablesResult.tables[0])" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Query failed: $($queryResult.error)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Failed to get tables: $($tablesResult.error)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Connection failed: $($connectionResult.error)" -ForegroundColor Red
}

Write-Host "`n=== POR MCP Interface Update Complete ===" -ForegroundColor Green
Write-Host "The interface now uses direct OLEDB connection instead of ODBC" -ForegroundColor Cyan
