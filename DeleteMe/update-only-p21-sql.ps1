# PowerShell script to update ONLY P21 SQL expressions in the complete-chart-data.ts file
# This script will preserve POR elements and only update entries where serverName is "P21"

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-only-updates.log"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting P21-only SQL expression updates at $(Get-Date)"

# Create a backup of the original file
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
$fileContent = Get-Content -Path $filePath

# Process the file line by line
$updatedContent = @()
$inEntry = $false
$currentEntry = @{
    Id = $null
    ChartGroup = ""
    ServerName = ""
    IsP21Server = $false
    SqlLineFound = $false
    TableLineFound = $false
}
$totalEntries = 0
$p21Entries = 0
$updatedEntries = 0

for ($i = 0; $i -lt $fileContent.Count; $i++) {
    $line = $fileContent[$i]
    $updatedLine = $line
    
    # Check if we're entering a new entry
    if ($line -match '^\s*\{') {
        $inEntry = $true
        $currentEntry = @{
            Id = $null
            ChartGroup = ""
            ServerName = ""
            IsP21Server = $false
            SqlLineFound = $false
            TableLineFound = $false
        }
    }
    # Check if we're exiting an entry
    elseif ($inEntry -and $line -match '^\s*\},?') {
        $inEntry = $false
        $totalEntries++
        
        if ($currentEntry.IsP21Server) {
            $p21Entries++
        }
        
        $currentEntry = @{
            Id = $null
            ChartGroup = ""
            ServerName = ""
            IsP21Server = $false
            SqlLineFound = $false
            TableLineFound = $false
        }
    }
    # Check for ID
    elseif ($inEntry -and $line -match '"id":\s*"(\d+)"') {
        $id = [int]$matches[1]
        $currentEntry.Id = $id
    }
    # Check for chart group
    elseif ($inEntry -and $line -match '"chartGroup":\s*"(.*?)"') {
        $chartGroup = $matches[1]
        $currentEntry.ChartGroup = $chartGroup
    }
    # Check for server name
    elseif ($inEntry -and $line -match '"serverName":\s*"(.*?)"') {
        $serverName = $matches[1]
        $currentEntry.ServerName = $serverName
        if ($serverName -eq "P21") {
            $currentEntry.IsP21Server = $true
        }
    }
    # Update table name if this is a P21 entry
    elseif ($inEntry -and $currentEntry.IsP21Server -and $line -match '"tableName":\s*"(.*?)"') {
        $chartGroup = $currentEntry.ChartGroup
        if ($sqlUpdates.ContainsKey($chartGroup)) {
            $newTableName = $sqlUpdates[$chartGroup]["tableName"]
            $updatedLine = $line -replace '"tableName":\s*"(.*?)"', "`"tableName`": `"$newTableName`""
            $currentEntry.TableLineFound = $true
        }
    }
    # Update SQL expression if this is a P21 entry
    elseif ($inEntry -and $currentEntry.IsP21Server -and $line -match '"productionSqlExpression":\s*"(.*?)"') {
        $chartGroup = $currentEntry.ChartGroup
        if ($sqlUpdates.ContainsKey($chartGroup)) {
            $newExpression = $sqlUpdates[$chartGroup]["expression"]
            $updatedLine = $line -replace '"productionSqlExpression":\s*"(.*?)"', "`"productionSqlExpression`": `"$newExpression`""
            $currentEntry.SqlLineFound = $true
            $updatedEntries++
            
            Write-Host "Updated SQL expression for ID $($currentEntry.Id) in chart group '$chartGroup' (Server: P21)" -ForegroundColor Green
        }
    }
    
    # Add the updated line to the output
    $updatedContent += $updatedLine
}

# Write summary
Write-Host "`nSummary:"
Write-Host "Total entries: $totalEntries"
Write-Host "P21 entries: $p21Entries"
Write-Host "Updated entries: $updatedEntries"

# Write the updated content to the file
$updatedContent | Out-File -FilePath $filePath -Encoding utf8

Write-Host "Updated SQL expressions in $filePath" -ForegroundColor Green
Write-Host "P21-only SQL expression updates completed at $(Get-Date)"
Stop-Transcript
