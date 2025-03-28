param (
    [string]$DatabasePath = "C:\Users\BobM\Desktop\POR.MDB"
)

# Check if database file exists
if (-not (Test-Path $DatabasePath)) {
    Write-Host "Database file not found at: $DatabasePath"
    exit 1
}

Write-Host "Database file exists at: $DatabasePath"

# Create connection string
$connectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$DatabasePath"

try {
    # Create connection
    $connection = New-Object System.Data.OleDb.OleDbConnection
    $connection.ConnectionString = $connectionString
    $connection.Open()
    
    Write-Host "Successfully connected to the database"
    
    # Get schema information
    $schema = $connection.GetSchema("Tables")
    
    # Filter out system tables
    $userTables = $schema | Where-Object { $_.TABLE_TYPE -eq "TABLE" -and -not $_.TABLE_NAME.StartsWith("MSys") }
    
    Write-Host "`nFound $($userTables.Count) user tables in the database:"
    
    # Create an array to store table information
    $tablesInfo = @()
    
    foreach ($table in $userTables) {
        $tableName = $table.TABLE_NAME
        Write-Host "`nTable: $tableName"
        
        # Get column information
        $command = $connection.CreateCommand()
        $command.CommandText = "SELECT * FROM [$tableName] WHERE 1=0"
        $reader = $command.ExecuteReader()
        $schema = $reader.GetSchemaTable()
        
        Write-Host "Columns:"
        
        # Create an array to store column information
        $columnsInfo = @()
        
        foreach ($column in $schema) {
            $columnName = $column.ColumnName
            $dataType = $column.DataType.Name
            $size = $column.ColumnSize
            
            Write-Host "  - $columnName ($dataType, $size)"
            
            # Add column info to array
            $columnsInfo += @{
                "name" = $columnName
                "type" = $dataType
                "size" = $size
            }
        }
        
        $reader.Close()
        
        # Add table info to array
        $tablesInfo += @{
            "name" = $tableName
            "columns" = $columnsInfo
        }
    }
    
    # Generate SQL expressions for POR database
    Write-Host "`nGenerating SQL expressions for POR database..."
    
    $months = @(
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    )
    
    # Find tables that might contain rental or transaction data
    $rentalTables = $tablesInfo | Where-Object { 
        $_.name -match "rental|contract|transaction|invoice" 
    }
    
    $sqlExpressions = @()
    
    if ($rentalTables.Count -gt 0) {
        Write-Host "Found $($rentalTables.Count) potential rental/transaction tables"
        
        # Generate SQL for each month
        for ($i = 0; $i -lt $months.Count; $i++) {
            $month = $months[$i]
            $monthNumber = $i + 1
            
            $sqlExpression = ""
            $tableName = ""
            
            # Find a suitable table with date columns
            foreach ($table in $rentalTables) {
                $dateColumns = $table.columns | Where-Object { 
                    $_.name -match "date|time" 
                }
                
                if ($dateColumns.Count -gt 0) {
                    $tableName = $table.name
                    $dateColumn = $dateColumns[0].name
                    
                    # Check if there's a status column
                    $statusColumn = $table.columns | Where-Object { 
                        $_.name -match "status" 
                    }
                    
                    if ($statusColumn) {
                        $sqlExpression = "SELECT Count(*) as value FROM [$tableName] WHERE Month([$dateColumn]) = $monthNumber AND Year([$dateColumn]) = Year(Date())"
                    } else {
                        $sqlExpression = "SELECT Count(*) as value FROM [$tableName] WHERE Month([$dateColumn]) = $monthNumber AND Year([$dateColumn]) = Year(Date())"
                    }
                    
                    break
                }
            }
            
            # If no suitable table found, use a default expression
            if (-not $sqlExpression) {
                if ($rentalTables.Count -gt 0) {
                    $tableName = $rentalTables[0].name
                    $sqlExpression = "SELECT Count(*) as value FROM [$tableName]"
                } else {
                    $sqlExpression = "SELECT 0 as value"
                }
            }
            
            $sqlExpressions += @{
                "name" = "Historical Data - $month - POR"
                "variableName" = "POR $month"
                "sqlExpression" = $sqlExpression
                "tableName" = $tableName
            }
        }
    } else {
        Write-Host "No rental or transaction tables found"
        
        # Use generic SQL expressions
        foreach ($month in $months) {
            $sqlExpressions += @{
                "name" = "Historical Data - $month - POR"
                "variableName" = "POR $month"
                "sqlExpression" = "SELECT 0 as value"
                "tableName" = ""
            }
        }
    }
    
    # Display SQL expressions
    Write-Host "`nGenerated SQL expressions:"
    
    foreach ($expr in $sqlExpressions) {
        Write-Host "`n$($expr.name) ($($expr.variableName)):"
        Write-Host "Table: $($expr.tableName)"
        Write-Host "SQL: $($expr.sqlExpression)"
    }
    
    # Save SQL expressions to JSON file
    $outputPath = Join-Path $PSScriptRoot "..\..\reports\por-sql-expressions.json"
    $sqlExpressions | ConvertTo-Json -Depth 3 | Out-File -FilePath $outputPath -Encoding UTF8
    
    Write-Host "`nSQL expressions saved to: $outputPath"
    
    # Close connection
    $connection.Close()
    
} catch {
    Write-Host "Error: $_"
    if ($connection -and $connection.State -eq 'Open') {
        $connection.Close()
    }
}
