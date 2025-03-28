# PowerShell script to verify P21 table names against the actual database schema
# and update SQL expressions with proper schema prefixes and WITH (NOLOCK) hints

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-schema-verification.log"
$schemaQueryPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\get-p21-schema.sql"
$schemaOutputPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-schema.csv"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting P21 schema verification at $(Get-Date)"

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

# Extract all SQL expressions
$sqlExpressions = @()
$regex = [regex]'"productionSqlExpression": "([^"]*)"'
$matches = $regex.Matches($fileContent)

foreach ($match in $matches) {
    $sqlExpression = $match.Groups[1].Value
    $sqlExpressions += $sqlExpression
}

Write-Host "Found $($sqlExpressions.Count) SQL expressions in the file"

# Extract all table names from SQL expressions
$allTableNames = @()

foreach ($sqlExpression in $sqlExpressions) {
    $tableNames = Get-TableNames -sqlExpression $sqlExpression
    
    foreach ($tableName in $tableNames) {
        if ($allTableNames -notcontains $tableName) {
            $allTableNames += $tableName
        }
    }
}

Write-Host "Extracted $($allTableNames.Count) unique table names from SQL expressions"
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

# Create a function to update SQL expressions with proper schema prefixes and WITH (NOLOCK) hints
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
    
    # Process the file to update SQL expressions
    $updatedContent = $fileContent
    $expressionsUpdated = 0
    
    foreach ($match in $matches) {
        $originalSql = $match.Groups[1].Value
        $updatedSql = Update-P21SqlSyntax -sqlExpression $originalSql -schemaInfo $schemaInfo
        
        if ($updatedSql -ne $originalSql) {
            Write-Host "`nUpdating SQL expression:" -ForegroundColor Yellow
            Write-Host "Original: $originalSql" -ForegroundColor Red
            Write-Host "Updated: $updatedSql" -ForegroundColor Green
            
            $updatedContent = $updatedContent -replace [regex]::Escape("`"productionSqlExpression`": `"$originalSql`""), "`"productionSqlExpression`": `"$updatedSql`""
            $expressionsUpdated++
        }
    }
    
    Write-Host "`nSummary:"
    Write-Host "SQL expressions checked: $($sqlExpressions.Count)"
    Write-Host "SQL expressions updated: $expressionsUpdated"
    
    # Prompt to apply changes
    if ($expressionsUpdated -gt 0) {
        $applyChanges = Read-Host "Apply all changes to $filePath? (Y/N)"
        if ($applyChanges -eq "Y") {
            $updatedContent | Out-File -FilePath $filePath -Encoding utf8
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
