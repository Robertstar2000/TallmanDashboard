# PowerShell script to verify and update P21 SQL expressions in the complete-chart-data.ts file
# This script focuses on ensuring proper table references with schema prefixes and WITH (NOLOCK) hints
# It processes only P21 expressions (IDs 1-126)

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-tables-verification.log"
$tempFile = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.tmp"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting P21 table verification at $(Get-Date)"

# Create a backup of the original file
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at ${backupPath}"

# Common P21 tables that should have schema prefixes and NOLOCK hints
$p21Tables = @(
    'oe_hdr', 'oe_line', 'invoice_hdr', 'invoice_line', 
    'customer', 'inv_mast', 'ar_open_items', 'ap_open_items',
    'vendor', 'po_hdr', 'po_line', 'gl_detail', 'gl_account',
    'contact', 'address', 'territory', 'salesperson', 'branch',
    'inv_loc', 'inv_lot', 'inv_serial', 'inv_trans', 'inv_price'
)

# Function to update SQL expression with proper P21 syntax
function Update-P21SqlSyntax {
    param (
        [string]$sqlExpression
    )
    
    $updatedSql = $sqlExpression
    
    # Add schema prefixes if missing
    foreach ($table in $p21Tables) {
        # Only replace if the table name is not already prefixed with a schema
        $pattern = "(?<!\w|\.)$table\b(?!\.\w)"
        $updatedSql = $updatedSql -replace $pattern, "dbo.$table"
    }
    
    # Add WITH (NOLOCK) hints if missing
    foreach ($table in $p21Tables) {
        # Only add NOLOCK if the table has a schema prefix but no NOLOCK hint
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

# Read the file content and process it line by line
$fileContent = Get-Content -Path $filePath
$updatedContent = @()
$inEntry = $false
$currentEntry = @{}
$totalEntries = 0
$p21Entries = 0
$sqlExpressionsUpdated = 0

foreach ($line in $fileContent) {
    $currentLine = $line
    
    # Check if we're entering a new entry
    if ($line -match '^\s*\{') {
        $inEntry = $true
        $currentEntry = @{
            Id = $null
            IsP21 = $false
            SqlLine = $null
            SqlExpression = $null
        }
    }
    # Check if we're exiting an entry
    elseif ($inEntry -and $line -match '^\s*\},?') {
        $inEntry = $false
        $totalEntries++
        
        if ($currentEntry.IsP21) {
            $p21Entries++
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
            Write-Host "Found P21 entry with ID ${id}" -ForegroundColor Cyan
        }
    }
    # Check for SQL expression in P21 entries
    elseif ($inEntry -and $currentEntry.IsP21 -and $line -match '"productionSqlExpression":\s*"(.*)"') {
        $sqlExpression = $matches[1]
        $currentEntry.SqlExpression = $sqlExpression
        $currentEntry.SqlLine = $true
        
        # Update the SQL expression
        $updatedSql = Update-P21SqlSyntax -sqlExpression $sqlExpression
        
        # If the SQL expression was updated, replace it in the current line
        if ($updatedSql -ne $sqlExpression) {
            Write-Host "Updating SQL expression for ID ${currentEntry.Id}:" -ForegroundColor Yellow
            Write-Host "Original: ${sqlExpression}" -ForegroundColor Red
            Write-Host "Updated: ${updatedSql}" -ForegroundColor Green
            
            $currentLine = $line -replace [regex]::Escape($sqlExpression), $updatedSql
            $sqlExpressionsUpdated++
        }
    }
    
    # Add the current line to the updated content
    $updatedContent += $currentLine
}

# Write summary
Write-Host "`nSummary:"
Write-Host "Total entries: ${totalEntries}"
Write-Host "P21 entries: ${p21Entries}"
Write-Host "SQL expressions updated: ${sqlExpressionsUpdated}"

# Write the updated content to the file
if ($sqlExpressionsUpdated -gt 0) {
    $applyChanges = Read-Host "Apply all changes to ${filePath}? (Y/N)"
    if ($applyChanges -eq "Y") {
        $updatedContent | Out-File -FilePath $filePath -Encoding utf8
        Write-Host "Changes applied to ${filePath}" -ForegroundColor Green
    } else {
        Write-Host "Changes not applied" -ForegroundColor Yellow
    }
} else {
    Write-Host "No changes to apply" -ForegroundColor Yellow
}

Write-Host "P21 table verification completed at $(Get-Date)"
Stop-Transcript
