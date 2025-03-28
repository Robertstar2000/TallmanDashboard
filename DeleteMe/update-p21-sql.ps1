# PowerShell script to update P21 SQL expressions in the complete-chart-data.ts file
# This script will:
# 1. Read the existing chart data from complete-chart-data.ts
# 2. Group the entries by chart group
# 3. Allow you to review and update SQL expressions for each chart group
# 4. Ensure proper P21 SQL syntax (with schema prefixes, WITH (NOLOCK) hints, etc.)
# 5. Write the updated data back to complete-chart-data.ts

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-sql-update.log"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting P21 chart data update at $(Get-Date)"

# Create a backup of the original file
Copy-Item -Path $filePath -Destination $backupPath
Write-Host "Created backup at $backupPath"

# Read the file content
$content = Get-Content -Path $filePath -Raw

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

# Extract chart groups using regex
$chartGroupRegex = [regex]::new('"chartGroup": "([^"]+)"')
$chartGroupMatches = $chartGroupRegex.Matches($content)
$chartGroups = @()

foreach ($match in $chartGroupMatches) {
    $groupName = $match.Groups[1].Value
    if ($groupName -notin $chartGroups) {
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

# Create a temporary file for processing
$tempFile = [System.IO.Path]::GetTempFileName()

# Process the file line by line
$inSelectedGroup = $false
$inP21Entry = $false
$lineNumber = 0
$updatedContent = ""
$entriesFound = 0
$expressionsChecked = 0
$expressionsUpdated = 0

Write-Host "Starting to process file line by line..."

Get-Content -Path $filePath | ForEach-Object {
    $line = $_
    $lineNumber++
    
    # Check if we're entering a new entry
    if ($line -match "^\s*\{") {
        $inSelectedGroup = $false
        $inP21Entry = $false
        Write-Host "Line ${lineNumber}: New entry detected" -ForegroundColor Gray
    }
    # Check if we're in the selected chart group
    elseif ($line -match [regex]::Escape("`"chartGroup`": `"") + [regex]::Escape("${selectedGroup}") + [regex]::Escape("`"")) {
        $inSelectedGroup = $true
        $entriesFound++
        Write-Host "Line ${lineNumber}: Found entry in chart group '${selectedGroup}'" -ForegroundColor Green
    }
    # Check if we're in a P21 entry (IDs 1-126)
    elseif ($line -match [regex]::Escape("`"id`": `"") + "(\d+)" + [regex]::Escape("`"")) {
        $id = [int]$matches[1]
        if ($id -le 126) {
            $inP21Entry = $true
            Write-Host "Line ${lineNumber}: Found P21 entry with ID ${id}" -ForegroundColor Cyan
        } else {
            $inP21Entry = $false
            Write-Host "Line ${lineNumber}: Found non-P21 entry with ID ${id}" -ForegroundColor Gray
        }
    }
    # Check if we're at a SQL expression that needs to be updated
    elseif ($inSelectedGroup -and $inP21Entry -and $line -match [regex]::Escape("`"productionSqlExpression`": `"") + "(.*)" + [regex]::Escape("`"")) {
        $sqlExpression = $matches[1]
        $expressionsChecked++
        Write-Host "Line ${lineNumber}: Checking SQL expression in selected chart group" -ForegroundColor Yellow
        Write-Host "SQL: ${sqlExpression}" -ForegroundColor Yellow
        
        $updatedSql = Update-P21SqlSyntax -sqlExpression $sqlExpression
        
        if ($updatedSql -ne $sqlExpression) {
            $expressionsUpdated++
            Write-Host "Found SQL expression to update at line ${lineNumber}" -ForegroundColor Magenta
            Write-Host "Original: ${sqlExpression}" -ForegroundColor Red
            Write-Host "Updated: ${updatedSql}" -ForegroundColor Green
            
            $acceptChanges = Read-Host "Accept these changes? (Y/N)"
            if ($acceptChanges -eq "Y") {
                $line = $line -replace [regex]::Escape($sqlExpression), $updatedSql
                Write-Host "Changes accepted" -ForegroundColor Green
            } else {
                Write-Host "Changes rejected" -ForegroundColor Red
            }
        } else {
            Write-Host "No changes needed for this SQL expression" -ForegroundColor Gray
        }
    }
    
    $updatedContent += "$line`n"
}

Write-Host "`nSummary:"
Write-Host "Entries found in '${selectedGroup}' chart group: ${entriesFound}"
Write-Host "SQL expressions checked: ${expressionsChecked}"
Write-Host "SQL expressions updated: ${expressionsUpdated}"

# Write the updated content to the temporary file
$updatedContent | Out-File -FilePath $tempFile -Encoding utf8

# Prompt to apply changes
$applyChanges = Read-Host "Apply all changes to $filePath? (Y/N)"
if ($applyChanges -eq "Y") {
    Copy-Item -Path $tempFile -Destination $filePath -Force
    Write-Host "Changes applied to $filePath"
} else {
    Write-Host "Changes not applied"
}

# Clean up
Remove-Item -Path $tempFile -Force

Write-Host "P21 chart data update completed at $(Get-Date)"
Stop-Transcript
