# PowerShell script to fix the POR SQL expressions in complete-chart-data.ts
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$backupPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts.backup-direct-$(Get-Date -Format 'yyyyMMddHHmmss')"
$logPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\fix-por-sql-direct.log"

# Start logging
Start-Transcript -Path $logPath

Write-Host "Starting POR SQL expression fix at $(Get-Date)"

# Create a backup of the current file
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Created backup at $backupPath"

# Read the file content as lines
$lines = Get-Content -Path $filePath

# Initialize variables
$inPorEntry = $false
$inSqlExpression = $false
$sqlStartLine = 0
$sqlEndLine = 0
$porCount = 0
$fixedCount = 0
$newLines = @()

# Process each line
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $addLine = $true
    
    # Check if we're starting a new entry
    if ($line -match '^\s*\{') {
        $inPorEntry = $false
        $inSqlExpression = $false
    }
    
    # Check if this is a POR entry
    if ($line -match '"serverName":\s*"POR"') {
        $inPorEntry = $true
        $porCount++
    }
    
    # Check if we're starting a SQL expression in a POR entry
    if ($inPorEntry -and $line -match '"productionSqlExpression":\s*"') {
        $inSqlExpression = $true
        $sqlStartLine = $i
        
        # Check if the SQL expression is multiline (doesn't end with ")
        if (-not $line.TrimEnd().EndsWith('"')) {
            # Find the end of the SQL expression
            for ($j = $i + 1; $j -lt $lines.Count; $j++) {
                if ($lines[$j].Contains('"')) {
                    $sqlEndLine = $j
                    break
                }
            }
            
            # If we found the end of the SQL expression
            if ($sqlEndLine > $sqlStartLine) {
                $fixedCount++
                
                # Extract the SQL expression
                $sqlExpression = $line
                for ($j = $sqlStartLine + 1; $j -le $sqlEndLine; $j++) {
                    $sqlExpression += " " + $lines[$j].Trim()
                }
                
                # Fix the SQL expression by replacing it with a single line
                $fixedSql = $sqlExpression -replace '\s+', ' '
                $newLines += $fixedSql
                
                # Skip the lines that were part of the multiline SQL expression
                $i = $sqlEndLine
                $addLine = $false
                
                Write-Host "Fixed multiline SQL expression in POR entry #$porCount"
            }
        }
    }
    
    # Add the line to our new content if it wasn't part of a fixed multiline SQL expression
    if ($addLine) {
        $newLines += $line
    }
}

# Write the updated content back to the file
Set-Content -Path $filePath -Value $newLines

# Verify the update
$verifyContent = Get-Content -Path $filePath -Raw
$verifyPorCount = [regex]::Matches($verifyContent, '"serverName":\s*"POR"').Count
$verifyMultilineCount = [regex]::Matches($verifyContent, '"productionSqlExpression":\s*"[^"]*?\r?\n\s*[^"]*?"').Count

Write-Host "`nVerification:"
Write-Host "POR entries found: $porCount"
Write-Host "POR entries with multiline SQL fixed: $fixedCount"
Write-Host "POR entries found after update: $verifyPorCount (expected: $porCount)"
Write-Host "Multiline SQL expressions remaining: $verifyMultilineCount (expected: 0)"

Write-Host "`nPOR SQL expression formatting completed at $(Get-Date)!"
Stop-Transcript
