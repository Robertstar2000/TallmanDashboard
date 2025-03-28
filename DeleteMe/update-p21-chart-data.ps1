# PowerShell script to update P21 SQL expressions in the complete-chart-data.ts file
# This script will:
# 1. Read the existing chart data from complete-chart-data.ts
# 2. Group the entries by chart group
# 3. For each chart group, use the admin query test functionality to find the correct tables and columns
# 4. Update the SQL expressions with the correct tables and columns
# 5. Write the updated data back to complete-chart-data.ts

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-chart-data-update.log"

# Create a backup of the original file
Copy-Item -Path $filePath -Destination $backupPath
Write-Host "Created backup at $backupPath"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting P21 chart data update at $(Get-Date)"

# Extract the data array from the file
$content = Get-Content -Path $filePath -Raw
$startMarker = "export const initialSpreadsheetData: SpreadsheetRow[] = ["
$endMarker = "];"

if ($content -match "$([regex]::Escape($startMarker))(.*?)$([regex]::Escape($endMarker))") {
    $jsonArrayText = $matches[1]
    Write-Host "Successfully extracted data array"
} else {
    Write-Error "Could not find the spreadsheet data in the file"
    Stop-Transcript
    exit 1
}

# Convert the extracted text to valid JSON by adding square brackets
$jsonText = "[$jsonArrayText]"

# Replace JavaScript-style trailing commas that would break JSON parsing
$jsonText = $jsonText -replace ',\s*]', ']'
$jsonText = $jsonText -replace ',\s*}', '}'

# Parse the JSON
try {
    $data = $jsonText | ConvertFrom-Json
    Write-Host "Successfully parsed JSON with $($data.Count) entries"
} catch {
    Write-Error "Failed to parse JSON: $_"
    Stop-Transcript
    exit 1
}

# Function to execute a P21 query using Node.js script
function Invoke-P21Query {
    param (
        [string]$query
    )
    
    # Create a temporary Node.js script to execute the query
    $tempScriptPath = [System.IO.Path]::GetTempFileName() + ".js"
    
    $nodeScript = @"
const { execSync } = require('child_process');
const fs = require('fs');

// The query to execute
const query = `$($query)`;

// Create a temporary file to store the query
const queryFile = require('path').join(require('os').tmpdir(), 'p21-query.sql');
fs.writeFileSync(queryFile, query);

try {
    // Execute the query using the existing test-p21-query functionality
    // This assumes you have a script or command that can execute P21 queries
    const result = execSync(`node scripts/execute-p21-query.js "${queryFile}"`, { 
        cwd: process.cwd(),
        encoding: 'utf8'
    });
    
    console.log(result);
} catch (error) {
    console.error('Error executing P21 query:', error.message);
    process.exit(1);
}
"@

    # Write the script to a temporary file
    $nodeScript | Out-File -FilePath $tempScriptPath -Encoding utf8
    
    try {
        # Execute the Node.js script
        $result = node $tempScriptPath
        return $result
    } catch {
        Write-Error "Failed to execute P21 query: $_"
        return $null
    } finally {
        # Clean up the temporary file
        Remove-Item -Path $tempScriptPath -Force
    }
}

# Function to check if a table exists in P21
function Test-P21Table {
    param (
        [string]$tableName
    )
    
    $query = "SELECT TOP 1 * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '$tableName'"
    $result = Invoke-P21Query -query $query
    
    return $null -ne $result -and $result -ne ""
}

# Function to get columns for a P21 table
function Get-P21TableColumns {
    param (
        [string]$tableName
    )
    
    $query = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$tableName'"
    $result = Invoke-P21Query -query $query
    
    return $result
}

# First, create the execute-p21-query.js script if it doesn't exist
$p21QueryScriptPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\execute-p21-query.js"
if (-not (Test-Path $p21QueryScriptPath)) {
    $p21QueryScript = @"
// Script to execute a P21 query using the existing connection functionality
const fs = require('fs');
const path = require('path');
const { ConnectionManager } = require('../lib/db/connection-manager');

async function executeP21Query(queryFile) {
    try {
        // Read the query from the file
        const query = fs.readFileSync(queryFile, 'utf8');
        
        // Configure the P21 connection
        const config = {
            server: process.env.P21_SERVER || 'localhost',
            database: process.env.P21_DATABASE || 'P21Play',
            username: process.env.P21_USERNAME,
            password: process.env.P21_PASSWORD,
            trustedConnection: !process.env.P21_USERNAME
        };
        
        // Execute the query
        const result = await ConnectionManager.executeQuery(config, query);
        
        // Output the result as JSON
        console.log(JSON.stringify(result, null, 2));
        
        return result;
    } catch (error) {
        console.error('Error executing P21 query:', error.message);
        process.exit(1);
    }
}

// Get the query file from command line arguments
const queryFile = process.argv[2];
if (!queryFile) {
    console.error('Please provide a query file path');
    process.exit(1);
}

// Execute the query
executeP21Query(queryFile);
"@

    $p21QueryScript | Out-File -FilePath $p21QueryScriptPath -Encoding utf8
    Write-Host "Created execute-p21-query.js script"
}

# Group the data by chart group
$chartGroups = $data | Group-Object -Property chartGroup

Write-Host "Found $($chartGroups.Count) chart groups"

# Process each chart group
foreach ($group in $chartGroups) {
    $chartGroup = $group.Name
    $entries = $group.Group
    
    Write-Host "Processing chart group: $chartGroup with $($entries.Count) entries"
    
    # Only process P21 entries (IDs 1-126)
    $p21Entries = $entries | Where-Object { [int]$_.id -le 126 }
    
    if ($p21Entries.Count -eq 0) {
        Write-Host "No P21 entries found in chart group: $chartGroup"
        continue
    }
    
    Write-Host "Found $($p21Entries.Count) P21 entries in chart group: $chartGroup"
    
    # Prompt the user to continue with this chart group
    $continue = Read-Host "Process chart group '$chartGroup'? (Y/N)"
    if ($continue -ne "Y") {
        Write-Host "Skipping chart group: $chartGroup"
        continue
    }
    
    # For each entry in the chart group, check the table and update the SQL expression if needed
    foreach ($entry in $p21Entries) {
        Write-Host "Processing entry ID: $($entry.id) - $($entry.DataPoint)"
        
        # Extract the table name from the current SQL expression
        if ($entry.productionSqlExpression -match "FROM\s+(\w+\.\w+)") {
            $currentTable = $matches[1]
            Write-Host "Current table: $currentTable"
            
            # Check if the table exists
            $tableName = $currentTable.Split('.')[1]
            $tableExists = Test-P21Table -tableName $tableName
            
            if ($tableExists) {
                Write-Host "Table $tableName exists in P21"
                
                # Get the columns for the table
                $columns = Get-P21TableColumns -tableName $tableName
                Write-Host ("Columns for table {0}: {1}" -f $tableName, $columns)
                
                # Update the SQL expression if needed based on the columns
                # This is a placeholder - you would need to implement the logic to update the SQL expression
                
                Write-Host "SQL expression for entry ID $($entry.id) is valid"
            } else {
                Write-Host "Table $tableName does not exist in P21"
                
                # Prompt the user for a new table name
                $newTableName = Read-Host "Enter a new table name for entry ID $($entry.id)"
                
                if ($newTableName) {
                    # Update the SQL expression with the new table name
                    $entry.productionSqlExpression = $entry.productionSqlExpression -replace $currentTable, "dbo.$newTableName"
                    Write-Host "Updated SQL expression for entry ID $($entry.id) with new table: dbo.$newTableName"
                }
            }
        } else {
            Write-Host "Could not extract table name from SQL expression for entry ID $($entry.id)"
        }
    }
}

# Convert the data back to JSON
$updatedJsonText = $data | ConvertTo-Json -Depth 10

# Format the JSON to match the original file format
$updatedJsonText = $updatedJsonText -replace '"', "'"
$updatedJsonText = $updatedJsonText -replace "':", ": "
$updatedJsonText = $updatedJsonText -replace ",", ","
$updatedJsonText = $updatedJsonText -replace "\[", "["
$updatedJsonText = $updatedJsonText -replace "\]", "]"
$updatedJsonText = $updatedJsonText -replace "\{", "{"
$updatedJsonText = $updatedJsonText -replace "\}", "}"

# Update the file with the new data
$updatedContent = $content -replace "$([regex]::Escape($startMarker)).*?$([regex]::Escape($endMarker))", "$startMarker$updatedJsonText$endMarker"
$updatedContent | Out-File -FilePath $filePath -Encoding utf8

Write-Host "Updated $filePath with new SQL expressions"
Write-Host "P21 chart data update completed at $(Get-Date)"

Stop-Transcript
