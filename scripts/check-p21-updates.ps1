# PowerShell script to check if all P21 SQL expressions were updated
# This script will identify any P21 entries that haven't been updated to the new format

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-update-check.log"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting P21 update verification at $(Get-Date)"

# Define patterns to check for updated SQL expressions
$updatedTablePatterns = @(
    "dbo\.ARINV WITH \(NOLOCK\)",
    "dbo\.APINV WITH \(NOLOCK\)",
    "dbo\.SOMAST WITH \(NOLOCK\)",
    "dbo\.ICINV WITH \(NOLOCK\)"
)

# Read the file content
$fileContent = Get-Content -Path $filePath

# Process the file line by line
$inEntry = $false
$currentEntry = @{
    Id = $null
    ChartGroup = ""
    DataPoint = ""
    ServerName = ""
    IsP21Server = $false
    TableName = ""
    SqlExpression = ""
    IsUpdated = $false
}
$totalP21Entries = 0
$updatedEntries = 0
$notUpdatedEntries = @()

for ($i = 0; $i -lt $fileContent.Count; $i++) {
    $line = $fileContent[$i]
    
    # Check if we're entering a new entry
    if ($line -match '^\s*\{') {
        $inEntry = $true
        $currentEntry = @{
            Id = $null
            ChartGroup = ""
            DataPoint = ""
            ServerName = ""
            IsP21Server = $false
            TableName = ""
            SqlExpression = ""
            IsUpdated = $false
        }
    }
    # Check if we're exiting an entry
    elseif ($inEntry -and $line -match '^\s*\},?') {
        $inEntry = $false
        
        if ($currentEntry.IsP21Server) {
            $totalP21Entries++
            
            # Check if the entry was updated
            if ($currentEntry.IsUpdated) {
                $updatedEntries++
            } else {
                $notUpdatedEntries += [PSCustomObject]@{
                    Id = $currentEntry.Id
                    ChartGroup = $currentEntry.ChartGroup
                    DataPoint = $currentEntry.DataPoint
                    TableName = $currentEntry.TableName
                    SqlExpression = $currentEntry.SqlExpression
                }
            }
        }
    }
    # Check for ID
    elseif ($inEntry -and $line -match '"id":\s*"(\d+)"') {
        $id = [int]$matches[1]
        $currentEntry.Id = $id
        
        # P21 entries have IDs 1-126
        if ($id -le 126) {
            $currentEntry.IsP21Server = $true
        }
    }
    # Check for chart group
    elseif ($inEntry -and $line -match '"chartGroup":\s*"(.*?)"') {
        $chartGroup = $matches[1]
        $currentEntry.ChartGroup = $chartGroup
    }
    # Check for data point
    elseif ($inEntry -and $line -match '"DataPoint":\s*"(.*?)"') {
        $dataPoint = $matches[1]
        $currentEntry.DataPoint = $dataPoint
    }
    # Check for server name
    elseif ($inEntry -and $line -match '"serverName":\s*"(.*?)"') {
        $serverName = $matches[1]
        $currentEntry.ServerName = $serverName
        if ($serverName -eq "P21") {
            $currentEntry.IsP21Server = $true
        }
    }
    # Check for table name
    elseif ($inEntry -and $line -match '"tableName":\s*"(.*?)"') {
        $tableName = $matches[1]
        $currentEntry.TableName = $tableName
        
        # Check if the table name matches any of the updated patterns
        foreach ($pattern in $updatedTablePatterns) {
            if ($tableName -match $pattern) {
                $currentEntry.IsUpdated = $true
                break
            }
        }
    }
    # Check for SQL expression
    elseif ($inEntry -and $line -match '"productionSqlExpression":\s*"(.*?)"') {
        $sqlExpression = $matches[1]
        $currentEntry.SqlExpression = $sqlExpression
    }
}

# Write summary
Write-Host "`nSummary:"
Write-Host "Total P21 entries: $totalP21Entries"
Write-Host "Updated entries: $updatedEntries"
Write-Host "Not updated entries: $($notUpdatedEntries.Count)"

# Display not updated entries
if ($notUpdatedEntries.Count -gt 0) {
    Write-Host "`nP21 entries that haven't been updated:"
    foreach ($entry in $notUpdatedEntries) {
        Write-Host "ID: $($entry.Id), Chart Group: '$($entry.ChartGroup)', Data Point: '$($entry.DataPoint)'" -ForegroundColor Yellow
        Write-Host "  Table Name: $($entry.TableName)" -ForegroundColor Cyan
        Write-Host "  SQL Expression: $($entry.SqlExpression)" -ForegroundColor Cyan
        Write-Host ""
    }
} else {
    Write-Host "`nAll P21 entries have been updated!" -ForegroundColor Green
}

Write-Host "P21 update verification completed at $(Get-Date)"
Stop-Transcript
