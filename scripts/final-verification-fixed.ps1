# PowerShell script to verify SQL expressions match their server types
# This script checks if all P21 entries have P21 SQL syntax and all POR entries have POR SQL syntax

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\final-verification-fixed.log"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting final SQL verification at $(Get-Date)"

# Read the file content
$fileContent = Get-Content -Path $filePath -Raw
$entries = [regex]::Matches($fileContent, '{\s*"id":\s*"(\d+)".*?"serverName":\s*"(P21|POR)".*?"productionSqlExpression":\s*"([^"]+)"', [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Initialize counters
$totalP21 = 0
$totalPOR = 0
$mismatchedEntries = @()

# Process each entry
foreach ($entry in $entries) {
    $id = [int]$entry.Groups[1].Value
    $server = $entry.Groups[2].Value
    $sql = $entry.Groups[3].Value
    
    if ($server -eq "P21") {
        $totalP21++
        $isP21Syntax = $false
        
        # Check if the SQL expression has P21 syntax
        if ($sql -match "dbo\." -and $sql -match "WITH \(NOLOCK\)" -and $sql -match "GETDATE\(\)") {
            $isP21Syntax = $true
        }
        
        if (-not $isP21Syntax) {
            $mismatchedEntries += [PSCustomObject]@{
                Id = $id
                Server = $server
                Status = "P21 entry with non-P21 SQL syntax"
                SQL = $sql
            }
        }
    } 
    elseif ($server -eq "POR") {
        $totalPOR++
        $isPORSyntax = $true
        
        # Check if the SQL expression has P21 syntax (which it shouldn't)
        if ($sql -match "dbo\." -or $sql -match "WITH \(NOLOCK\)" -or $sql -match "GETDATE\(\)") {
            $isPORSyntax = $false
            $mismatchedEntries += [PSCustomObject]@{
                Id = $id
                Server = $server
                Status = "POR entry with P21 SQL syntax"
                SQL = $sql
            }
        }
    }
}

# Write summary
Write-Host "`nSummary:"
Write-Host "Total P21 entries: $totalP21"
Write-Host "Total POR entries: $totalPOR"
Write-Host "Mismatched entries: $($mismatchedEntries.Count)"

# Display mismatched entries
if ($mismatchedEntries.Count -gt 0) {
    Write-Host "`nEntries with mismatched SQL syntax:"
    foreach ($entry in $mismatchedEntries) {
        Write-Host "ID: $($entry.Id), Server: $($entry.Server), Status: $($entry.Status)" -ForegroundColor Yellow
        Write-Host "  SQL: $($entry.SQL)" -ForegroundColor Cyan
        Write-Host ""
    }
} else {
    Write-Host "`nAll entries now have properly matched server names and SQL syntax!" -ForegroundColor Green
}

Write-Host "Final SQL verification completed at $(Get-Date)"
Stop-Transcript
