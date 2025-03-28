# PowerShell script to fix POR SQL queries to use proper MS Access/Jet SQL syntax
# Based on limitations in README.md:
# - Uses Date() for current date
# - Uses Month() and Year() functions
# - No schema prefixes or table hints

$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"

# Read the file content
$content = Get-Content -Path $filePath -Raw

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

# Fix any incorrect syntax in the New Rentals queries
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    
    # Look for patterns that need to be fixed
    $oldPattern1 = "productionSqlExpression`": `"SELECT Count\(\*\) as value FROM Transactions WHERE Month\(DateCreated\) = $monthNum AND Year\(DateCreated\) = Year\(Date\(\)\) AND DatePart\('yyyy', RentalDate\) = DatePart\('yyyy', Now\(\)\)"
    $oldPattern2 = "productionSqlExpression`": `"SELECT Count\(\*\) as value FROM Rentals WHERE Status = 'New' AND DatePart\('m', RentalDate\) = $monthNum AND DatePart\('yyyy', RentalDate\) = DatePart\('yyyy', Now\(\)\)"
    
    # Create the correct SQL
    $newSql = $newRentalsSql -f $monthNum
    $newPattern = "productionSqlExpression`": `"$newSql"
    
    # Replace both patterns
    $content = $content -replace $oldPattern1, $newPattern
    $content = $content -replace $oldPattern2, $newPattern
}

# Fix any incorrect syntax in the Open Rentals queries
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    
    # Look for patterns that need to be fixed
    $oldPattern1 = "productionSqlExpression`": `"SELECT Count\(\*\) as value FROM Transactions WHERE TransactionStatus IN \('Open', 'Active', 'Out'\) AND Month\(DateCreated\) = $monthNum"
    $oldPattern2 = "productionSqlExpression`": `"SELECT Count\(\*\) as value FROM Rentals WHERE Status = 'Open' AND DatePart\('m', RentalDate\) = $monthNum"
    
    # Create the correct SQL
    $newSql = $openRentalsMonthSql -f $monthNum
    $newPattern = "productionSqlExpression`": `"$newSql"
    
    # Replace both patterns
    $content = $content -replace $oldPattern1, $newPattern
    $content = $content -replace $oldPattern2, $newPattern
}

# Fix any incorrect syntax in the Rental Value queries
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    
    # Look for patterns that need to be fixed
    $oldPattern1 = "productionSqlExpression`": `"SELECT Sum\(TotalAmount\) as value FROM Transactions WHERE TransactionStatus IN \('Open', 'Active', 'Out'\) AND Month\(DateCreated\) = $monthNum"
    $oldPattern2 = "productionSqlExpression`": `"SELECT Sum\(RentalValue\) as value FROM Rentals WHERE DatePart\('m', RentalDate\) = $monthNum"
    
    # Create the correct SQL
    $newSql = $rentalValueMonthSql -f $monthNum
    $newPattern = "productionSqlExpression`": `"$newSql"
    
    # Replace both patterns
    $content = $content -replace $oldPattern1, $newPattern
    $content = $content -replace $oldPattern2, $newPattern
}

# Also update the tableName if it's still "Rentals"
$tablePattern = "`"tableName`": `"Rentals`","
$newTablePattern = "`"tableName`": `"Transactions`","
$content = $content -replace $tablePattern, $newTablePattern

# Update lastUpdated timestamp for all POR entries
$currentDate = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
$lastUpdatedPattern = "`"lastUpdated`": `"[^`"]+`""
$newLastUpdatedPattern = "`"lastUpdated`": `"$currentDate`""

# Only update POR entries (we need to be more selective)
$porEntryPattern = "`"serverName`": `"POR`",[^}]+`"lastUpdated`": `"[^`"]+`""
$porEntryReplacement = "`"serverName`": `"POR`",$&"
$content = $content -replace $porEntryPattern, { $_.Value -replace $lastUpdatedPattern, $newLastUpdatedPattern }

# Write the updated content back to the file
Set-Content -Path $filePath -Value $content

Write-Host "POR SQL expressions updated with correct MS Access/Jet SQL syntax!"
