# PowerShell script to update P21 SQL expressions while preserving POR entries exactly
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$tempFilePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.temp.ts"
$logPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-sql-fixed-update.log"

# Start logging
Start-Transcript -Path $logPath

# First, restore from the backup
if (Test-Path $backupPath) {
    Copy-Item -Path $backupPath -Destination $filePath -Force
    Write-Host "Restored from backup at $backupPath"
} else {
    Write-Host "Error: Backup file not found at $backupPath"
    exit 1
}

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
$content = Get-Content -Path $filePath -Raw

# Process the file line by line to identify entry boundaries
$lines = $content -split "`n"
$entries = @()
$currentEntry = ""
$inEntry = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Check if we're starting a new entry
    if ($line -match '^\s*{') {
        if ($inEntry) {
            # Add the previous entry to the list
            $entries += $currentEntry
        }
        $inEntry = $true
        $currentEntry = $line + "`n"
    }
    # Check if we're ending an entry
    elseif ($inEntry -and $line -match '^\s*}(,)?$') {
        $currentEntry += $line + "`n"
        $inEntry = $false
        $entries += $currentEntry
        $currentEntry = ""
    }
    # Add the line to the current entry
    elseif ($inEntry) {
        $currentEntry += $line + "`n"
    }
    else {
        # Lines outside of entries (header, footer, etc.)
        $entries += $line + "`n"
    }
}

# If there's a remaining entry, add it
if ($currentEntry -ne "") {
    $entries += $currentEntry
}

# Process each entry
$updatedEntries = @()
$p21Count = 0
$porCount = 0
$otherCount = 0

foreach ($entry in $entries) {
    # Check if this is a JSON object entry
    if ($entry -match '^\s*{') {
        # Check if this is a P21 entry
        if ($entry -match '"serverName":\s*"P21"') {
            # Extract the chart group
            $chartGroupMatch = [regex]::Match($entry, '"chartGroup":\s*"(.*?)"')
            if ($chartGroupMatch.Success) {
                $chartGroup = $chartGroupMatch.Groups[1].Value
                
                # Check if we have an update for this chart group
                if ($sqlUpdates.ContainsKey($chartGroup)) {
                    # Update the tableName
                    $entry = $entry -replace '"tableName":\s*"[^"]*"', "`"tableName`": `"$($sqlUpdates[$chartGroup]["tableName"])`""
                    
                    # Update the SQL expression
                    $entry = $entry -replace '"productionSqlExpression":\s*"[^"]*"', "`"productionSqlExpression`": `"$($sqlUpdates[$chartGroup]["expression"])`""
                    
                    $p21Count++
                    Write-Host "Updated P21 entry for chart group: $chartGroup"
                } else {
                    $otherCount++
                    Write-Host "No update found for chart group: $chartGroup"
                }
            } else {
                $otherCount++
                Write-Host "Could not find chart group in entry"
            }
        }
        # Check if this is a POR entry
        elseif ($entry -match '"serverName":\s*"POR"') {
            $porCount++
            # Do not modify POR entries
        }
        else {
            $otherCount++
        }
    }
    
    # Add the entry (modified or not) to the updated entries
    $updatedEntries += $entry
}

# Join all entries back together
$updatedContent = $updatedEntries -join ""

# Write the updated content to the file
Set-Content -Path $filePath -Value $updatedContent

# Verify the update
$verifyContent = Get-Content -Path $filePath -Raw
$verifyP21Count = [regex]::Matches($verifyContent, '"serverName":\s*"P21"').Count
$verifyPorCount = [regex]::Matches($verifyContent, '"serverName":\s*"POR"').Count

Write-Host "`nVerification:"
Write-Host "P21 entries found: $verifyP21Count (expected: 126)"
Write-Host "POR entries found: $verifyPorCount (expected: 48)"

Write-Host "`nSummary:"
Write-Host "P21 entries updated: $p21Count"
Write-Host "POR entries preserved: $porCount"
Write-Host "Other entries: $otherCount"

Write-Host "P21 SQL expression update completed!"
Stop-Transcript
