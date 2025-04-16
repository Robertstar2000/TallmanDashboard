# Script to resequence rowId values in single-source-data.ts (Revised)

# --- Configuration ---
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\single-source-data.ts"
$backupPath = "$filePath.bak_$(Get-Date -Format 'yyyyMMddHHmmss')_v2" # New backup name
$startId = 1 # Starting number for rowId

# --- Safety Check ---
if (-not (Test-Path $filePath)) {
    Write-Error "Error: File not found at '$filePath'. Please check the path."
    exit 1
}

# --- Backup ---
try {
    Write-Host "Creating backup: '$backupPath'..."
    Copy-Item -Path $filePath -Destination $backupPath -Force -ErrorAction Stop
    Write-Host "Backup created successfully."
} catch {
    Write-Error "Error creating backup: $($_.Exception.Message)"
    exit 1
}

# --- Process File ---
Write-Host "Reading entire content of '$filePath'..."
try {
    # Read the whole file content
    $content = Get-Content -Path $filePath -Raw -ErrorAction Stop

    # Initialize counter in script scope
    $script:currentId = $startId
    $script:idsChanged = 0 # Initialize change counter

    # Use -replace with a script block to find and replace each rowId sequentially
    # (?m) = multiline mode (so ^ matches start of line)
    Write-Host "Resequencing rowIds..."
    $newContent = $content -replace '(?m)^(\s*\"rowId\": \")\d+(\".*)', {
        param($match) # The match object
        $prefix = $match.Groups[1].Value
        $suffix = $match.Groups[2].Value
        $newLine = "$prefix$($script:currentId)$suffix" # Construct new line with current ID
        $script:currentId++ # Increment counter for the next match
        $script:idsChanged++ # Count changes
        $newLine # Return the modified line for replacement
    }

    Write-Host "Matched and prepared to change $($script:idsChanged) rowIds."

} catch {
    Write-Error "Error reading or processing file: $($_.Exception.Message)"
    exit 1
}

# --- Write Changes ---
try {
    Write-Host "Writing updated content back to '$filePath'..."
    # Use Set-Content for potentially better handling of large strings, ensure UTF8
    Set-Content -Path $filePath -Value $newContent -Encoding UTF8 -ErrorAction Stop
    Write-Host "File successfully updated."
} catch {
    Write-Error "Error writing updated file: $($_.Exception.Message)"
    Write-Warning "The original file might be corrupted. Please check the backup: $backupPath"
    exit 1
}

Write-Host "Resequencing complete. Changed $($script:idsChanged) rowIds."
