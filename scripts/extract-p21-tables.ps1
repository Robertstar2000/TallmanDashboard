# PowerShell script to extract table names from P21 SQL expressions
# This will help identify which tables are actually being used in your SQL expressions

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$outputPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-tables-used.csv"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-tables-extraction.log"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting P21 table extraction at $(Get-Date)"

# Function to extract table names from SQL expressions
function Get-TableNames {
    param (
        [string]$sqlExpression
    )
    
    $tableNames = @()
    
    # Extract table names from FROM clauses
    $fromMatches = [regex]::Matches($sqlExpression, "FROM\s+(?:dbo\.)?(\w+)")
    foreach ($match in $fromMatches) {
        $tableName = $match.Groups[1].Value
        if ($tableNames -notcontains $tableName) {
            $tableNames += $tableName
        }
    }
    
    # Extract table names from JOIN clauses
    $joinMatches = [regex]::Matches($sqlExpression, "JOIN\s+(?:dbo\.)?(\w+)")
    foreach ($match in $joinMatches) {
        $tableName = $match.Groups[1].Value
        if ($tableNames -notcontains $tableName) {
            $tableNames += $tableName
        }
    }
    
    return $tableNames
}

# Read the file content and process it line by line
$fileContent = Get-Content -Path $filePath
$tableUsage = @()
$inEntry = $false
$currentEntry = @{}

foreach ($line in $fileContent) {
    # Check if we're entering a new entry
    if ($line -match '^\s*\{') {
        $inEntry = $true
        $currentEntry = @{
            Id = $null
            ChartGroup = ""
            DataPoint = ""
            IsP21 = $false
            SqlExpression = $null
            Tables = @()
        }
    }
    # Check if we're exiting an entry
    elseif ($inEntry -and $line -match '^\s*\},?') {
        $inEntry = $false
        
        # If this is a P21 entry with a SQL expression, add it to the table usage
        if ($currentEntry.IsP21 -and $currentEntry.SqlExpression) {
            foreach ($table in $currentEntry.Tables) {
                $tableUsage += [PSCustomObject]@{
                    Id = $currentEntry.Id
                    ChartGroup = $currentEntry.ChartGroup
                    DataPoint = $currentEntry.DataPoint
                    TableName = $table
                    SqlExpression = $currentEntry.SqlExpression
                }
            }
        }
        
        $currentEntry = @{}
    }
    # Check for ID to determine if it's a P21 entry
    elseif ($inEntry -and $line -match '"id":\s*"(\d+)"') {
        $id = [int]$matches[1]
        $currentEntry.Id = $id
        
        # P21 entries have IDs 1-126
        if ($id -le 126) {
            $currentEntry.IsP21 = $true
        }
    }
    # Check for chart group
    elseif ($inEntry -and $line -match '"chartGroup":\s*"(.*?)"') {
        $currentEntry.ChartGroup = $matches[1]
    }
    # Check for data point
    elseif ($inEntry -and $line -match '"DataPoint":\s*"(.*?)"') {
        $currentEntry.DataPoint = $matches[1]
    }
    # Check for SQL expression in P21 entries
    elseif ($inEntry -and $currentEntry.IsP21 -and $line -match '"productionSqlExpression":\s*"(.*)"') {
        $sqlExpression = $matches[1]
        $currentEntry.SqlExpression = $sqlExpression
        
        # Extract table names from the SQL expression
        $tableNames = Get-TableNames -sqlExpression $sqlExpression
        $currentEntry.Tables = $tableNames
        
        Write-Host "ID ${currentEntry.Id}: Found tables: $($tableNames -join ', ')" -ForegroundColor Cyan
    }
}

# Group table usage by table name
$tableGroups = $tableUsage | Group-Object -Property TableName

# Write summary
Write-Host "`nSummary of P21 tables used:"
foreach ($group in $tableGroups) {
    Write-Host "Table '${group.Name}' is used in ${group.Count} SQL expressions" -ForegroundColor Green
}

# Export table usage to CSV
$tableUsage | Export-Csv -Path $outputPath -NoTypeInformation
Write-Host "Exported table usage to ${outputPath}"

# Create a SQL script to verify these tables in the P21 database
$uniqueTables = $tableGroups | Select-Object -ExpandProperty Name
$sqlScriptPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\verify-p21-tables.sql"

$sqlScript = @"
-- SQL script to verify P21 tables used in dashboard expressions
-- Run this script against your P21 database to check if these tables exist

-- Tables to verify
SELECT 
    t.name AS TableName,
    s.name AS SchemaName,
    OBJECT_DEFINITION(t.object_id) AS TableDefinition
FROM 
    sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE 
    t.name IN ('$($uniqueTables -join "','")') OR
    t.name LIKE '%hdr%' OR
    t.name LIKE '%line%' OR
    t.name LIKE '%mast%' OR
    t.name LIKE '%item%'
ORDER BY 
    t.name;

-- Table columns
SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable,
    CASE 
        WHEN pk.column_id IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END AS IsPrimaryKey
FROM 
    sys.tables t
    INNER JOIN sys.columns c ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    LEFT JOIN (
        SELECT ic.object_id, ic.column_id
        FROM sys.index_columns ic
        INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        WHERE i.is_primary_key = 1
    ) pk ON t.object_id = pk.object_id AND c.column_id = pk.column_id
WHERE 
    t.name IN ('$($uniqueTables -join "','")') OR
    t.name LIKE '%hdr%' OR
    t.name LIKE '%line%' OR
    t.name LIKE '%mast%' OR
    t.name LIKE '%item%'
ORDER BY 
    t.name, c.column_id;
"@

$sqlScript | Out-File -FilePath $sqlScriptPath -Encoding utf8
Write-Host "Created SQL verification script at ${sqlScriptPath}"

Write-Host "P21 table extraction completed at $(Get-Date)"
Stop-Transcript
