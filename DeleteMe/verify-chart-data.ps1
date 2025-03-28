# PowerShell script to verify and fix chart data
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.backup"
$backupFile = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.backup.ts"

# Create a backup
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

# Read the current file content
$content = Get-Content -Path $filePath -Raw

# Check if there are any POR entries
$porEntries = [regex]::Matches($content, '"serverName": "POR"').Count
Write-Host "Found $porEntries POR entries in the current file"

# Check the total number of entries
$totalEntries = [regex]::Matches($content, '"id": "[0-9]+"').Count
Write-Host "Found $totalEntries total entries in the current file"

# Check if the backup file exists and has POR entries
if (Test-Path $backupFile) {
    $backupContent = Get-Content -Path $backupFile -Raw
    $backupPorEntries = [regex]::Matches($backupContent, '"serverName": "POR"').Count
    Write-Host "Found $backupPorEntries POR entries in the backup file"
    
    # If we have POR entries in the backup but not in the current file, restore them
    if ($backupPorEntries -gt 0 -and $porEntries -eq 0) {
        Write-Host "Attempting to restore POR entries from backup..."
        
        # Extract all entries from backup file
        $backupEntriesMatch = [regex]::Match($backupContent, 'export const initialSpreadsheetData: SpreadsheetRow\[\] = \[([\s\S]*?)\];')
        if ($backupEntriesMatch.Success) {
            $backupEntriesContent = $backupEntriesMatch.Groups[1].Value
            
            # Extract POR entries
            $porEntriesMatches = [regex]::Matches($backupEntriesContent, '{\s+"id": "(?:12[7-9]|1[3-7][0-9])[\s\S]*?"serverName": "POR"[\s\S]*?}')
            
            if ($porEntriesMatches.Count -gt 0) {
                Write-Host "Found $($porEntriesMatches.Count) POR entries to restore"
                
                # Replace the closing bracket and add POR entries
                $newContent = $content -replace '\];', ",`n  " + ($porEntriesMatches -join ",`n  ") + "`n];"
                
                # Write the fixed content back to the file
                Set-Content -Path $filePath -Value $newContent
                Write-Host "Restored POR entries to the file"
            }
        }
    }
}

# Read the updated content
$updatedContent = Get-Content -Path $filePath -Raw

# Check for inconsistent parameter usage
$dataPointStartCount = [regex]::Matches($updatedContent, '@DataPointStart').Count
$dataPointEndCount = [regex]::Matches($updatedContent, '@DataPointEnd').Count
$getDateCount = [regex]::Matches($updatedContent, 'GETDATE\(\)').Count

Write-Host "Parameter usage statistics:"
Write-Host "- @DataPointStart: $dataPointStartCount occurrences"
Write-Host "- @DataPointEnd: $dataPointEndCount occurrences"
Write-Host "- GETDATE(): $getDateCount occurrences"

# Ensure the file ends with a single newline (fix lint issue)
if ($updatedContent.EndsWith("`n`n")) {
    # Remove extra newline at the end
    $updatedContent = $updatedContent.Substring(0, $updatedContent.Length - 1)
    Set-Content -Path $filePath -Value $updatedContent -NoNewline
    Add-Content -Path $filePath -Value ""  # Add a single newline at the end
    Write-Host "Fixed extra newline at the end of the file"
} elseif (-not $updatedContent.EndsWith("`n")) {
    # Add a newline if missing
    Add-Content -Path $filePath -Value ""
    Write-Host "Added missing newline at the end of the file"
}

# Verify the final state
$finalContent = Get-Content -Path $filePath -Raw
$finalPorEntries = [regex]::Matches($finalContent, '"serverName": "POR"').Count
$finalTotalEntries = [regex]::Matches($finalContent, '"id": "[0-9]+"').Count

Write-Host "Final state:"
Write-Host "- Total entries: $finalTotalEntries"
Write-Host "- POR entries: $finalPorEntries"

if ($finalPorEntries -gt 0 -and $finalTotalEntries -ge 174) {
    Write-Host "File appears to be fixed successfully"
} else {
    Write-Host "File may still have issues - manual inspection recommended"
}
