# PowerShell script to update POR Overview SQL expressions in complete-chart-data.ts
# This script directly targets and updates only the POR Overview entries

$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.backup2"
$tempFilePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.temp.ts"

# Create a backup of the original file
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

# Define the correct MS Access/Jet SQL syntax for each metric type
$newRentalsSql = "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = {0} AND Year(DateCreated) = Year(Date())"
$openRentalsSql = "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out')"
$openRentalsMonthSql = "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = {0}"
$rentalValueSql = "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out')"
$rentalValueMonthSql = "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = {0}"

# Define month mappings
$monthMap = @{
    "Jan" = 1; "Feb" = 2; "Mar" = 3; "Apr" = 4; "May" = 5; "Jun" = 6;
    "Jul" = 7; "Aug" = 8; "Sep" = 9; "Oct" = 10; "Nov" = 11; "Dec" = 12
}

# Read the file content
$content = Get-Content -Path $filePath -Raw

# Count how many POR Overview entries we find
$porOverviewCount = 0
$porOverviewUpdated = 0

# Update SQL expressions for POR Overview New Rentals by month
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    $newSql = $newRentalsSql -f $monthNum
    
    # Create a pattern that matches the entire JSON object for this data point
    $pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview New Rentals, ' + $month + '"[^}]*?"productionSqlExpression":\s*")[^"]*(".*?\})'
    
    # Count matches
    $matches = [regex]::Matches($content, $pattern)
    $porOverviewCount += $matches.Count
    
    # Replace the SQL expression
    $content = $content -replace $pattern, ('$1' + $newSql + '$2')
    $porOverviewUpdated += $matches.Count
}

# Update SQL expressions for POR Overview Open Rentals by month
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    $newSql = $openRentalsMonthSql -f $monthNum
    
    # Create a pattern that matches the entire JSON object for this data point
    $pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview Open Rentals, ' + $month + '"[^}]*?"productionSqlExpression":\s*")[^"]*(".*?\})'
    
    # Count matches
    $matches = [regex]::Matches($content, $pattern)
    $porOverviewCount += $matches.Count
    
    # Replace the SQL expression
    $content = $content -replace $pattern, ('$1' + $newSql + '$2')
    $porOverviewUpdated += $matches.Count
}

# Update SQL expressions for POR Overview Rental Value by month
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    $newSql = $rentalValueMonthSql -f $monthNum
    
    # Create a pattern that matches the entire JSON object for this data point
    $pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview Rental Value, ' + $month + '"[^}]*?"productionSqlExpression":\s*")[^"]*(".*?\})'
    
    # Count matches
    $matches = [regex]::Matches($content, $pattern)
    $porOverviewCount += $matches.Count
    
    # Replace the SQL expression
    $content = $content -replace $pattern, ('$1' + $newSql + '$2')
    $porOverviewUpdated += $matches.Count
}

# Update SQL expression for POR Overview Open Rentals (total)
$pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview Open Rentals"[^}]*?"productionSqlExpression":\s*")[^"]*(".*?\})'
$matches = [regex]::Matches($content, $pattern)
$porOverviewCount += $matches.Count
$content = $content -replace $pattern, ('$1' + $openRentalsSql + '$2')
$porOverviewUpdated += $matches.Count

# Update SQL expression for POR Overview Rental Value (total)
$pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview Rental Value"[^}]*?"productionSqlExpression":\s*")[^"]*(".*?\})'
$matches = [regex]::Matches($content, $pattern)
$porOverviewCount += $matches.Count
$content = $content -replace $pattern, ('$1' + $rentalValueSql + '$2')
$porOverviewUpdated += $matches.Count

# Update tableName from "Rentals" to "Transactions" for all POR Overview entries
$pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview[^}]*?"tableName":\s*)"Rentals"'
$matches = [regex]::Matches($content, $pattern)
$rentalToTransCount = $matches.Count
$content = $content -replace $pattern, ('$1"Transactions"')

# Update lastUpdated timestamp for all POR Overview entries
$timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview[^}]*?"lastUpdated":\s*")[^"]*(")'
$matches = [regex]::Matches($content, $pattern)
$timestampUpdateCount = $matches.Count
$content = $content -replace $pattern, ('$1' + $timestamp + '$2')

# Write the updated content back to the file
Set-Content -Path $filePath -Value $content

Write-Host "Found $porOverviewCount POR Overview entries"
Write-Host "Updated $porOverviewUpdated SQL expressions"
Write-Host "Updated $rentalToTransCount tableName fields from 'Rentals' to 'Transactions'"
Write-Host "Updated $timestampUpdateCount lastUpdated timestamps"
Write-Host "POR SQL expressions updated with correct MS Access/Jet SQL syntax!"

# Let's also check for any entries that might be missing required fields
$lines = Get-Content -Path $filePath
$inDataArray = $false
$currentItem = ""
$missingFields = 0
$fixedFields = 0

# Create a temporary file for the fixed content
$fixedContent = @()

foreach ($line in $lines) {
    # Check if we're entering the data array
    if ($line -match 'export const initialSpreadsheetData: SpreadsheetRow\[\] = \[') {
        $inDataArray = $true
        $fixedContent += $line
        continue
    }
    
    # Check if we're exiting the data array
    if ($inDataArray -and $line -match '^\];') {
        $inDataArray = $false
        $fixedContent += $line
        continue
    }
    
    # Process lines within the data array
    if ($inDataArray) {
        # Add the line to the current item
        $currentItem += "$line`n"
        
        # Check if this is the end of an item
        if ($line -match '^\s*},\s*$') {
            # Check if this is a POR Overview entry
            if ($currentItem -match '"DataPoint":\s*"POR Overview') {
                $needsFixing = $false
                
                # Check for missing required fields
                if (-not ($currentItem -match '"id":\s*"[^"]+"')) {
                    $missingFields++
                    $needsFixing = $true
                }
                
                if (-not ($currentItem -match '"chartGroup":\s*"[^"]+"')) {
                    $missingFields++
                    $needsFixing = $true
                }
                
                if (-not ($currentItem -match '"variableName":\s*"[^"]+"')) {
                    $missingFields++
                    $needsFixing = $true
                }
                
                if (-not ($currentItem -match '"serverName":\s*"[^"]+"')) {
                    $missingFields++
                    $needsFixing = $true
                }
                
                if (-not ($currentItem -match '"value":\s*"[^"]+"')) {
                    $missingFields++
                    $needsFixing = $true
                }
                
                if (-not ($currentItem -match '"tableName":\s*"[^"]+"')) {
                    $missingFields++
                    $needsFixing = $true
                }
                
                if (-not ($currentItem -match '"calculation":\s*"[^"]+"')) {
                    $missingFields++
                    $needsFixing = $true
                }
                
                if (-not ($currentItem -match '"productionSqlExpression":\s*"[^"]+"')) {
                    $missingFields++
                    $needsFixing = $true
                }
                
                if (-not ($currentItem -match '"lastUpdated":\s*"[^"]+"')) {
                    $missingFields++
                    $needsFixing = $true
                }
                
                # If any fields are missing, we'll need to fix this item
                if ($needsFixing) {
                    Write-Host "Found POR Overview entry with missing fields"
                    $fixedFields++
                }
            }
            
            # Add the current item to the fixed content
            $fixedContent += $currentItem.TrimEnd("`n").Split("`n")
            $currentItem = ""
        }
    }
    else {
        # Add non-data-array lines directly to the fixed content
        $fixedContent += $line
    }
}

Write-Host "Found $missingFields missing fields in $fixedFields POR Overview entries"

# If we found any missing fields, write the fixed content back to the file
if ($fixedFields -gt 0) {
    Write-Host "Writing fixed content back to the file"
    Set-Content -Path $filePath -Value $fixedContent
}

Write-Host "Complete-chart-data.ts has been fixed with proper POR SQL expressions and all required fields!"
