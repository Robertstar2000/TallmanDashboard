# PowerShell script to restore POR entries from backup file
$currentFilePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupFilePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.backup.ts"
$tempFilePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.temp.ts"

# Create a backup of the current file
Copy-Item -Path $currentFilePath -Destination "$currentFilePath.bak" -Force
Write-Host "Created backup at $currentFilePath.bak"

# Read both files
$currentContent = Get-Content -Path $currentFilePath -Raw
$backupContent = Get-Content -Path $backupFilePath -Raw

# Extract entries from current file
$currentMatch = [regex]::Match($currentContent, 'export const initialSpreadsheetData: SpreadsheetRow\[\] = \[([\s\S]*?)\];')
if (-not $currentMatch.Success) {
    Write-Host "Error: Could not extract entries from current file"
    exit 1
}
$currentEntries = $currentMatch.Groups[1].Value

# Extract entries from backup file
$backupMatch = [regex]::Match($backupContent, 'export const initialSpreadsheetData: SpreadsheetRow\[\] = \[([\s\S]*?)\];')
if (-not $backupMatch.Success) {
    Write-Host "Error: Could not extract entries from backup file"
    exit 1
}
$backupEntries = $backupMatch.Groups[1].Value

# Extract POR entries from backup file
$porEntries = @()
$backupEntryMatches = [regex]::Matches($backupEntries, '{\s+"id": "(\d+)"[\s\S]*?}')
foreach ($match in $backupEntryMatches) {
    $entryId = [int]$match.Groups[1].Value
    $entryText = $match.Value
    
    # Check if this is a POR entry (ID >= 127)
    if ($entryId -ge 127) {
        $porEntries += $entryText
    }
}

Write-Host "Found $($porEntries.Count) POR entries in backup file"

# Check if the current file already has all entries
$currentEntryMatches = [regex]::Matches($currentEntries, '{\s+"id": "(\d+)"[\s\S]*?}')
$highestId = 0
foreach ($match in $currentEntryMatches) {
    $entryId = [int]$match.Groups[1].Value
    if ($entryId -gt $highestId) {
        $highestId = $entryId
    }
}

Write-Host "Highest ID in current file: $highestId"

# If we already have all entries, no need to restore
if ($highestId -ge 174) {
    Write-Host "Current file already has all entries (up to ID $highestId)"
    exit 0
}

# Create the new content with POR entries
$newEntries = $currentEntries
if ($newEntries.TrimEnd().EndsWith("}")) {
    $newEntries += ","
}
$newEntries += "`n  " + ($porEntries -join ",`n  ")

# Create the new file content
$newContent = $currentContent -replace 'export const initialSpreadsheetData: SpreadsheetRow\[\] = \[([\s\S]*?)\];', "export const initialSpreadsheetData: SpreadsheetRow[] = [$newEntries];"

# Write to temp file first
Set-Content -Path $tempFilePath -Value $newContent

# Verify the temp file
$tempContent = Get-Content -Path $tempFilePath -Raw
$tempEntryMatches = [regex]::Matches($tempContent, '{\s+"id": "(\d+)"[\s\S]*?}')
$tempHighestId = 0
foreach ($match in $tempEntryMatches) {
    $entryId = [int]$match.Groups[1].Value
    if ($entryId -gt $tempHighestId) {
        $tempHighestId = $entryId
    }
}

Write-Host "Highest ID in temp file: $tempHighestId"

# If the temp file looks good, replace the current file
if ($tempHighestId -ge 174) {
    Copy-Item -Path $tempFilePath -Destination $currentFilePath -Force
    Write-Host "Successfully restored POR entries to $currentFilePath"
    
    # Ensure the file ends with a single newline (fix lint issue)
    $finalContent = Get-Content -Path $currentFilePath -Raw
    if ($finalContent.EndsWith("`n`n")) {
        # Remove extra newline at the end
        $finalContent = $finalContent.Substring(0, $finalContent.Length - 1)
        Set-Content -Path $currentFilePath -Value $finalContent -NoNewline
        Add-Content -Path $currentFilePath -Value ""  # Add a single newline at the end
        Write-Host "Fixed extra newline at the end of the file"
    } elseif (-not $finalContent.EndsWith("`n")) {
        # Add a newline if missing
        Add-Content -Path $currentFilePath -Value ""
        Write-Host "Added missing newline at the end of the file"
    }
} else {
    Write-Host "Error: Temp file does not have all entries. Not replacing current file."
    exit 1
}

# Clean up
Remove-Item -Path $tempFilePath -Force
Write-Host "Removed temp file"

Write-Host "Done!"
