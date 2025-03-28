# PowerShell script to restore the complete-chart-data.ts file from backup
$currentFilePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupFilePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.backup.ts"

# Create a backup of the current file (even though it's empty)
Copy-Item -Path $currentFilePath -Destination "$currentFilePath.empty.bak" -Force
Write-Host "Created backup of empty file at $currentFilePath.empty.bak"

# Copy the backup file to the current file
Copy-Item -Path $backupFilePath -Destination $currentFilePath -Force
Write-Host "Restored complete-chart-data.ts from backup"

# Ensure the file ends with a single newline (fix lint issue)
$content = Get-Content -Path $currentFilePath -Raw
if ($content.EndsWith("`n`n")) {
    # Remove extra newline at the end
    $content = $content.Substring(0, $content.Length - 1)
    Set-Content -Path $currentFilePath -Value $content -NoNewline
    Add-Content -Path $currentFilePath -Value ""  # Add a single newline at the end
    Write-Host "Fixed extra newline at the end of the file"
} elseif (-not $content.EndsWith("`n")) {
    # Add a newline if missing
    Add-Content -Path $currentFilePath -Value ""
    Write-Host "Added missing newline at the end of the file"
}

# Count the entries
$p21Entries = [regex]::Matches($content, '"serverName": "P21"').Count
$porEntries = [regex]::Matches($content, '"serverName": "POR"').Count
$totalEntries = [regex]::Matches($content, '"id": "[0-9]+"').Count

Write-Host "File statistics:"
Write-Host "- Total entries: $totalEntries"
Write-Host "- P21 entries: $p21Entries"
Write-Host "- POR entries: $porEntries"

Write-Host "Done!"
