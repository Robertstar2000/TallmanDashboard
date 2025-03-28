# PowerShell script to verify P21 table names against the actual database schema
# and update SQL expressions with proper schema prefixes and WITH (NOLOCK) hints
# This version focuses ONLY on P21 expressions (IDs 1-126)

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-schema-verification.log"
$schemaQueryPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\get-p21-schema.sql"
$schemaOutputPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-schema.csv"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting P21-only schema verification at $(Get-Date)"

# Create a backup of the original file
Copy-Item -Path $filePath -Destination $backupPath
Write-Host "Created backup at $backupPath"

# Function to extract table names from SQL expressions
function Get-TableNames {
    param (
        [string]$sqlExpression
    )
    
    # Common SQL keywords that might be followed by table names
    $keywords = @("FROM", "JOIN", "UPDATE", "INTO")
    $tableNames = @()
    
    # Split the SQL into words and look for table names after keywords
    $words = $sqlExpression -split '\s+'
    
    for ($i = 0; $i -lt $words.Count - 1; $i++) {
        $word = $words[$i].ToUpper()
        
        if ($keywords -contains $word) {
            $potentialTable = $words[$i + 1]
            
            # Clean up the table name (remove schema prefixes, aliases, etc.)
            $potentialTable = $potentialTable -replace 'dbo\.', ''
            $potentialTable = $potentialTable -replace ',.*$', ''
            $potentialTable = $potentialTable -replace '\(.*$', ''
            $potentialTable = $potentialTable -replace '\).*$', ''
            
            if ($potentialTable -and $potentialTable -notmatch '^\s*$' -and $tableNames -notcontains $potentialTable) {
                $tableNames += $potentialTable
            }
        }
    }
    
    return $tableNames
}

# Read the file content
$fileContent = Get-Content -Path $filePath -Raw

# Extract P21 SQL expressions (IDs 1-126 only)
$p21SqlExpressions = @()
$p21Entries = @()

# Parse the file to extract entries
$inEntry = $false
$currentEntry = $null
$lines = $fileContent -split "`n"

for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    
    # Start of a new entry
    if ($line -match '^\s*\{') {
        $inEntry = $true
        $currentEntry = @{
            Lines = @()
            StartLine = $i
            Id = ""
            SqlExpression = ""
            SqlLine = -1
        }
    }
    # End of an entry
    elseif ($inEntry -and $line -match '^\s*\},?') {
        $inEntry = $false
        if ($currentEntry.Id -ne "" -and [int]$currentEntry.Id -le 126) {
            $p21Entries += $currentEntry
            if ($currentEntry.SqlExpression -ne "") {
                $p21SqlExpressions += $currentEntry.SqlExpression
            }
        }
        $currentEntry = $null
    }
    # Inside an entry
    elseif ($inEntry) {
        $currentEntry.Lines += $line
        
        # Extract ID
        if ($line -match '"id": "(\d+)"') {
            $currentEntry.Id = $matches[1]
        }
        # Extract SQL expression
        elseif ($line -match '"productionSqlExpression": "([^"]*)"') {
            $currentEntry.SqlExpression = $matches[1]
            $currentEntry.SqlLine = $currentEntry.Lines.Count - 1
        }
    }
}

Write-Host "Found $($p21Entries.Count) P21 entries (IDs 1-126)"
Write-Host "Found $($p21SqlExpressions.Count) P21 SQL expressions"

# Extract all table names from P21 SQL expressions
$allTableNames = @()

foreach ($sqlExpression in $p21SqlExpressions) {
    $tableNames = Get-TableNames -sqlExpression $sqlExpression
    
    foreach ($tableName in $tableNames) {
        if ($allTableNames -notcontains $tableName) {
            $allTableNames += $tableName
        }
    }
}

Write-Host "Extracted $($allTableNames.Count) unique table names from P21 SQL expressions"
Write-Host "Table names: $($allTableNames -join ', ')"

# Create a SQL script to query the P21 database schema
$schemaQuery = @"
SELECT 
    t.name AS TableName,
    s.name AS SchemaName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM 
    sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN sys.columns c ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE 
    t.name IN ('$(($allTableNames | ForEach-Object { $_ -replace "'", "''" }) -join "','")') OR
    t.name LIKE '%hdr%' OR
    t.name LIKE '%line%' OR
    t.name LIKE '%mast%' OR
    t.name LIKE '%item%'
ORDER BY 
    t.name, c.column_id
"@

# Save the schema query to a file
$schemaQuery | Out-File -FilePath $schemaQueryPath -Encoding utf8
Write-Host "Created schema query script at $schemaQueryPath"

# Prompt to run the schema query
Write-Host "`nIMPORTANT: You need to run the schema query against your P21 database."
Write-Host "Use SQL Server Management Studio or another tool to run the query in $schemaQueryPath"
Write-Host "Save the results as a CSV file to $schemaOutputPath"
Write-Host "Then run this script again with the -ContinueFromSchema parameter"

# Check if the schema file exists
if (Test-Path -Path $schemaOutputPath) {
    Write-Host "Found schema file at $schemaOutputPath"
    
    # Read the schema file
    $schemaData = Import-Csv -Path $schemaOutputPath
    
    # Create a hashtable to store table names and their schemas
    $schemaInfo = @{}
    
    foreach ($row in $schemaData) {
        $tableName = $row.TableName
        $schemaName = $row.SchemaName
        
        if (-not $schemaInfo.ContainsKey($tableName)) {
            $schemaInfo[$tableName] = $schemaName
        }
    }
    
    Write-Host "Loaded schema information for $($schemaInfo.Count) tables"
    
    # Function to update SQL expression with proper schema prefixes and WITH (NOLOCK) hints
    function Update-P21SqlSyntax {
        param (
            [string]$sqlExpression,
            [hashtable]$schemaInfo
        )
        
        $updatedSql = $sqlExpression
        
        # Add schema prefixes if missing
        foreach ($tableName in $schemaInfo.Keys) {
            $schema = $schemaInfo[$tableName]
            $pattern = "(?<!\w|\.)$tableName\b(?!\.\w)"
            $updatedSql = $updatedSql -replace $pattern, "$schema.$tableName"
        }
        
        # Add WITH (NOLOCK) hints if missing
        foreach ($tableName in $schemaInfo.Keys) {
            $schema = $schemaInfo[$tableName]
            $pattern = "$schema\.$tableName\b(?!\s+WITH\s+\(NOLOCK\))"
            $updatedSql = $updatedSql -replace $pattern, "$schema.$tableName WITH (NOLOCK)"
        }
        
        # Ensure GETDATE() is used for current date
        $updatedSql = $updatedSql -replace "\bCURRENT_TIMESTAMP\b", "GETDATE()"
        $updatedSql = $updatedSql -replace "\bCURRENT_DATE\b", "CAST(GETDATE() AS DATE)"
        
        # Ensure proper date functions
        $updatedSql = $updatedSql -replace "\bDATEADD\(\s*'(\w+)'\s*,", "DATEADD($1,"
        
        return $updatedSql
    }
    
    # Process entries to update SQL expressions
    $entriesUpdated = 0
    $sqlExpressionsUpdated = 0
    $updatedLines = $lines.Clone()
    
    foreach ($entry in $p21Entries) {
        if ($entry.SqlExpression -and $entry.SqlLine -ge 0) {
            $originalSql = $entry.SqlExpression
            $updatedSql = Update-P21SqlSyntax -sqlExpression $originalSql -schemaInfo $schemaInfo
            
            if ($updatedSql -ne $originalSql) {
                Write-Host "`nUpdating SQL expression for ID $($entry.Id):" -ForegroundColor Yellow
                Write-Host "Original: $originalSql" -ForegroundColor Red
                Write-Host "Updated: $updatedSql" -ForegroundColor Green
                
                $lineIndex = $entry.StartLine + $entry.SqlLine + 1
                $updatedLines[$lineIndex] = $updatedLines[$lineIndex] -replace [regex]::Escape($originalSql), $updatedSql
                
                $sqlExpressionsUpdated++
            }
        }
        
        $entriesUpdated++
    }
    
    Write-Host "`nSummary:"
    Write-Host "P21 entries processed: $entriesUpdated"
    Write-Host "SQL expressions updated: $sqlExpressionsUpdated"
    
    # Prompt to apply changes
    if ($sqlExpressionsUpdated -gt 0) {
        $applyChanges = Read-Host "Apply all changes to $filePath? (Y/N)"
        if ($applyChanges -eq "Y") {
            $updatedLines -join "`n" | Out-File -FilePath $filePath -Encoding utf8
            Write-Host "Changes applied to $filePath" -ForegroundColor Green
        } else {
            Write-Host "Changes not applied" -ForegroundColor Yellow
        }
    } else {
        Write-Host "No changes to apply" -ForegroundColor Yellow
    }
} else {
    Write-Host "Schema file not found at $schemaOutputPath" -ForegroundColor Red
    Write-Host "Please run the schema query and save the results to $schemaOutputPath"
}

Write-Host "P21 schema verification completed at $(Get-Date)"
Stop-Transcript
