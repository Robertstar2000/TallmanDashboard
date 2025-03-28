# Configuration
$POR_DB_PATH = "C:\Users\BobM\Desktop\POR.MDB"
$REPORT_DIR = Join-Path $PSScriptRoot "..\..\reports"

# Ensure reports directory exists
if (-not (Test-Path $REPORT_DIR)) {
    New-Item -ItemType Directory -Path $REPORT_DIR -Force | Out-Null
}

# Define SQL expressions to test
$sqlExpressions = @(
    @{
        id = "74"
        name = "Historical Data - January - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 1 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "78"
        name = "Historical Data - February - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 2 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "82"
        name = "Historical Data - March - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 3 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "86"
        name = "Historical Data - April - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 4 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "90"
        name = "Historical Data - May - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 5 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "94"
        name = "Historical Data - June - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 6 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "98"
        name = "Historical Data - July - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 7 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "102"
        name = "Historical Data - August - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 8 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "106"
        name = "Historical Data - September - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 9 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "110"
        name = "Historical Data - October - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 10 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "114"
        name = "Historical Data - November - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 11 AND Year([ContractDate]) = Year(Date())"
    },
    @{
        id = "118"
        name = "Historical Data - December - POR"
        sqlExpression = "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 12 AND Year([ContractDate]) = Year(Date())"
    }
)

# Define alternative tables to test
$alternativeTables = @("Rentals", "Transactions", "Orders", "Invoices", "Contracts")

# Define alternative date columns to test
$dateColumns = @("ContractDate", "Date", "TransactionDate", "InvoiceDate", "RentalDate", "OrderDate")

# Function to test SQL expressions
function Test-SqlExpressions {
    Write-Host "Testing SQL expressions against POR database..."
    
    if (-not (Test-Path $POR_DB_PATH)) {
        Write-Host "POR database file not found: $POR_DB_PATH" -ForegroundColor Red
        return
    }
    
    # Create results array
    $results = @()
    
    # Create connection string
    $connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$POR_DB_PATH"
    
    try {
        # Create connection
        $connection = New-Object System.Data.OleDb.OleDbConnection
        $connection.ConnectionString = $connectionString
        $connection.Open()
        
        Write-Host "Successfully connected to the database" -ForegroundColor Green
        
        # Test each SQL expression
        foreach ($expr in $sqlExpressions) {
            Write-Host "Testing expression: $($expr.name)" -ForegroundColor Cyan
            
            $result = @{
                id = $expr.id
                name = $expr.name
                sql = $expr.sqlExpression
                result = ""
                success = $false
                error = ""
            }
            
            try {
                $command = $connection.CreateCommand()
                $command.CommandText = $expr.sqlExpression
                $reader = $command.ExecuteReader()
                
                if ($reader.Read()) {
                    $result.result = $reader.GetValue(0)
                    $result.success = $true
                } else {
                    $result.result = "No results"
                    $result.success = $true
                }
                
                $reader.Close()
            } catch {
                $result.error = $_.Exception.Message
                Write-Host "  Error: $($result.error)" -ForegroundColor Red
            }
            
            $results += $result
        }
        
        # Test alternative table names
        foreach ($table in $alternativeTables) {
            foreach ($month in @(1, 6, 12)) { # Test January, June, and December
                $altSql = "SELECT Count(*) as value FROM $table WHERE Month([ContractDate]) = $month AND Year([ContractDate]) = Year(Date())"
                
                Write-Host "Testing alternative table: $table for month $month" -ForegroundColor Cyan
                
                $result = @{
                    id = "ALT-$table-$month"
                    name = "Alternative $table Month $month"
                    sql = $altSql
                    result = ""
                    success = $false
                    error = ""
                }
                
                try {
                    $command = $connection.CreateCommand()
                    $command.CommandText = $altSql
                    $reader = $command.ExecuteReader()
                    
                    if ($reader.Read()) {
                        $result.result = $reader.GetValue(0)
                        $result.success = $true
                    } else {
                        $result.result = "No results"
                        $result.success = $true
                    }
                    
                    $reader.Close()
                } catch {
                    $result.error = $_.Exception.Message
                    Write-Host "  Error: $($result.error)" -ForegroundColor Red
                }
                
                $results += $result
            }
        }
        
        # Test alternative date column names
        $tableToTest = "Contracts" # Use the default table name
        
        foreach ($column in $dateColumns) {
            $altSql = "SELECT Count(*) as value FROM $tableToTest WHERE Month([$column]) = 1 AND Year([$column]) = Year(Date())"
            
            Write-Host "Testing alternative date column: $column" -ForegroundColor Cyan
            
            $result = @{
                id = "ALT-COL-$column"
                name = "Alternative Column $column"
                sql = $altSql
                result = ""
                success = $false
                error = ""
            }
            
            try {
                $command = $connection.CreateCommand()
                $command.CommandText = $altSql
                $reader = $command.ExecuteReader()
                
                if ($reader.Read()) {
                    $result.result = $reader.GetValue(0)
                    $result.success = $true
                } else {
                    $result.result = "No results"
                    $result.success = $true
                }
                
                $reader.Close()
            } catch {
                $result.error = $_.Exception.Message
                Write-Host "  Error: $($result.error)" -ForegroundColor Red
            }
            
            $results += $result
        }
        
        # Close connection
        $connection.Close()
        
    } catch {
        Write-Host "Error connecting to database: $_" -ForegroundColor Red
        
        # Try alternative provider
        Write-Host "Trying alternative provider..." -ForegroundColor Yellow
        
        $connectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$POR_DB_PATH"
        
        try {
            # Create connection
            $connection = New-Object System.Data.OleDb.OleDbConnection
            $connection.ConnectionString = $connectionString
            $connection.Open()
            
            Write-Host "Successfully connected to the database with alternative provider" -ForegroundColor Green
            
            # Test each SQL expression
            foreach ($expr in $sqlExpressions) {
                Write-Host "Testing expression: $($expr.name)" -ForegroundColor Cyan
                
                $result = @{
                    id = $expr.id
                    name = $expr.name
                    sql = $expr.sqlExpression
                    result = ""
                    success = $false
                    error = ""
                }
                
                try {
                    $command = $connection.CreateCommand()
                    $command.CommandText = $expr.sqlExpression
                    $reader = $command.ExecuteReader()
                    
                    if ($reader.Read()) {
                        $result.result = $reader.GetValue(0)
                        $result.success = $true
                    } else {
                        $result.result = "No results"
                        $result.success = $true
                    }
                    
                    $reader.Close()
                } catch {
                    $result.error = $_.Exception.Message
                    Write-Host "  Error: $($result.error)" -ForegroundColor Red
                }
                
                $results += $result
            }
            
            # Close connection
            $connection.Close()
            
        } catch {
            Write-Host "Error connecting to database with alternative provider: $_" -ForegroundColor Red
            
            # Try using ADOX to get schema information
            Write-Host "Trying to get schema information using ADOX..." -ForegroundColor Yellow
            
            try {
                $catalog = New-Object -ComObject ADOX.Catalog
                $catalog.ActiveConnection = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$POR_DB_PATH"
                
                Write-Host "Successfully connected to the database with ADOX" -ForegroundColor Green
                
                # Get tables
                Write-Host "Tables in the database:" -ForegroundColor Cyan
                foreach ($table in $catalog.Tables) {
                    if ($table.Type -eq "TABLE") {
                        Write-Host "  $($table.Name)" -ForegroundColor White
                        
                        # Get columns
                        Write-Host "    Columns:" -ForegroundColor DarkCyan
                        foreach ($column in $table.Columns) {
                            Write-Host "      $($column.Name) ($($column.Type))" -ForegroundColor Gray
                        }
                    }
                }
                
                # Generate SQL expressions based on schema
                Write-Host "Generating SQL expressions based on schema..." -ForegroundColor Yellow
                
                $generatedExpressions = @()
                
                foreach ($table in $catalog.Tables) {
                    if ($table.Type -eq "TABLE" -and $table.Name -notmatch "^MSys") {
                        # Look for date columns
                        $dateColumn = $null
                        
                        foreach ($column in $table.Columns) {
                            if ($column.Type -eq 7 -or $column.Name -match "Date|Time") { # 7 = adDate
                                $dateColumn = $column.Name
                                break
                            }
                        }
                        
                        if ($dateColumn) {
                            for ($month = 1; $month -le 12; $month++) {
                                $monthName = (Get-Culture).DateTimeFormat.GetMonthName($month)
                                
                                $generatedExpressions += @{
                                    id = "GEN-$($table.Name)-$month"
                                    name = "Generated $($table.Name) $monthName"
                                    sqlExpression = "SELECT Count(*) as value FROM [$($table.Name)] WHERE Month([$dateColumn]) = $month AND Year([$dateColumn]) = Year(Date())"
                                }
                            }
                        }
                    }
                }
                
                # Save generated expressions
                $generatedExpressionsPath = Join-Path $REPORT_DIR "por-generated-sql.json"
                $generatedExpressions | ConvertTo-Json -Depth 3 | Out-File -FilePath $generatedExpressionsPath -Encoding UTF8
                
                Write-Host "Generated SQL expressions saved to: $generatedExpressionsPath" -ForegroundColor Green
                
            } catch {
                Write-Host "Error getting schema information: $_" -ForegroundColor Red
            }
        }
    }
    
    # Save results to CSV
    $resultsPath = Join-Path $REPORT_DIR "por-sql-test-results.csv"
    
    "ID,Name,SQL Expression,Result,Success,Error" | Out-File -FilePath $resultsPath -Encoding UTF8
    
    foreach ($result in $results) {
        "$($result.id),""$($result.name.Replace('"', '""'))"",""$($result.sql.Replace('"', '""'))"",""$($result.result)"",""$($result.success)"",""$($result.error.Replace('"', '""'))""" | 
            Out-File -FilePath $resultsPath -Encoding UTF8 -Append
    }
    
    Write-Host "Results saved to: $resultsPath" -ForegroundColor Green
    
    # Display results summary
    $successful = ($results | Where-Object { $_.success }).Count
    $failed = ($results | Where-Object { -not $_.success }).Count
    
    Write-Host "`nTest Results Summary:" -ForegroundColor Yellow
    Write-Host "Total tests: $($results.Count)" -ForegroundColor Cyan
    Write-Host "Successful: $successful" -ForegroundColor Green
    Write-Host "Failed: $failed" -ForegroundColor Red
    
    if ($failed -gt 0) {
        Write-Host "`nFailed Tests:" -ForegroundColor Red
        $results | Where-Object { -not $_.success } | ForEach-Object {
            Write-Host "- $($_.name) (ID: $($_.id))" -ForegroundColor Red
            Write-Host "  SQL: $($_.sql)" -ForegroundColor DarkRed
            Write-Host "  Error: $($_.error)" -ForegroundColor DarkRed
            Write-Host ""
        }
    }
    
    # Find successful alternative tests
    $alternativeTests = $results | Where-Object { $_.id -like "ALT-*" -and $_.success }
    
    if ($alternativeTests.Count -gt 0) {
        Write-Host "`nSuccessful Alternative Tests:" -ForegroundColor Green
        $alternativeTests | ForEach-Object {
            Write-Host "- $($_.name)" -ForegroundColor Green
            Write-Host "  SQL: $($_.sql)" -ForegroundColor DarkGreen
            Write-Host "  Result: $($_.result)" -ForegroundColor DarkGreen
            Write-Host ""
        }
        
        # Generate updated SQL expressions based on successful alternatives
        New-UpdatedSql -Results $results -SuccessfulAlternatives $alternativeTests
    }
    
    return $results
}

# Function to generate updated SQL expressions based on successful alternatives
function New-UpdatedSql {
    param (
        [array]$Results,
        [array]$SuccessfulAlternatives
    )
    
    Write-Host "Generating updated SQL expressions based on successful alternatives..." -ForegroundColor Yellow
    
    # Find the best alternative table
    $tableCounts = @{}
    
    $SuccessfulAlternatives | 
        Where-Object { $_.id -like "ALT-*" -and $_.id -notlike "ALT-COL-*" } | 
        ForEach-Object {
            $table = $_.id.Split('-')[1]
            $tableCounts[$table] = ($tableCounts[$table] -as [int]) + 1
        }
    
    $bestTable = $tableCounts.GetEnumerator() | 
        Sort-Object -Property Value -Descending | 
        Select-Object -First 1 -ExpandProperty Key
    
    if (-not $bestTable) {
        $bestTable = "Contracts"
    }
    
    Write-Host "Best alternative table: $bestTable" -ForegroundColor Cyan
    
    # Find the best alternative date column
    $columnCounts = @{}
    
    $SuccessfulAlternatives | 
        Where-Object { $_.id -like "ALT-COL-*" } | 
        ForEach-Object {
            $column = $_.id.Split('-')[2]
            $columnCounts[$column] = ($columnCounts[$column] -as [int]) + 1
        }
    
    $bestColumn = $columnCounts.GetEnumerator() | 
        Sort-Object -Property Value -Descending | 
        Select-Object -First 1 -ExpandProperty Key
    
    if (-not $bestColumn) {
        $bestColumn = "ContractDate"
    }
    
    Write-Host "Best alternative date column: $bestColumn" -ForegroundColor Cyan
    
    # Generate updated SQL expressions
    $updatedExpressions = $sqlExpressions | ForEach-Object {
        # Replace table and column names
        $updatedSql = $_.sqlExpression -replace 
            "FROM\s+Contracts", "FROM $bestTable" -replace 
            "\[ContractDate\]", "[$bestColumn]"
        
        @{
            id = $_.id
            name = $_.name
            originalSql = $_.sqlExpression
            updatedSql = $updatedSql
        }
    }
    
    # Save updated SQL expressions to file
    $updatedSqlPath = Join-Path $REPORT_DIR "por-updated-sql.json"
    $updatedExpressions | ConvertTo-Json -Depth 3 | Out-File -FilePath $updatedSqlPath -Encoding UTF8
    
    Write-Host "Updated SQL expressions saved to: $updatedSqlPath" -ForegroundColor Green
    
    # Generate a script to update the complete-chart-data.ts file
    $updateScriptPath = Join-Path $PSScriptRoot "update-chart-data.js"
    
    $updateScriptContent = @"
const fs = require('fs');
const path = require('path');

// Load updated SQL expressions
const updatedExpressions = require('$($updatedSqlPath.Replace('\', '\\'))');

// Load complete-chart-data.ts
const chartDataPath = path.join(__dirname, '..', '..', 'lib', 'db', 'complete-chart-data.ts');
let chartDataContent = fs.readFileSync(chartDataPath, 'utf8');

// Update each SQL expression
updatedExpressions.forEach(expr => {
  const id = expr.id;
  const updatedSql = expr.updatedSql;
  
  // Create a regex pattern to find the SQL expression for this ID
  const pattern = new RegExp(`"id":\\s*"\${id}"[\\s\\S]*?("sqlExpression":\\s*")[^"]*(",[\\s\\S]*?"productionSqlExpression":\\s*")[^"]*(")`);
  
  // Replace the SQL expressions
  chartDataContent = chartDataContent.replace(pattern, `"id": "\${id}"\$1\${updatedSql}\$2\${updatedSql}\$3`);
});

// Write the updated content back to the file
fs.writeFileSync(chartDataPath, chartDataContent);

console.log('Updated complete-chart-data.ts with new SQL expressions');
"@
    
    $updateScriptContent | Out-File -FilePath $updateScriptPath -Encoding UTF8
    
    Write-Host "Update script created: $updateScriptPath" -ForegroundColor Green
    Write-Host "Run this script to update the complete-chart-data.ts file with the successful SQL expressions" -ForegroundColor Yellow
}

# Main execution
try {
    Test-SqlExpressions
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
