# PowerShell script to fix the POR SQL expressions in complete-chart-data.ts
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
$logPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\fix-por-sql-improved.log"

# Start logging
Start-Transcript -Path $logPath

Write-Host "Starting POR SQL expression fix at $(Get-Date)"

# Create a backup of the current file
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

# Read the file content
$fileContent = Get-Content -Path $filePath -Raw

# Split the file content into individual JSON objects
$jsonObjects = $fileContent -split '(\{\s*"id":\s*"[^"]+")' | Where-Object { $_ -ne "" }

# Initialize counters
$porCount = 0
$fixedCount = 0
$totalCount = 0

# Initialize the new content with the first part of the file (before the first JSON object)
$newContent = $jsonObjects[0]

# Process each JSON object
for ($i = 1; $i -lt $jsonObjects.Count; $i += 2) {
    $totalCount++
    $objectStart = $jsonObjects[$i]
    $objectBody = $jsonObjects[$i + 1]
    
    # Check if this is a POR entry
    if ($objectBody -match '"serverName":\s*"POR"') {
        $porCount++
        
        # Check if this object has a multiline SQL expression
        if ($objectBody -match '"productionSqlExpression":\s*"([^"]*?)(\r?\n\s*[^"]*?)+"') {
            $fixedCount++
            
            # Extract the SQL expression
            if ($objectBody -match '"productionSqlExpression":\s*"(.*?)(?=",)') {
                $sqlExpression = $matches[1]
                
                # Fix the SQL expression by replacing newlines with spaces
                $fixedSql = $sqlExpression -replace '\r?\n\s*', ' '
                
                # Replace the original SQL expression with the fixed one
                $objectBody = $objectBody -replace [regex]::Escape($sqlExpression), $fixedSql
                
                Write-Host "Fixed multiline SQL expression in POR entry #$porCount"
            }
        }
    }
    
    # Add this object to the new content
    $newContent += $objectStart + $objectBody
}

# Write the updated content back to the file
Set-Content -Path $filePath -Value $newContent -NoNewline
Add-Content -Path $filePath -Value "" # Add a single newline at the end

# Verify the update
$verifyContent = Get-Content -Path $filePath -Raw
$verifyPorCount = [regex]::Matches($verifyContent, '"serverName":\s*"POR"').Count
$verifyMultilineCount = [regex]::Matches($verifyContent, '"productionSqlExpression":\s*"[^"]*?\r?\n\s*[^"]*?"').Count

Write-Host "`nVerification:"
Write-Host "Total entries processed: $totalCount"
Write-Host "POR entries found: $porCount"
Write-Host "POR entries with multiline SQL fixed: $fixedCount"
Write-Host "POR entries found after update: $verifyPorCount (expected: $porCount)"
Write-Host "Multiline SQL expressions remaining: $verifyMultilineCount (expected: 0)"

Write-Host "`nPOR SQL expression formatting completed at $(Get-Date)!"
Stop-Transcript
