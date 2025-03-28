# PowerShell script to update POR SQL queries in the complete-chart-data.ts file

$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"

# Read the file content
$content = Get-Content -Path $filePath -Raw

# Define the new SQL queries for each metric type
$newRentalsSql = "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = {0} AND Year(DateCreated) = Year(Date())"
$openRentalsSql = "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = {0}"
$rentalValueSql = "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = {0}"

# Define month mappings
$monthMap = @{
    "Jan" = 1; "Feb" = 2; "Mar" = 3; "Apr" = 4; "May" = 5; "Jun" = 6;
    "Jul" = 7; "Aug" = 8; "Sep" = 9; "Oct" = 10; "Nov" = 11; "Dec" = 12
}

# Update New Rentals queries
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    $oldPattern = "productionSqlExpression`": `"SELECT Count\(\*\) as value FROM Rentals WHERE Status = 'New' AND DatePart\('m', RentalDate\) = $monthNum"
    $newSql = $newRentalsSql -f $monthNum
    $newPattern = "productionSqlExpression`": `"$newSql"
    $content = $content -replace $oldPattern, $newPattern

    # Also update the tableName
    $tablePattern = "`"tableName`": `"Rentals`","
    $newTablePattern = "`"tableName`": `"Transactions`","
    $content = $content -replace $tablePattern, $newTablePattern
}

# Update Open Rentals queries
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    $oldPattern = "productionSqlExpression`": `"SELECT Count\(\*\) as value FROM Rentals WHERE Status = 'Open' AND DatePart\('m', RentalDate\) = $monthNum"
    $newSql = $openRentalsSql -f $monthNum
    $newPattern = "productionSqlExpression`": `"$newSql"
    $content = $content -replace $oldPattern, $newPattern
}

# Update Rental Value queries
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    $oldPattern = "productionSqlExpression`": `"SELECT Sum\(RentalValue\) as value FROM Rentals WHERE DatePart\('m', RentalDate\) = $monthNum"
    $newSql = $rentalValueSql -f $monthNum
    $newPattern = "productionSqlExpression`": `"$newSql"
    $content = $content -replace $oldPattern, $newPattern
}

# Write the updated content back to the file
Set-Content -Path $filePath -Value $content

Write-Host "POR SQL expressions updated successfully!"
