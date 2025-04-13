# PowerShell script to fix SQL format issues in complete-chart-data.ts
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.bak"

# Create a backup
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

# Read the file content
$content = Get-Content -Path $filePath -Raw

# Fix P21 SQL expressions with template literals
$pattern = '("sqlExpression": `)[\s\S]*?(`)'
$replacement = {
    param($match)
    $fullMatch = $match.Groups[0].Value
    $prefix = $match.Groups[1].Value
    $sql = $match.Groups[0].Value.Substring($match.Groups[1].Value.Length, $match.Groups[0].Value.Length - $match.Groups[1].Value.Length - $match.Groups[2].Value.Length)
    
    # Extract the SQL parts
    $sqlLines = $sql -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
    $sqlSingleLine = $sqlLines -join " "
    
    # Replace @DataPointStart with GETDATE() for P21
    $sqlSingleLine = $sqlSingleLine -replace "YEAR\(@DataPointStart\)", "YEAR(GETDATE())"
    
    # Return as a single-line quoted string
    return "`"sqlExpression`": `"$sqlSingleLine`""
}

$newContent = [regex]::Replace($content, $pattern, $replacement)

# Write the fixed content back to the file
Set-Content -Path $filePath -Value $newContent

Write-Host "SQL format issues fixed in $filePath"
Write-Host "Checking for any remaining template literals..."

# Check if there are any remaining template literals
$checkContent = Get-Content -Path $filePath -Raw
$remainingTemplates = [regex]::Matches($checkContent, '`[\s\S]*?`')
if ($remainingTemplates.Count -gt 0) {
    Write-Host "Warning: Found $($remainingTemplates.Count) remaining template literals that need to be fixed."
} else {
    Write-Host "No remaining template literals found. All SQL expressions have been properly formatted."
}

# Ensure the file ends with a single newline (fix lint issue)
$finalContent = Get-Content -Path $filePath -Raw
if ($finalContent.EndsWith("`n`n")) {
    # Remove extra newline at the end
    $finalContent = $finalContent.Substring(0, $finalContent.Length - 1)
} elseif (-not $finalContent.EndsWith("`n")) {
    # Add a newline if missing
    $finalContent += "`n"
}

# Write the fixed content back to the file
Set-Content -Path $filePath -Value $finalContent -NoNewline
Add-Content -Path $filePath -Value ""  # Add a single newline at the end

Write-Host "Lint issue also fixed in $filePath"

