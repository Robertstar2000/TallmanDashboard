# PowerShell script to fix the POR SQL expressions in complete-chart-data.ts
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
$logPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\fix-por-sql-expressions.log"

# Start logging
Start-Transcript -Path $logPath

# Create a backup of the current file
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

# Read the file content
$fileContent = Get-Content -Path $filePath -Raw

# Regular expression pattern to find multiline SQL expressions in POR entries
$pattern = '("sqlExpression":\s*"SELECT[^"]*?)(\r?\n\s*RentalDate\r?\n\s*\][^"]*?)(\r?\n\s*RentalDate\r?\n\s*\][^"]*?)(")'

# Function to replace multiline SQL with properly escaped SQL
function Fix-SqlExpression {
    param (
        [string]$match
    )
    
    # Extract the parts of the match
    $start = $matches[1]
    $middle1 = $matches[2]
    $middle2 = $matches[3]
    $end = $matches[4]
    
    # Replace newlines and extra whitespace with a single space
    $middle1Clean = $middle1 -replace '\r?\n\s*', ' '
    $middle2Clean = $middle2 -replace '\r?\n\s*', ' '
    
    # Combine the parts back together
    return "$start$middle1Clean$middle2Clean$end"
}

# Count the number of POR entries
$porCount = [regex]::Matches($fileContent, '"serverName":\s*"POR"').Count
Write-Host "Found $porCount POR entries in the file"

# Count the number of multiline SQL expressions
$multilineCount = [regex]::Matches($fileContent, $pattern).Count
Write-Host "Found $multilineCount multiline SQL expressions that need fixing"

# Replace all instances of the pattern
$newContent = $fileContent -replace $pattern, {
    Fix-SqlExpression -match $matches[0]
}

# Fix any remaining multiline SQL expressions with a more general pattern
$generalPattern = '("sqlExpression":\s*"[^"]*?)(\r?\n\s*[^"]*?)(")'
$newContent = $newContent -replace $generalPattern, {
    $start = $matches[1]
    $middle = $matches[2]
    $end = $matches[3]
    
    # Replace newlines and extra whitespace with a single space
    $middleClean = $middle -replace '\r?\n\s*', ' '
    
    # Combine the parts back together
    return "$start$middleClean$end"
}

# Write the updated content back to the file
Set-Content -Path $filePath -Value $newContent -NoNewline
Add-Content -Path $filePath -Value "" # Add a single newline at the end

# Verify the update
$verifyContent = Get-Content -Path $filePath -Raw
$verifyPorCount = [regex]::Matches($verifyContent, '"serverName":\s*"POR"').Count
$verifyMultilineCount = [regex]::Matches($verifyContent, $pattern).Count

Write-Host "`nVerification:"
Write-Host "POR entries found after update: $verifyPorCount (expected: $porCount)"
Write-Host "Multiline SQL expressions remaining: $verifyMultilineCount (expected: 0)"

Write-Host "`nPOR SQL expression formatting completed!"
Stop-Transcript

