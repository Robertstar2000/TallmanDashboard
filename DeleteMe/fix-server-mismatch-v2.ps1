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
$fileContent = Get-Content -Path $filePath

# Initialize arrays to track changes
$updatedLines = @()
$fixedEntries = @()

# Process the file line by line
$inEntry = $false
$currentEntry = @{
    Id = $null
    ChartGroup = ""
    DataPoint = ""
    ServerName = ""
    VariableName = ""
    TableName = ""
    SqlExpression = ""
    NeedsFixing = $false
    StartLine = 0
    EndLine = 0
    Lines = @()
}

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
            VariableName = ""
            TableName = ""
            SqlExpression = ""
            NeedsFixing = $false
            StartLine = $i
            EndLine = 0
            Lines = @()
        }
        $currentEntry.Lines += $line
    }
    # Check if we're exiting an entry
    elseif ($inEntry -and $line -match '^\s*\},?') {
        $inEntry = $false
        $currentEntry.EndLine = $i
        $currentEntry.Lines += $line
        
        # Check if this entry needs fixing
        if ($currentEntry.ServerName -eq "POR" -and 
            ($currentEntry.SqlExpression -match "dbo\." -or 
             $currentEntry.SqlExpression -match "WITH \(NOLOCK\)" -or 
             $currentEntry.SqlExpression -match "GETDATE\(\)")) {
            
            Write-Host "Fixing ID $($currentEntry.Id) - $($currentEntry.DataPoint) (POR entry with P21 SQL syntax)"
            
            # Extract month from data point if available
            $month = 0
            if ($currentEntry.DataPoint -match "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)") {
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
            if ($porSqlTemplates.ContainsKey($currentEntry.ChartGroup)) {
                $template = $porSqlTemplates[$currentEntry.ChartGroup]
                $placeholder = $currentEntry.VariableName -replace ", .*$", ""
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
            if ($currentEntry.ChartGroup -eq "Inventory") {
                $newTableName = "Inventory"
            } elseif ($currentEntry.ChartGroup -eq "Accounts") {
                $newTableName = "Transactions"
            } elseif ($currentEntry.ChartGroup -eq "Customer Metrics") {
                $newTableName = "Customers"
            }
            
            # Update the lines in the entry
            $updatedEntryLines = @()
            foreach ($entryLine in $currentEntry.Lines) {
                if ($entryLine -match '"tableName":\s*"([^"]+)"') {
                    $updatedEntryLines += $entryLine -replace '"tableName":\s*"([^"]+)"', "`"tableName`": `"$newTableName`""
                }
                elseif ($entryLine -match '"productionSqlExpression":\s*"([^"]+)"') {
                    $updatedEntryLines += $entryLine -replace '"productionSqlExpression":\s*"([^"]+)"', "`"productionSqlExpression`": `"$newSql`""
                }
                else {
                    $updatedEntryLines += $entryLine
                }
            }
            
            # Add the fixed entry to our list
            $fixedEntries += @{
                Id = $currentEntry.Id
                OldSql = $currentEntry.SqlExpression
                NewSql = $newSql
                OldTableName = $currentEntry.TableName
                NewTableName = $newTableName
            }
            
            # Add the updated lines to our output
            $updatedLines += $updatedEntryLines
        }
        else {
            # No fixing needed, add the original lines
            $updatedLines += $currentEntry.Lines
        }
    }
    # Process lines within an entry
    elseif ($inEntry) {
        $currentEntry.Lines += $line
        
        # Extract information from the entry
        if ($line -match '"id":\s*"(\d+)"') {
            $currentEntry.Id = $matches[1]
        }
        elseif ($line -match '"chartGroup":\s*"([^"]+)"') {
            $currentEntry.ChartGroup = $matches[1]
        }
        elseif ($line -match '"DataPoint":\s*"([^"]+)"') {
            $currentEntry.DataPoint = $matches[1]
        }
        elseif ($line -match '"serverName":\s*"([^"]+)"') {
            $currentEntry.ServerName = $matches[1]
        }
        elseif ($line -match '"variableName":\s*"([^"]+)"') {
            $currentEntry.VariableName = $matches[1]
        }
        elseif ($line -match '"tableName":\s*"([^"]+)"') {
            $currentEntry.TableName = $matches[1]
        }
        elseif ($line -match '"productionSqlExpression":\s*"([^"]+)"') {
            $currentEntry.SqlExpression = $matches[1]
        }
    }
    else {
        # Outside of any entry, just add the line as is
        $updatedLines += $line
    }
}

# Write the updated content back to the file
Set-Content -Path $filePath -Value $updatedLines

# Write summary of changes
Write-Host "`nSummary of changes:"
Write-Host "Fixed $($fixedEntries.Count) entries with mismatched server names and SQL syntax"

if ($fixedEntries.Count -gt 0) {
    Write-Host "`nDetails of fixed entries:"
    foreach ($entry in $fixedEntries) {
        Write-Host "ID: $($entry.Id)" -ForegroundColor Green
        Write-Host "  Old Table: $($entry.OldTableName)" -ForegroundColor Yellow
        Write-Host "  New Table: $($entry.NewTableName)" -ForegroundColor Cyan
        Write-Host "  Old SQL: $($entry.OldSql)" -ForegroundColor Yellow
        Write-Host "  New SQL: $($entry.NewSql)" -ForegroundColor Cyan
        Write-Host ""
    }
}

Write-Host "Server name mismatch fix completed at $(Get-Date)"
Stop-Transcript
