# PowerShell script to add POR Overview entries to complete-chart-data.ts
# This script will add the POR Overview entries with the correct MS Access/Jet SQL syntax

$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.backup3"
$tempFilePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.temp.ts"

# Create a backup of the original file
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

# Read the file content
$content = Get-Content -Path $filePath -Raw

# Define the POR Overview entries with correct SQL syntax
$timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

$porEntries = @"
  {
    "id": "127",
    "DataPoint": "POR Overview New Rentals, Jan",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 1 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "128",
    "DataPoint": "POR Overview New Rentals, Feb",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 2 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "129",
    "DataPoint": "POR Overview New Rentals, Mar",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 3 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "130",
    "DataPoint": "POR Overview New Rentals, Apr",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 4 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "131",
    "DataPoint": "POR Overview New Rentals, May",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 5 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "132",
    "DataPoint": "POR Overview New Rentals, Jun",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 6 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "133",
    "DataPoint": "POR Overview New Rentals, Jul",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 7 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "134",
    "DataPoint": "POR Overview New Rentals, Aug",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 8 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "135",
    "DataPoint": "POR Overview New Rentals, Sep",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 9 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "136",
    "DataPoint": "POR Overview New Rentals, Oct",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 10 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "137",
    "DataPoint": "POR Overview New Rentals, Nov",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 11 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "138",
    "DataPoint": "POR Overview New Rentals, Dec",
    "chartGroup": "POR Overview",
    "variableName": "New Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = 12 AND Year(DateCreated) = Year(Date())",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "139",
    "DataPoint": "POR Overview Open Rentals",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out')",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "140",
    "DataPoint": "POR Overview Open Rentals, Jan",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 1",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "141",
    "DataPoint": "POR Overview Open Rentals, Feb",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 2",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "142",
    "DataPoint": "POR Overview Open Rentals, Mar",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 3",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "143",
    "DataPoint": "POR Overview Open Rentals, Apr",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 4",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "144",
    "DataPoint": "POR Overview Open Rentals, May",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 5",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "145",
    "DataPoint": "POR Overview Open Rentals, Jun",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 6",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "146",
    "DataPoint": "POR Overview Open Rentals, Jul",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 7",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "147",
    "DataPoint": "POR Overview Open Rentals, Aug",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 8",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "148",
    "DataPoint": "POR Overview Open Rentals, Sep",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 9",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "149",
    "DataPoint": "POR Overview Open Rentals, Oct",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 10",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "150",
    "DataPoint": "POR Overview Open Rentals, Nov",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 11",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "151",
    "DataPoint": "POR Overview Open Rentals, Dec",
    "chartGroup": "POR Overview",
    "variableName": "Open Rentals",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 12",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "152",
    "DataPoint": "POR Overview Rental Value",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out')",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "153",
    "DataPoint": "POR Overview Rental Value, Jan",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 1",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "154",
    "DataPoint": "POR Overview Rental Value, Feb",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 2",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "155",
    "DataPoint": "POR Overview Rental Value, Mar",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 3",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "156",
    "DataPoint": "POR Overview Rental Value, Apr",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 4",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "157",
    "DataPoint": "POR Overview Rental Value, May",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 5",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "158",
    "DataPoint": "POR Overview Rental Value, Jun",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 6",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "159",
    "DataPoint": "POR Overview Rental Value, Jul",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 7",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "160",
    "DataPoint": "POR Overview Rental Value, Aug",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 8",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "161",
    "DataPoint": "POR Overview Rental Value, Sep",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 9",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "162",
    "DataPoint": "POR Overview Rental Value, Oct",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 10",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "163",
    "DataPoint": "POR Overview Rental Value, Nov",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 11",
    "lastUpdated": "$timestamp"
  },
  
  {
    "id": "164",
    "DataPoint": "POR Overview Rental Value, Dec",
    "chartGroup": "POR Overview",
    "variableName": "Rental Value",
    "serverName": "POR",
    "value": "0",
    "tableName": "Transactions",
    "calculation": "number",
    "productionSqlExpression": "SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = 12",
    "lastUpdated": "$timestamp"
  },
"@

# Find the position to insert the POR entries
# We'll look for the last P21 entry (id: "126") and insert after it
$pattern = '(\{[^{]*?"id":\s*"126"[^}]*?\},\s*)'
$match = [regex]::Match($content, $pattern)

if ($match.Success) {
    $insertPosition = $match.Index + $match.Length
    $newContent = $content.Substring(0, $insertPosition) + "`r`n" + $porEntries + "`r`n" + $content.Substring($insertPosition)
    
    # Write the updated content back to the file
    Set-Content -Path $filePath -Value $newContent
    
    Write-Host "Added POR Overview entries with correct SQL syntax to complete-chart-data.ts"
    Write-Host "Added 38 POR entries with IDs 127-164"
} else {
    Write-Host "Could not find position to insert POR entries. Make sure the file contains an entry with id: '126'."
}

# Now let's clean up the file to remove any duplicates
# Read the file again
$content = Get-Content -Path $filePath -Raw

# Find all initialSpreadsheetData declarations
$pattern = 'export const initialSpreadsheetData: SpreadsheetRow\[\] = \['
$matches = [regex]::Matches($content, $pattern)

if ($matches.Count -gt 1) {
    Write-Host "Found $($matches.Count) initialSpreadsheetData declarations. Cleaning up duplicates..."
    
    # Extract the first complete declaration
    $firstMatch = $matches[0]
    $startPos = $firstMatch.Index
    $endPos = $content.IndexOf('];', $startPos) + 2
    
    if ($endPos -gt $startPos) {
        $firstDeclaration = $content.Substring($startPos, $endPos - $startPos)
        
        # Keep only the first declaration and everything before it
        $newContent = $content.Substring(0, $startPos) + $firstDeclaration
        
        # Add any code that might be after the last declaration
        $lastMatch = $matches[$matches.Count - 1]
        $lastEndPos = $content.IndexOf('];', $lastMatch.Index) + 2
        
        if ($lastEndPos < $content.Length) {
            $newContent += $content.Substring($lastEndPos)
        }
        
        # Write the cleaned content back to the file
        Set-Content -Path $filePath -Value $newContent
        
        Write-Host "Removed duplicate initialSpreadsheetData declarations"
    } else {
        Write-Host "Could not find end of first declaration. No changes made."
    }
}

Write-Host "Complete-chart-data.ts has been updated with POR Overview entries and proper SQL syntax!"
