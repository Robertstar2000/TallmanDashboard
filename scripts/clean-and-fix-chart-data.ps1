# PowerShell script to clean up the complete-chart-data.ts file
# This script will:
# 1. Remove all duplicate declarations of initialSpreadsheetData
# 2. Update the POR SQL expressions to use proper MS Access/Jet SQL syntax

$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.clean-backup"
$tempFilePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.temp"

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

# Read the file line by line
$lines = Get-Content -Path $filePath
$cleanedLines = @()
$inDataArray = $false
$skipUntilNextDeclaration = $false
$dataItems = @()
$currentItem = @()
$processedIds = @{}

foreach ($line in $lines) {
    # Check if we're entering a new declaration of initialSpreadsheetData
    if ($line -match 'export const initialSpreadsheetData: SpreadsheetRow\[\] = \[') {
        # If we've already processed one declaration, skip until the next one
        if ($inDataArray) {
            $skipUntilNextDeclaration = $true
            continue
        }
        
        # Start processing the first declaration
        $inDataArray = $true
        $cleanedLines += $line
        continue
    }
    
    # Check if we're exiting the data array
    if ($inDataArray -and $line -match '^\];') {
        $inDataArray = $false
        $skipUntilNextDeclaration = $false
        $cleanedLines += $line
        continue
    }
    
    # Skip lines if we're between declarations
    if ($skipUntilNextDeclaration) {
        continue
    }
    
    # Process lines within the data array
    if ($inDataArray) {
        # Collect lines for the current item
        $currentItem += $line
        
        # Check if this is the end of an item
        if ($line -match '^\s*},?\s*$') {
            # Convert the item to a single string
            $itemText = $currentItem -join "`n"
            
            # Extract the ID to check for duplicates
            if ($itemText -match '"id":\s*"(\d+)"') {
                $id = $matches[1]
                
                # Only add the item if we haven't seen this ID before
                if (-not $processedIds.ContainsKey($id)) {
                    $processedIds[$id] = $true
                    
                    # Check if this is a POR item
                    if ($itemText -match '"serverName":\s*"POR"') {
                        # Update tableName to Transactions
                        $itemText = $itemText -replace '"tableName":\s*"Rentals"', '"tableName": "Transactions"'
                        
                        # Extract the DataPoint
                        if ($itemText -match '"DataPoint":\s*"([^"]+)"') {
                            $dataPoint = $matches[1]
                            
                            # Update the SQL expression based on the DataPoint
                            if ($dataPoint -match "POR Overview New Rentals, (\w+)") {
                                $month = $matches[1]
                                $monthNum = $monthMap[$month]
                                $sql = $newRentalsSql -f $monthNum
                                $itemText = $itemText -replace '"productionSqlExpression":\s*"[^"]*"', "`"productionSqlExpression`": `"$sql`""
                            }
                            elseif ($dataPoint -match "POR Overview Open Rentals, (\w+)") {
                                $month = $matches[1]
                                $monthNum = $monthMap[$month]
                                $sql = $openRentalsMonthSql -f $monthNum
                                $itemText = $itemText -replace '"productionSqlExpression":\s*"[^"]*"', "`"productionSqlExpression`": `"$sql`""
                            }
                            elseif ($dataPoint -eq "POR Overview Open Rentals") {
                                $sql = $openRentalsSql
                                $itemText = $itemText -replace '"productionSqlExpression":\s*"[^"]*"', "`"productionSqlExpression`": `"$sql`""
                            }
                            elseif ($dataPoint -match "POR Overview Rental Value, (\w+)") {
                                $month = $matches[1]
                                $monthNum = $monthMap[$month]
                                $sql = $rentalValueMonthSql -f $monthNum
                                $itemText = $itemText -replace '"productionSqlExpression":\s*"[^"]*"', "`"productionSqlExpression`": `"$sql`""
                            }
                            elseif ($dataPoint -eq "POR Overview Rental Value") {
                                $sql = $rentalValueSql
                                $itemText = $itemText -replace '"productionSqlExpression":\s*"[^"]*"', "`"productionSqlExpression`": `"$sql`""
                            }
                            
                            # Update the lastUpdated timestamp
                            $timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                            $itemText = $itemText -replace '"lastUpdated":\s*"[^"]*"', "`"lastUpdated`": `"$timestamp`""
                        }
                    }
                    
                    # Add the processed item to the data items
                    $dataItems += $itemText
                }
            }
            
            # Reset for the next item
            $currentItem = @()
        }
    }
    else {
        # Add non-data-array lines to the cleaned lines
        # Skip any export statements for combinedData that might be duplicated
        if (-not ($line -match 'export const combinedData')) {
            $cleanedLines += $line
        }
    }
}

# Create the new file content
$fileHeader = @"
import type { SpreadsheetRow } from './types';

// This file was auto-generated by the generate-complete-chart-data.js script
// Last updated: $(Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")

export const initialSpreadsheetData: SpreadsheetRow[] = [
"@

$fileFooter = @"
];

// Export the combined data
export const combinedData = [...initialSpreadsheetData];
"@

# Write the header to the temp file
Set-Content -Path $tempFilePath -Value $fileHeader

# Write each data item to the temp file
foreach ($item in $dataItems) {
    Add-Content -Path $tempFilePath -Value $item
}

# Write the footer to the temp file
Add-Content -Path $tempFilePath -Value $fileFooter

# Replace the original file with the temp file
Copy-Item -Path $tempFilePath -Destination $filePath -Force
Remove-Item -Path $tempFilePath -Force

Write-Host "File cleaned and POR SQL expressions updated with correct MS Access/Jet SQL syntax!"
Write-Host "Processed $($processedIds.Count) unique data items."
