# PowerShell script to update P21 SQL expressions in the complete-chart-data.ts file
# This script processes one chart group at a time, allowing for manual review of SQL expression updates

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-chart-group-update.log"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting P21 chart data update at $(Get-Date)"

# Create a backup of the original file
Copy-Item -Path $filePath -Destination $backupPath
Write-Host "Created backup at $backupPath"

# Function to update SQL expression with proper P21 syntax
function Update-P21SqlSyntax {
    param (
        [string]$sqlExpression
    )
    
    # Ensure table names have schema prefixes
    $commonTables = @(
        'oe_hdr', 'oe_line', 'invoice_hdr', 'invoice_line', 
        'customer', 'inv_mast', 'ar_open_items', 'ap_open_items',
        'vendor', 'po_hdr', 'po_line', 'gl_detail'
    )
    
    $updatedSql = $sqlExpression
    
    # Add schema prefixes if missing
    foreach ($table in $commonTables) {
        $pattern = "(?<!\w|\.)$table\b(?!\.\w)"
        $updatedSql = $updatedSql -replace $pattern, "dbo.$table"
    }
    
    # Add WITH (NOLOCK) hints if missing
    foreach ($table in $commonTables) {
        $pattern = "dbo\.$table\b(?!\s+WITH\s+\(NOLOCK\))"
        $updatedSql = $updatedSql -replace $pattern, "dbo.$table WITH (NOLOCK)"
    }
    
    # Ensure GETDATE() is used for current date
    $updatedSql = $updatedSql -replace "\bCURRENT_TIMESTAMP\b", "GETDATE()"
    $updatedSql = $updatedSql -replace "\bCURRENT_DATE\b", "CAST(GETDATE() AS DATE)"
    
    # Ensure proper date functions
    $updatedSql = $updatedSql -replace "\bDATEADD\(\s*'(\w+)'\s*,", "DATEADD($1,"
    
    return $updatedSql
}

# Read the file content
$fileContent = Get-Content -Path $filePath -Raw

# Extract all chart groups
$chartGroups = @()
$regex = [regex]'"chartGroup": "([^"]+)"'
$matches = $regex.Matches($fileContent)

foreach ($match in $matches) {
    $groupName = $match.Groups[1].Value
    if ($chartGroups -notcontains $groupName) {
        $chartGroups += $groupName
    }
}

Write-Host "Found chart groups: $($chartGroups -join ', ')"

# Prompt for chart group to process
Write-Host "Available chart groups:"
for ($i = 0; $i -lt $chartGroups.Count; $i++) {
    Write-Host "$($i+1). $($chartGroups[$i])"
}

$selectedIndex = [int](Read-Host "Enter the number of the chart group to process (1-$($chartGroups.Count))")
$selectedGroup = $chartGroups[$selectedIndex - 1]

Write-Host "Processing chart group: $selectedGroup"

# Parse the file content to extract entries
$entries = @()
$currentEntry = $null
$inEntry = $false
$lines = $fileContent -split "`n"

for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    
    # Start of a new entry
    if ($line -match '^\s*\{') {
        $inEntry = $true
        $currentEntry = @{
            Lines = @()
            StartLine = $i
            ChartGroup = ""
            Id = ""
            SqlExpression = ""
            SqlLine = -1
        }
    }
    # End of an entry
    elseif ($inEntry -and $line -match '^\s*\},?') {
        $inEntry = $false
        if ($currentEntry.ChartGroup -eq $selectedGroup -and [int]$currentEntry.Id -le 126) {
            $entries += $currentEntry
        }
        $currentEntry = $null
    }
    # Inside an entry
    elseif ($inEntry) {
        $currentEntry.Lines += $line
        
        # Extract chart group
        if ($line -match '"chartGroup": "([^"]+)"') {
            $currentEntry.ChartGroup = $matches[1]
        }
        # Extract ID
        elseif ($line -match '"id": "(\d+)"') {
            $currentEntry.Id = $matches[1]
        }
        # Extract SQL expression
        elseif ($line -match '"productionSqlExpression": "([^"]*)"') {
            $currentEntry.SqlExpression = $matches[1]
            $currentEntry.SqlLine = $currentEntry.Lines.Count - 1
        }
    }
}

Write-Host "Found $($entries.Count) entries in chart group '$selectedGroup' for P21 (IDs 1-126)"

# Process each entry
$entriesUpdated = 0
$sqlExpressionsUpdated = 0

foreach ($entry in $entries) {
    Write-Host "`nProcessing entry ID: $($entry.Id)" -ForegroundColor Cyan
    
    if ($entry.SqlExpression -and $entry.SqlLine -ge 0) {
        $originalSql = $entry.SqlExpression
        $updatedSql = Update-P21SqlSyntax -sqlExpression $originalSql
        
        if ($updatedSql -ne $originalSql) {
            Write-Host "Found SQL expression to update:" -ForegroundColor Yellow
            Write-Host "Original: $originalSql" -ForegroundColor Red
            Write-Host "Updated: $updatedSql" -ForegroundColor Green
            
            $acceptChanges = Read-Host "Accept these changes? (Y/N)"
            if ($acceptChanges -eq "Y") {
                $entry.Lines[$entry.SqlLine] = $entry.Lines[$entry.SqlLine] -replace [regex]::Escape($originalSql), $updatedSql
                $sqlExpressionsUpdated++
                Write-Host "Changes accepted" -ForegroundColor Green
            } else {
                Write-Host "Changes rejected" -ForegroundColor Red
            }
        } else {
            Write-Host "No changes needed for this SQL expression" -ForegroundColor Gray
        }
    } else {
        Write-Host "No SQL expression found in this entry" -ForegroundColor Yellow
    }
    
    $entriesUpdated++
}

Write-Host "`nSummary:"
Write-Host "Entries processed: $entriesUpdated"
Write-Host "SQL expressions updated: $sqlExpressionsUpdated"

# Rebuild the file content with updated entries
if ($sqlExpressionsUpdated -gt 0) {
    $updatedFileContent = @()
    $currentLine = 0
    
    foreach ($entry in $entries) {
        # Add lines before this entry
        while ($currentLine -lt $entry.StartLine) {
            $updatedFileContent += $lines[$currentLine]
            $currentLine++
        }
        
        # Add the updated entry lines
        $updatedFileContent += $lines[$currentLine] # Opening brace
        $currentLine++
        
        foreach ($line in $entry.Lines) {
            $updatedFileContent += $line
            $currentLine++
        }
        
        # Skip the closing brace as it will be added in the next iteration
        $updatedFileContent += $lines[$currentLine] # Closing brace
        $currentLine++
    }
    
    # Add remaining lines
    while ($currentLine -lt $lines.Length) {
        $updatedFileContent += $lines[$currentLine]
        $currentLine++
    }
    
    # Prompt to apply changes
    $applyChanges = Read-Host "Apply all changes to $filePath? (Y/N)"
    if ($applyChanges -eq "Y") {
        $updatedFileContent -join "`n" | Out-File -FilePath $filePath -Encoding utf8
        Write-Host "Changes applied to $filePath" -ForegroundColor Green
    } else {
        Write-Host "Changes not applied" -ForegroundColor Yellow
    }
} else {
    Write-Host "No changes to apply" -ForegroundColor Yellow
}

Write-Host "P21 chart data update completed at $(Get-Date)"
Stop-Transcript
