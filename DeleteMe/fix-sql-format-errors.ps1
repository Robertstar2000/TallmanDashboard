# PowerShell script to fix SQL expression formatting errors in complete-chart-data.ts
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.before-fix"
$tempFilePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.temp.ts"

# Create a backup
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

# Read the file content
$content = Get-Content -Path $filePath -Raw

# First, let's fix the POR SQL expressions by properly escaping the multi-line strings
$pattern = '("productionSqlExpression": ")([^"]*?\[[\s\r\n]+[^\]]+[\s\r\n]+\][^"]*?)(")'
$replacement = {
    param($match)
    $prefix = $match.Groups[1].Value
    $sql = $match.Groups[2].Value
    $suffix = $match.Groups[3].Value
    
    # Replace newlines with escaped newlines
    $fixedSql = $sql -replace "`r`n", "\\n" -replace "`n", "\\n"
    # Fix any square brackets with proper escaping
    $fixedSql = $fixedSql -replace '\[\s*(\w+)\s*\]', '[$1]'
    
    return $prefix + $fixedSql + $suffix
}

$fixedContent = [regex]::Replace($content, $pattern, $replacement, "Singleline")

# Write the fixed content to a temporary file
Set-Content -Path $tempFilePath -Value $fixedContent

# Verify the temp file
try {
    # Test if the file is valid JSON when wrapped in an object
    $testJson = "{" + (Get-Content -Path $tempFilePath -Raw) + "}"
    $null = ConvertFrom-Json -InputObject $testJson -ErrorAction Stop
    
    # If we get here, the JSON is valid
    Write-Host "Fixed file appears to be valid JSON."
    
    # Replace the original file with the fixed one
    Copy-Item -Path $tempFilePath -Destination $filePath -Force
    Write-Host "Successfully fixed SQL expression formatting in $filePath"
} catch {
    Write-Host "Error: The fixed file contains invalid JSON. Not replacing the original file."
    Write-Host "Error details: $_"
    exit 1
}

# Clean up
Remove-Item -Path $tempFilePath -Force
Write-Host "Removed temp file"

Write-Host "SQL expression formatting fix completed!"
