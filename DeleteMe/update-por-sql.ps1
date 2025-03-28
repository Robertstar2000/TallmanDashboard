# PowerShell script to update POR SQL expressions in complete-chart-data.ts
# This script directly updates the SQL expressions for POR Overview metrics

$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.backup"

# Create a backup of the original file
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

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

# Function to escape special characters in regex pattern
function Escape-RegexPattern {
    param([string]$pattern)
    return [regex]::Escape($pattern)
}

# Update SQL expressions for POR Overview New Rentals by month
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    $newSql = $newRentalsSql -f $monthNum
    
    # Create a pattern that matches the entire JSON object for this data point
    $pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview New Rentals, ' + $month + '"[^}]*?"productionSqlExpression":\s*")[^"]*(".*?\})'
    
    # Replace the SQL expression
    $content = $content -replace $pattern, ('$1' + $newSql + '$2')
}

# Update SQL expressions for POR Overview Open Rentals by month
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    $newSql = $openRentalsMonthSql -f $monthNum
    
    # Create a pattern that matches the entire JSON object for this data point
    $pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview Open Rentals, ' + $month + '"[^}]*?"productionSqlExpression":\s*")[^"]*(".*?\})'
    
    # Replace the SQL expression
    $content = $content -replace $pattern, ('$1' + $newSql + '$2')
}

# Update SQL expressions for POR Overview Rental Value by month
foreach ($month in $monthMap.Keys) {
    $monthNum = $monthMap[$month]
    $newSql = $rentalValueMonthSql -f $monthNum
    
    # Create a pattern that matches the entire JSON object for this data point
    $pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview Rental Value, ' + $month + '"[^}]*?"productionSqlExpression":\s*")[^"]*(".*?\})'
    
    # Replace the SQL expression
    $content = $content -replace $pattern, ('$1' + $newSql + '$2')
}

# Update SQL expression for POR Overview Open Rentals (total)
$pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview Open Rentals"[^}]*?"productionSqlExpression":\s*")[^"]*(".*?\})'
$content = $content -replace $pattern, ('$1' + $openRentalsSql + '$2')

# Update SQL expression for POR Overview Rental Value (total)
$pattern = '(\{[^{]*?"DataPoint":\s*"POR Overview Rental Value"[^}]*?"productionSqlExpression":\s*")[^"]*(".*?\})'
$content = $content -replace $pattern, ('$1' + $rentalValueSql + '$2')

# Update tableName from "Rentals" to "Transactions" for all POR entries
$content = $content -replace '("serverName":\s*"POR"[^}]*?"tableName":\s*)"Rentals"', '$1"Transactions"'

# Update lastUpdated timestamp for all POR entries
$timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$content = $content -replace '("serverName":\s*"POR"[^}]*?"lastUpdated":\s*")[^"]*(")', ('$1' + $timestamp + '$2')

# Write the updated content back to the file
Set-Content -Path $filePath -Value $content

Write-Host "POR SQL expressions updated with correct MS Access/Jet SQL syntax!"
