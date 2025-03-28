# PowerShell script to map P21 SQL expressions to actual P21 database tables
# This script analyzes SQL expressions by intent and maps them to actual P21 tables

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-table-mapping.log"
$schemaQueryPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\get-p21-tables.sql"
$schemaOutputPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-tables.csv"
$mappingPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-table-mapping.csv"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting P21 table mapping at $(Get-Date)"

# Create a backup of the original file
Copy-Item -Path $filePath -Destination $backupPath
Write-Host "Created backup at $backupPath"

# Function to extract table names and context from SQL expressions
function Get-TableContext {
    param (
        [string]$sqlExpression
    )
    
    $tableContexts = @()
    
    # Extract FROM clauses
    $fromMatches = [regex]::Matches($sqlExpression, "FROM\s+(\w+(?:\.\w+)?)")
    foreach ($match in $fromMatches) {
        $tableName = $match.Groups[1].Value -replace 'dbo\.', ''
        
        # Get surrounding context (what columns are being selected, what conditions are applied)
        $selectClause = ""
        $whereClause = ""
        
        $selectMatch = [regex]::Match($sqlExpression, "SELECT\s+(.*?)\s+FROM", [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($selectMatch.Success) {
            $selectClause = $selectMatch.Groups[1].Value
        }
        
        $whereMatch = [regex]::Match($sqlExpression, "WHERE\s+(.*?)(?:ORDER BY|GROUP BY|HAVING|$)", [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($whereMatch.Success) {
            $whereClause = $whereMatch.Groups[1].Value
        }
        
        $tableContexts += [PSCustomObject]@{
            TableName = $tableName
            SelectClause = $selectClause
            WhereClause = $whereClause
            FullSQL = $sqlExpression
        }
    }
    
    # Extract JOIN clauses
    $joinMatches = [regex]::Matches($sqlExpression, "JOIN\s+(\w+(?:\.\w+)?)")
    foreach ($match in $joinMatches) {
        $tableName = $match.Groups[1].Value -replace 'dbo\.', ''
        
        # Get the ON clause for this join
        $onClause = ""
        $onMatch = [regex]::Match($sqlExpression, "JOIN\s+$tableName\s+(?:ON|USING)\s+(.*?)(?:JOIN|WHERE|ORDER BY|GROUP BY|HAVING|$)", [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($onMatch.Success) {
            $onClause = $onMatch.Groups[1].Value
        }
        
        $tableContexts += [PSCustomObject]@{
            TableName = $tableName
            SelectClause = ""
            WhereClause = $onClause
            FullSQL = $sqlExpression
        }
    }
    
    return $tableContexts
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
            ChartGroup = ""
            DataPoint = ""
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
        # Extract chart group
        elseif ($line -match '"chartGroup": "([^"]*)"') {
            $currentEntry.ChartGroup = $matches[1]
        }
        # Extract data point
        elseif ($line -match '"DataPoint": "([^"]*)"') {
            $currentEntry.DataPoint = $matches[1]
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

# Extract table contexts from P21 SQL expressions
$allTableContexts = @()

foreach ($entry in $p21Entries) {
    if ($entry.SqlExpression) {
        $tableContexts = Get-TableContext -sqlExpression $entry.SqlExpression
        
        foreach ($context in $tableContexts) {
            $context | Add-Member -MemberType NoteProperty -Name "EntryId" -Value $entry.Id
            $context | Add-Member -MemberType NoteProperty -Name "ChartGroup" -Value $entry.ChartGroup
            $context | Add-Member -MemberType NoteProperty -Name "DataPoint" -Value $entry.DataPoint
            $allTableContexts += $context
        }
    }
}

# Get unique table names
$uniqueTables = $allTableContexts | Select-Object -ExpandProperty TableName -Unique

Write-Host "Extracted $($uniqueTables.Count) unique table names from P21 SQL expressions"
Write-Host "Table names: $($uniqueTables -join ', ')"

# Create a SQL script to query the P21 database for all tables and their columns
$schemaQuery = @"
SELECT 
    t.name AS TableName,
    s.name AS SchemaName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable,
    CASE 
        WHEN pk.column_id IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END AS IsPrimaryKey,
    CASE 
        WHEN fk.parent_column_id IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END AS IsForeignKey
FROM 
    sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN sys.columns c ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    LEFT JOIN (
        SELECT ic.object_id, ic.column_id
        FROM sys.index_columns ic
        INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        WHERE i.is_primary_key = 1
    ) pk ON t.object_id = pk.object_id AND c.column_id = pk.column_id
    LEFT JOIN sys.foreign_key_columns fk ON t.object_id = fk.parent_object_id AND c.column_id = fk.parent_column_id
ORDER BY 
    t.name, c.column_id
"@

# Save the schema query to a file
$schemaQuery | Out-File -FilePath $schemaQueryPath -Encoding utf8
Write-Host "Created schema query script at $schemaQueryPath"

# Export table contexts to CSV for analysis
$allTableContexts | Export-Csv -Path $mappingPath -NoTypeInformation
Write-Host "Exported table contexts to $mappingPath for analysis"

# Prompt to run the schema query
Write-Host "`nIMPORTANT: You need to run the schema query against your P21 database."
Write-Host "Use SQL Server Management Studio or another tool to run the query in $schemaQueryPath"
Write-Host "Save the results as a CSV file to $schemaOutputPath"

# Function to suggest table mappings based on context
function Get-TableMappingSuggestions {
    param (
        [array]$tableContexts,
        [array]$schemaData
    )
    
    $mappingSuggestions = @()
    $uniqueSourceTables = $tableContexts | Select-Object -ExpandProperty TableName -Unique
    
    foreach ($sourceTable in $uniqueSourceTables) {
        $contexts = $tableContexts | Where-Object { $_.TableName -eq $sourceTable }
        $columnNames = @()
        
        # Extract column names from select and where clauses
        foreach ($context in $contexts) {
            $selectColumns = $context.SelectClause -split ',' | ForEach-Object { 
                if ($_ -match '(\w+)\s+as\s+value') {
                    $matches[1]
                } elseif ($_ -match '(\w+)\.(\w+)') {
                    $matches[2]
                } elseif ($_ -match '\b(\w+)\b') {
                    $matches[1]
                }
            }
            
            $whereColumns = $context.WhereClause -split 'AND|OR' | ForEach-Object {
                if ($_ -match '(\w+)\.(\w+)') {
                    $matches[2]
                } elseif ($_ -match '\b(\w+)\b') {
                    $matches[1]
                }
            }
            
            $columnNames += $selectColumns
            $columnNames += $whereColumns
        }
        
        # Get unique column names
        $uniqueColumnNames = $columnNames | Where-Object { $_ -and $_ -ne 'value' } | Select-Object -Unique
        
        # Group schema data by table
        $tableGroups = $schemaData | Group-Object -Property TableName
        
        # Score each potential target table
        $scoredTables = @()
        
        foreach ($tableGroup in $tableGroups) {
            $targetTable = $tableGroup.Name
            $targetColumns = $tableGroup.Group | Select-Object -ExpandProperty ColumnName
            
            # Skip system tables
            if ($targetTable -like 'sys*' -or $targetTable -like 'INFORMATION_SCHEMA*') {
                continue
            }
            
            # Calculate match score
            $matchCount = 0
            $exactNameMatch = if ($targetTable -eq $sourceTable) { 10 } else { 0 }
            $similarNameMatch = if ($targetTable -like "*$sourceTable*" -or $sourceTable -like "*$targetTable*") { 5 } else { 0 }
            
            foreach ($column in $uniqueColumnNames) {
                if ($targetColumns -contains $column) {
                    $matchCount++
                }
            }
            
            $columnMatchScore = if ($uniqueColumnNames.Count -gt 0) { ($matchCount / $uniqueColumnNames.Count) * 10 } else { 0 }
            $totalScore = $exactNameMatch + $similarNameMatch + $columnMatchScore
            
            $scoredTables += [PSCustomObject]@{
                SourceTable = $sourceTable
                TargetTable = $targetTable
                MatchScore = $totalScore
                ColumnMatchCount = $matchCount
                TotalColumns = $uniqueColumnNames.Count
                Schema = ($tableGroup.Group | Select-Object -First 1).SchemaName
            }
        }
        
        # Get top 3 suggestions
        $topSuggestions = $scoredTables | Sort-Object -Property MatchScore -Descending | Select-Object -First 3
        
        foreach ($suggestion in $topSuggestions) {
            $mappingSuggestions += [PSCustomObject]@{
                SourceTable = $sourceTable
                TargetTable = $suggestion.TargetTable
                Schema = $suggestion.Schema
                MatchScore = $suggestion.MatchScore
                ColumnMatchCount = $suggestion.ColumnMatchCount
                TotalColumns = $suggestion.TotalColumns
            }
        }
    }
    
    return $mappingSuggestions
}

# Check if the schema file exists
if (Test-Path -Path $schemaOutputPath) {
    Write-Host "Found schema file at $schemaOutputPath"
    
    # Read the schema file
    $schemaData = Import-Csv -Path $schemaOutputPath
    
    # Generate table mapping suggestions
    $mappingSuggestions = Get-TableMappingSuggestions -tableContexts $allTableContexts -schemaData $schemaData
    
    # Export mapping suggestions to CSV
    $mappingSuggestions | Export-Csv -Path "$mappingPath.suggestions.csv" -NoTypeInformation
    Write-Host "Exported mapping suggestions to $mappingPath.suggestions.csv"
    
    # Display top suggestions for each source table
    $uniqueSourceTables = $mappingSuggestions | Select-Object -ExpandProperty SourceTable -Unique
    
    Write-Host "`nTable mapping suggestions:"
    foreach ($sourceTable in $uniqueSourceTables) {
        $suggestions = $mappingSuggestions | Where-Object { $_.SourceTable -eq $sourceTable } | Sort-Object -Property MatchScore -Descending | Select-Object -First 3
        
        Write-Host "`nSource table: $sourceTable"
        foreach ($suggestion in $suggestions) {
            Write-Host "  -> $($suggestion.Schema).$($suggestion.TargetTable) (Score: $($suggestion.MatchScore), Column matches: $($suggestion.ColumnMatchCount)/$($suggestion.TotalColumns))"
        }
    }
    
    # Prompt to create a manual mapping file
    Write-Host "`nPlease review the suggestions and create a manual mapping file at $mappingPath.manual.csv"
    Write-Host "The file should have two columns: SourceTable,TargetTable"
    Write-Host "For example:"
    Write-Host "SourceTable,TargetTable,Schema"
    Write-Host "ar_open_items,ar_open_items,dbo"
    Write-Host "Rentals,rental_master,dbo"
    Write-Host "oe_hdr,oe_hdr,dbo"
    
    # Check if manual mapping file exists
    if (Test-Path -Path "$mappingPath.manual.csv") {
        Write-Host "`nFound manual mapping file at $mappingPath.manual.csv"
        
        # Read the manual mapping file
        $manualMapping = Import-Csv -Path "$mappingPath.manual.csv"
        
        # Create a hashtable for quick lookup
        $tableMapping = @{}
        foreach ($mapping in $manualMapping) {
            $tableMapping[$mapping.SourceTable] = @{
                TargetTable = $mapping.TargetTable
                Schema = $mapping.Schema
            }
        }
        
        # Function to update SQL expression with proper table names, schema prefixes, and WITH (NOLOCK) hints
        function Update-P21SqlSyntax {
            param (
                [string]$sqlExpression,
                [hashtable]$tableMapping
            )
            
            $updatedSql = $sqlExpression
            
            # Replace table names with mapped names and add schema prefixes
            foreach ($sourceTable in $tableMapping.Keys) {
                $targetTable = $tableMapping[$sourceTable].TargetTable
                $schema = $tableMapping[$sourceTable].Schema
                
                # Replace table name in FROM clause
                $pattern = "FROM\s+$sourceTable\b"
                $replacement = "FROM $schema.$targetTable"
                $updatedSql = $updatedSql -replace $pattern, $replacement
                
                # Replace table name in JOIN clause
                $pattern = "JOIN\s+$sourceTable\b"
                $replacement = "JOIN $schema.$targetTable"
                $updatedSql = $updatedSql -replace $pattern, $replacement
                
                # Replace table aliases (e.g., sourceTable.column)
                $pattern = "$sourceTable\.(\w+)"
                $replacement = "$schema.$targetTable.$1"
                $updatedSql = $updatedSql -replace $pattern, $replacement
            }
            
            # Add WITH (NOLOCK) hints if missing
            foreach ($sourceTable in $tableMapping.Keys) {
                $targetTable = $tableMapping[$sourceTable].TargetTable
                $schema = $tableMapping[$sourceTable].Schema
                
                $pattern = "$schema\.$targetTable\b(?!\s+WITH\s+\(NOLOCK\))"
                $replacement = "$schema.$targetTable WITH (NOLOCK)"
                $updatedSql = $updatedSql -replace $pattern, $replacement
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
                $updatedSql = Update-P21SqlSyntax -sqlExpression $originalSql -tableMapping $tableMapping
                
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
        Write-Host "Manual mapping file not found at $mappingPath.manual.csv" -ForegroundColor Red
        Write-Host "Please create the manual mapping file based on the suggestions"
    }
} else {
    Write-Host "Schema file not found at $schemaOutputPath" -ForegroundColor Red
    Write-Host "Please run the schema query and save the results to $schemaOutputPath"
}

Write-Host "P21 table mapping completed at $(Get-Date)"
Stop-Transcript
