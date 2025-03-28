# PowerShell script to carefully update P21 SQL expressions while preserving multiline POR expressions
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
$logPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-sql-careful-update.log"

# Start logging
Start-Transcript -Path $logPath

# Create a backup of the current file
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

# Define the new SQL expressions by chart group
$sqlUpdates = @{
    "AR Aging" = @{
        "tableName" = "dbo.ARINV WITH (NOLOCK)"
        "expression" = "SELECT AVG(DATEDIFF(DAY, DUE_DATE, GETDATE())) as value FROM dbo.ARINV WITH (NOLOCK) WHERE AR_DATE <= GETDATE() AND DATEDIFF(DAY, DUE_DATE, GETDATE()) > 0"
    }
    "Accounts" = @{
        "tableName" = "dbo.APINV WITH (NOLOCK)"
        "expression" = "SELECT SUM(AP_AMOUNT) as value FROM dbo.APINV WITH (NOLOCK) WHERE AP_DATE <= GETDATE()"
    }
    "Customer Metrics" = @{
        "tableName" = "dbo.SOMAST WITH (NOLOCK)"
        "expression" = "SELECT COUNT(DISTINCT so.CustID) as value FROM dbo.SOMAST so WITH (NOLOCK) WHERE so.SO_DATE <= GETDATE() AND so.CustID NOT IN (SELECT DISTINCT so_prev.CustID FROM dbo.SOMAST so_prev WITH (NOLOCK) WHERE so_prev.SO_DATE BETWEEN DATEADD(MONTH, -12, GETDATE()) AND DATEADD(DAY, -1, GETDATE()))"
    }
    "Daily Orders" = @{
        "tableName" = "dbo.SOMAST WITH (NOLOCK)"
        "expression" = "SELECT COUNT(*) as value FROM dbo.SOMAST WITH (NOLOCK) WHERE SO_DATE = CAST(GETDATE() AS DATE)"
    }
    "Historical Data" = @{
        "tableName" = "dbo.SOMAST WITH (NOLOCK)"
        "expression" = "SELECT SUM(Total) as value FROM dbo.SOMAST WITH (NOLOCK) WHERE SO_DATE <= GETDATE()"
    }
    "Inventory" = @{
        "tableName" = "dbo.ICINV WITH (NOLOCK)"
        "expression" = "SELECT SUM(ONHandQty) as value FROM dbo.ICINV WITH (NOLOCK) WHERE INV_DATE <= GETDATE()"
    }
    "Key Metrics" = @{
        "tableName" = "dbo.SOMAST WITH (NOLOCK)"
        "expression" = "SELECT AVG(Total) as value FROM dbo.SOMAST WITH (NOLOCK) WHERE SO_DATE <= GETDATE()"
    }
    "Site Distribution" = @{
        "tableName" = "dbo.SOMAST WITH (NOLOCK)"
        "expression" = "SELECT COUNT(DISTINCT SiteID) as value FROM dbo.SOMAST WITH (NOLOCK) WHERE SO_DATE <= GETDATE()"
    }
    "Web Orders" = @{
        "tableName" = "dbo.SOMAST WITH (NOLOCK)"
        "expression" = "SELECT COUNT(*) as value FROM dbo.SOMAST WITH (NOLOCK) WHERE SO_DATE <= GETDATE() AND OrderChannel = 'WEB'"
    }
}

# Read the file content
$fileContent = Get-Content -Path $filePath -Raw

# Split the file content into lines
$lines = $fileContent -split "`n"

# Initialize variables to track our position in the file
$updatedLines = @()
$inEntry = $false
$currentEntry = @()
$isP21Entry = $false
$currentId = ""
$currentChartGroup = ""
$inSqlExpression = $false
$inMultilineSql = $false
$p21Count = 0
$porCount = 0
$otherCount = 0

# Process each line
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $originalLine = $line
    
    # Check if we're starting a new entry
    if ($line -match '^\s*\{') {
        $inEntry = $true
        $currentEntry = @()
        $isP21Entry = $false
        $currentId = ""
        $currentChartGroup = ""
        $inSqlExpression = $false
        $inMultilineSql = $false
    }
    
    # If we're in an entry, collect information
    if ($inEntry) {
        # Check for ID
        if ($line -match '"id":\s*"(\d+)"') {
            $currentId = $matches[1]
            # P21 entries have IDs 1-126
            if ([int]$currentId -le 126) {
                $isP21Entry = $true
            }
        }
        
        # Check for chart group
        if ($line -match '"chartGroup":\s*"([^"]+)"') {
            $currentChartGroup = $matches[1]
        }
        
        # Check for server name
        if ($line -match '"serverName":\s*"P21"') {
            $isP21Entry = $true
        }
        
        # Check if we're starting a SQL expression
        if ($line -match '"productionSqlExpression":\s*"') {
            $inSqlExpression = $true
            
            # Check if this is a multiline SQL expression (doesn't end with ")
            if (-not $line.TrimEnd().EndsWith('"')) {
                $inMultilineSql = $true
            }
            
            # If this is a P21 entry and we have an update for its chart group
            if ($isP21Entry -and $sqlUpdates.ContainsKey($currentChartGroup)) {
                # Replace the SQL expression with the new one
                $newExpression = $sqlUpdates[$currentChartGroup]["expression"]
                $line = $line -replace '"productionSqlExpression":\s*"[^"]*', "`"productionSqlExpression`": `"$newExpression"
                
                # If this was a multiline SQL expression, it's now a single line
                $inMultilineSql = $false
                $inSqlExpression = $false
                
                Write-Host "Updated SQL expression for ID $currentId in chart group '$currentChartGroup'"
                $p21Count++
            }
        }
        # If we're in a multiline SQL expression
        elseif ($inMultilineSql) {
            # Check if this line ends the SQL expression
            if ($line -match '"') {
                $inMultilineSql = $false
                $inSqlExpression = $false
            }
            
            # If this is a P21 entry that we've already updated, skip this line
            if ($isP21Entry -and $sqlUpdates.ContainsKey($currentChartGroup)) {
                $line = $null  # Mark for skipping
            }
        }
        
        # Check if we're updating the table name for a P21 entry
        if ($isP21Entry -and $line -match '"tableName":\s*"[^"]+"' -and $sqlUpdates.ContainsKey($currentChartGroup)) {
            $newTableName = $sqlUpdates[$currentChartGroup]["tableName"]
            $line = $line -replace '"tableName":\s*"[^"]+"', "`"tableName`": `"$newTableName`""
        }
        
        # Check if we're ending an entry
        if ($line -match '^\s*\},?$') {
            $inEntry = $false
            
            # Count the entry type
            if ($isP21Entry) {
                if (-not $sqlUpdates.ContainsKey($currentChartGroup)) {
                    $otherCount++
                }
            } else {
                $porCount++
            }
        }
    }
    
    # Add the line to our updated content (unless it was marked for skipping)
    if ($line -ne $null) {
        $updatedLines += $line
    }
}

# Join the updated lines back into a single string
$updatedContent = $updatedLines -join "`n"

# Write the updated content back to the file
Set-Content -Path $filePath -Value $updatedContent -NoNewline
Add-Content -Path $filePath -Value "" # Add a single newline at the end

# Verify the update
$verifyContent = Get-Content -Path $filePath -Raw
$verifyP21Count = [regex]::Matches($verifyContent, '"serverName":\s*"P21"').Count
$verifyPorCount = [regex]::Matches($verifyContent, '"serverName":\s*"POR"').Count
$verifyTotalCount = [regex]::Matches($verifyContent, '"id":\s*"[0-9]+"').Count

Write-Host "`nVerification:"
Write-Host "Total entries found: $verifyTotalCount (expected: 174)"
Write-Host "P21 entries found: $verifyP21Count (expected: 126)"
Write-Host "POR entries found: $verifyPorCount (expected: 48)"

Write-Host "`nSummary:"
Write-Host "P21 entries updated: $p21Count"
Write-Host "POR entries preserved: $porCount"
Write-Host "Other entries: $otherCount"

Write-Host "P21 SQL expression update completed!"
Stop-Transcript
