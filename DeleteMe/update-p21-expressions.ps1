# PowerShell script to update P21 SQL expressions in the complete-chart-data.ts file
# This script will:
# 1. Read the existing chart data from complete-chart-data.ts
# 2. Group the entries by chart group
# 3. Allow you to review and update SQL expressions for each chart group
# 4. Ensure proper P21 SQL syntax (with schema prefixes, WITH (NOLOCK) hints, etc.)
# 5. Write the updated data back to complete-chart-data.ts

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\p21-chart-data-update.log"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host ("Starting P21 chart data update at {0}" -f (Get-Date))

# Create a backup of the original file
Copy-Item -Path $filePath -Destination $backupPath
Write-Host ("Created backup at {0}" -f $backupPath)

# Read the file content
$content = Get-Content -Path $filePath -Raw

# Extract the data array
$startMarker = "export const initialSpreadsheetData: SpreadsheetRow[] = ["
$endMarker = "];"

$startIndex = $content.IndexOf($startMarker)
$endIndex = $content.IndexOf($endMarker, $startIndex)

if ($startIndex -eq -1 -or $endIndex -eq -1) {
    Write-Error "Could not find the spreadsheet data in the file"
    Stop-Transcript
    exit 1
}

# Extract the JSON array text
$jsonArrayText = $content.Substring($startIndex + $startMarker.Length, $endIndex - $startIndex - $startMarker.Length)

# Create a temporary file with valid JSON
$tempFile = [System.IO.Path]::GetTempFileName()
"[$jsonArrayText]" | Out-File -FilePath $tempFile -Encoding utf8

# Parse the JSON using Node.js
$nodeScript = @"
const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonFile = '$($tempFile.Replace("\", "\\"))';
const jsonText = fs.readFileSync(jsonFile, 'utf8');

try {
    // Parse the JSON
    const data = eval(jsonText);
    
    // Convert to a simpler format for PowerShell to parse
    const simplifiedData = data.map(item => ({
        id: item.id,
        DataPoint: item.DataPoint,
        chartGroup: item.chartGroup,
        variableName: item.variableName,
        serverName: item.serverName,
        value: item.value,
        tableName: item.tableName,
        calculation: item.calculation,
        productionSqlExpression: item.productionSqlExpression,
        lastUpdated: item.lastUpdated
    }));
    
    // Write to a new file
    fs.writeFileSync('$($tempFile.Replace("\", "\\"))_parsed', JSON.stringify(simplifiedData));
    console.log('Successfully parsed JSON with ' + data.length + ' entries');
} catch (error) {
    console.error('Failed to parse JSON: ' + error.message);
    process.exit(1);
}
"@

$nodeScriptFile = [System.IO.Path]::GetTempFileName() + ".js"
$nodeScript | Out-File -FilePath $nodeScriptFile -Encoding utf8

# Execute the Node.js script
node $nodeScriptFile

# Check if the parsed file was created
$parsedFile = "$tempFile`_parsed"
if (-not (Test-Path $parsedFile)) {
    Write-Error "Failed to parse JSON data"
    Stop-Transcript
    exit 1
}

# Read the parsed JSON
$parsedJson = Get-Content -Path $parsedFile -Raw
$data = $parsedJson | ConvertFrom-Json

Write-Host ("Successfully parsed JSON with {0} entries" -f $data.Count)

# Clean up temporary files
Remove-Item -Path $tempFile -Force
Remove-Item -Path $nodeScriptFile -Force
Remove-Item -Path $parsedFile -Force

# Function to update SQL expression with proper P21 syntax
function Update-P21SqlSyntax {
    param (
        [string]$sqlExpression
    )
    
    # Ensure table names have schema prefixes
    $commonTables = @(
        'oe_hdr', 'oe_line', 'invoice_hdr', 'invoice_line', 
        'customer', 'inv_mast', 'ar_open_items', 'ap_open_items',
        'vendor', 'po_hdr', 'po_line', 'gl_detail'
    )
    
    $updatedSql = $sqlExpression
    
    # Add schema prefixes if missing
    foreach ($table in $commonTables) {
        $pattern = "(?<!\w|\.)$table\b(?!\.\w)"
        $updatedSql = $updatedSql -replace $pattern, "dbo.$table"
    }
    
    # Add WITH (NOLOCK) hints if missing
    foreach ($table in $commonTables) {
        $pattern = "dbo\.$table\b(?!\s+WITH\s+\(NOLOCK\))"
        $updatedSql = $updatedSql -replace $pattern, "dbo.$table WITH (NOLOCK)"
    }
    
    # Ensure GETDATE() is used for current date
    $updatedSql = $updatedSql -replace "\bCURRENT_TIMESTAMP\b", "GETDATE()"
    $updatedSql = $updatedSql -replace "\bCURRENT_DATE\b", "CAST(GETDATE() AS DATE)"
    
    # Ensure proper date functions
    $updatedSql = $updatedSql -replace "\bDATEADD\(\s*'(\w+)'\s*,", "DATEADD($1,"
    
    return $updatedSql
}

# Group the data by chart group
$chartGroups = $data | Group-Object -Property chartGroup

Write-Host ("Found {0} chart groups" -f $chartGroups.Count)

# Process each chart group
foreach ($group in $chartGroups) {
    $chartGroup = $group.Name
    $entries = $group.Group
    
    Write-Host ("Processing chart group: {0} with {1} entries" -f $chartGroup, $entries.Count)
    
    # Only process P21 entries (IDs 1-126)
    $p21Entries = $entries | Where-Object { [int]$_.id -le 126 }
    
    if ($p21Entries.Count -eq 0) {
        Write-Host ("No P21 entries found in chart group: {0}" -f $chartGroup)
        continue
    }
    
    Write-Host ("Found {0} P21 entries in chart group: {1}" -f $p21Entries.Count, $chartGroup)
    
    # Prompt the user to continue with this chart group
    $continue = Read-Host "Process chart group '$chartGroup'? (Y/N)"
    if ($continue -ne "Y") {
        Write-Host ("Skipping chart group: {0}" -f $chartGroup)
        continue
    }
    
    # For each entry in the chart group, review and update the SQL expression if needed
    foreach ($entry in $p21Entries) {
        Write-Host ("Processing entry ID: {0} - {1}" -f $entry.id, $entry.DataPoint)
        
        # Display the current SQL expression
        Write-Host "Current SQL expression:"
        Write-Host $entry.productionSqlExpression
        
        # Update the SQL expression with proper P21 syntax
        $updatedSql = Update-P21SqlSyntax -sqlExpression $entry.productionSqlExpression
        
        # If the SQL expression was updated, display the changes
        if ($updatedSql -ne $entry.productionSqlExpression) {
            Write-Host "Updated SQL expression with proper P21 syntax:"
            Write-Host $updatedSql
            
            # Prompt the user to accept the changes
            $acceptChanges = Read-Host "Accept these changes? (Y/N)"
            if ($acceptChanges -eq "Y") {
                $entry.productionSqlExpression = $updatedSql
                Write-Host "Changes accepted"
            } else {
                Write-Host "Changes rejected"
            }
        } else {
            Write-Host "SQL expression already has proper P21 syntax"
        }
        
        # Prompt the user to manually edit the SQL expression
        $editSql = Read-Host "Do you want to manually edit this SQL expression? (Y/N)"
        if ($editSql -eq "Y") {
            # Create a temporary file with the SQL expression
            $tempFile = [System.IO.Path]::GetTempFileName()
            $entry.productionSqlExpression | Out-File -FilePath $tempFile -Encoding utf8
            
            # Open the file in Notepad for editing
            Start-Process "notepad.exe" -ArgumentList $tempFile -Wait
            
            # Read the updated SQL expression from the file
            $updatedSql = Get-Content -Path $tempFile -Raw
            
            # Update the entry with the new SQL expression
            $entry.productionSqlExpression = $updatedSql.Trim()
            
            # Clean up the temporary file
            Remove-Item -Path $tempFile -Force
            
            Write-Host "SQL expression updated manually"
        }
    }
}

# Create a new temporary file for the updated JSON
$updatedTempFile = [System.IO.Path]::GetTempFileName()

# Create a Node.js script to format the JSON back to the original format
$formatScript = @"
const fs = require('fs');

// The data to format
const data = ${ConvertTo-Json -InputObject $data -Depth 10 -Compress -ErrorAction SilentlyContinue};

// Format the data
let formattedData = JSON.stringify(data, null, 2)
  .replace(/"([^"]+)":/g, '\\$1:') // Remove quotes around property names
  .replace(/"/g, "'") // Replace double quotes with single quotes
  .replace(/\[/g, '[') // Format arrays
  .replace(/\]/g, ']')
  .replace(/\{/g, '{') // Format objects
  .replace(/\}/g, '}')
  .replace(/,\n\s*/g, ',\n  '); // Format commas

// Remove the outer brackets
formattedData = formattedData.substring(1, formattedData.length - 1);

// Write to file
fs.writeFileSync('$($updatedTempFile.Replace("\", "\\"))', formattedData);
"@

$formatScriptFile = [System.IO.Path]::GetTempFileName() + ".js"
$formatScript | Out-File -FilePath $formatScriptFile -Encoding utf8

# Execute the format script
node $formatScriptFile

# Read the formatted JSON
$formattedJson = Get-Content -Path $updatedTempFile -Raw

# Update the file with the new data
$updatedContent = $content.Substring(0, $startIndex + $startMarker.Length) + 
                  $formattedJson + 
                  $content.Substring($endIndex)

$updatedContent | Out-File -FilePath $filePath -Encoding utf8

# Clean up temporary files
Remove-Item -Path $updatedTempFile -Force
Remove-Item -Path $formatScriptFile -Force

Write-Host ("Updated {0} with new SQL expressions" -f $filePath)
Write-Host ("P21 chart data update completed at {0}" -f (Get-Date))

Stop-Transcript
