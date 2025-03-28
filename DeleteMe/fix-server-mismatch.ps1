# PowerShell script to fix server name mismatches in SQL expressions
# This script will update entries where the serverName doesn't match the SQL syntax

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\fix-server-mismatch.log"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting server name mismatch fix at $(Get-Date)"

# Backup the original file
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

# Define POR SQL templates for different chart groups
$porSqlTemplates = @{
    "Accounts" = "SELECT Sum(Amount) as value FROM Transactions WHERE TransactionType = 'PLACEHOLDER' AND Month(TransactionDate) = PLACEHOLDER AND Year(TransactionDate) = Year(Date())"
    "Customer Metrics" = "SELECT Count(*) as value FROM Customers WHERE Status = 'PLACEHOLDER' AND Month(CreatedDate) = PLACEHOLDER AND Year(CreatedDate) = Year(Date())"
    "Inventory" = "SELECT Count(*) as value FROM Inventory WHERE Department = 'PLACEHOLDER'"
}

# Read the file content
$fileContent = Get-Content -Path $filePath -Raw

# Define regex pattern to find entries
$pattern = '(\s*\{\s*"id":\s*"(\d+)",\s*"DataPoint":\s*"([^"]+)",\s*"chartGroup":\s*"([^"]+)",\s*"variableName":\s*"([^"]+)",\s*"serverName":\s*"(P21|POR)",\s*"value":\s*"[^"]+",\s*"tableName":\s*"([^"]+)",\s*"calculation":\s*"[^"]+",\s*"productionSqlExpression":\s*")([^"]+)(")'

# Process the file
$updatedContent = $fileContent -replace $pattern, {
    param($match)
    
    $fullMatch = $match.Groups[0].Value
    $prefix = $match.Groups[1].Value
    $id = [int]$match.Groups[2].Value
    $dataPoint = $match.Groups[3].Value
    $chartGroup = $match.Groups[4].Value
    $variableName = $match.Groups[5].Value
    $serverName = $match.Groups[6].Value
    $tableName = $match.Groups[7].Value
    $sqlExpression = $match.Groups[8].Value
    $suffix = $match.Groups[9].Value
    
    # Check if this is a POR entry with P21 SQL syntax
    if ($serverName -eq "POR" -and ($sqlExpression -match "dbo\." -or $sqlExpression -match "WITH \(NOLOCK\)" -or $sqlExpression -match "GETDATE\(\)")) {
        Write-Host "Fixing ID $id - $dataPoint (POR entry with P21 SQL syntax)"
        
        # Extract month from data point if available
        $month = 0
        if ($dataPoint -match "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)") {
            $monthName = $matches[1]
            switch ($monthName) {
                "Jan" { $month = 1 }
                "Feb" { $month = 2 }
                "Mar" { $month = 3 }
                "Apr" { $month = 4 }
                "May" { $month = 5 }
                "Jun" { $month = 6 }
                "Jul" { $month = 7 }
                "Aug" { $month = 8 }
                "Sep" { $month = 9 }
                "Oct" { $month = 10 }
                "Nov" { $month = 11 }
                "Dec" { $month = 12 }
            }
        }
        
        # Generate appropriate POR SQL based on chart group
        $newSql = ""
        if ($porSqlTemplates.ContainsKey($chartGroup)) {
            $template = $porSqlTemplates[$chartGroup]
            $placeholder = $variableName -replace ", .*$", ""
            $newSql = $template -replace "PLACEHOLDER", $placeholder
            if ($month -gt 0) {
                $newSql = $newSql -replace "PLACEHOLDER", $month
            }
        } else {
            # Default POR SQL for other chart groups
            $newSql = "SELECT Count(*) as value FROM Rentals WHERE Status = 'Active'"
            if ($month -gt 0) {
                $newSql += " AND Month(CreatedDate) = $month AND Year(CreatedDate) = Year(Date())"
            }
        }
        
        # Update tableName to match POR conventions
        $newTableName = "Rentals"
        if ($chartGroup -eq "Inventory") {
            $newTableName = "Inventory"
        } elseif ($chartGroup -eq "Accounts") {
            $newTableName = "Transactions"
        } elseif ($chartGroup -eq "Customer Metrics") {
            $newTableName = "Customers"
        }
        
        # Replace the tableName in the prefix
        $prefix = $prefix -replace "\"tableName\":\s*\"[^\"]+\"", "\"tableName\": \"$newTableName\""
        
        return $prefix + $newSql + $suffix
    }
    
    # Return the original match if no changes needed
    return $fullMatch
}

# Write the updated content back to the file
Set-Content -Path $filePath -Value $updatedContent

# Verify the changes
Write-Host "`nVerifying changes..."
$updatedFileContent = Get-Content -Path $filePath -Raw
$entries = [regex]::Matches($updatedFileContent, '{\s*"id":\s*"(\d+)".*?"serverName":\s*"(P21|POR)".*?"productionSqlExpression":\s*"([^"]+)"', [System.Text.RegularExpressions.RegexOptions]::Singleline)

$totalP21 = 0
$totalPOR = 0
$mismatchedEntries = 0

foreach ($entry in $entries) {
    $id = [int]$entry.Groups[1].Value
    $server = $entry.Groups[2].Value
    $sql = $entry.Groups[3].Value
    
    if ($server -eq "P21") {
        $totalP21++
        if (-not ($sql -match "dbo\." -and $sql -match "WITH \(NOLOCK\)" -and $sql -match "GETDATE\(\)")) {
            $mismatchedEntries++
            Write-Host "ID $id still has mismatched SQL for P21: $sql" -ForegroundColor Red
        }
    } elseif ($server -eq "POR") {
        $totalPOR++
        if ($sql -match "dbo\." -or $sql -match "WITH \(NOLOCK\)" -or $sql -match "GETDATE\(\)") {
            $mismatchedEntries++
            Write-Host "ID $id still has mismatched SQL for POR: $sql" -ForegroundColor Red
        }
    }
}

# Write summary
Write-Host "`nSummary after fixes:"
Write-Host "Total P21 entries: $totalP21"
Write-Host "Total POR entries: $totalPOR"
Write-Host "Entries still mismatched: $mismatchedEntries"

if ($mismatchedEntries -eq 0) {
    Write-Host "`nAll entries now have properly matched server names and SQL syntax!" -ForegroundColor Green
} else {
    Write-Host "`nSome entries still have mismatched server names and SQL syntax." -ForegroundColor Yellow
}

Write-Host "Server name mismatch fix completed at $(Get-Date)"
Stop-Transcript
