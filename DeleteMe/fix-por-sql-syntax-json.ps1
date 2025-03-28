# PowerShell script to fix POR SQL queries to use proper MS Access/Jet SQL syntax
# This version uses JSON parsing to avoid corrupting the TypeScript file

$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"

# Read the file content
$content = Get-Content -Path $filePath -Raw

# Extract the JSON array from the TypeScript file
$startMarker = "export const initialSpreadsheetData: SpreadsheetRow[] = ["
$endMarker = "];"

if ($content -match "$([regex]::Escape($startMarker))(.*?)$([regex]::Escape($endMarker))" -eq $false) {
    Write-Error "Could not find the spreadsheet data in the file"
    exit 1
}

$jsonArrayText = $matches[1]
# Add square brackets to make it a valid JSON array
$jsonArrayText = "[$jsonArrayText]"

# Parse the JSON
try {
    $jsonArray = $jsonArrayText | ConvertFrom-Json
    Write-Host "Successfully parsed JSON with $($jsonArray.Count) entries"
} catch {
    Write-Error "Failed to parse JSON: $_"
    exit 1
}

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

# Update the SQL expressions for POR entries (IDs 127-174)
$porCount = 0
foreach ($item in $jsonArray) {
    # Only process POR entries
    if ($item.serverName -eq "POR") {
        $porCount++
        
        # Update tableName if it's still "Rentals"
        if ($item.tableName -eq "Rentals") {
            $item.tableName = "Transactions"
        }
        
        # Update the SQL expression based on the DataPoint
        if ($item.DataPoint -match "POR Overview New Rentals, (\w+)") {
            $month = $matches[1]
            $monthNum = $monthMap[$month]
            $item.productionSqlExpression = $newRentalsSql -f $monthNum
        }
        elseif ($item.DataPoint -match "POR Overview Open Rentals, (\w+)") {
            $month = $matches[1]
            $monthNum = $monthMap[$month]
            $item.productionSqlExpression = $openRentalsMonthSql -f $monthNum
        }
        elseif ($item.DataPoint -eq "POR Overview Open Rentals") {
            $item.productionSqlExpression = $openRentalsSql
        }
        elseif ($item.DataPoint -match "POR Overview Rental Value, (\w+)") {
            $month = $matches[1]
            $monthNum = $monthMap[$month]
            $item.productionSqlExpression = $rentalValueMonthSql -f $monthNum
        }
        elseif ($item.DataPoint -eq "POR Overview Rental Value") {
            $item.productionSqlExpression = $rentalValueSql
        }
        
        # Update the lastUpdated timestamp
        $item.lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
}

Write-Host "Updated $porCount POR entries"

# Convert back to JSON
$updatedJsonArrayText = $jsonArray | ConvertTo-Json -Depth 10

# Remove the outer square brackets
$updatedJsonArrayText = $updatedJsonArrayText.Substring(1, $updatedJsonArrayText.Length - 2)

# Replace the JSON array in the original file
$updatedContent = $content -replace "$([regex]::Escape($startMarker))(.*?)$([regex]::Escape($endMarker))", "$startMarker$updatedJsonArrayText$endMarker"

# Write the updated content back to the file
Set-Content -Path $filePath -Value $updatedContent

Write-Host "POR SQL expressions updated with correct MS Access/Jet SQL syntax!"
