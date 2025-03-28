# PowerShell script to verify SQL updates
# This script checks if all P21 entries have been updated and all POR entries have been preserved

# Configuration
$filePath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$logPath = "C:\Users\BobM\CascadeProjects\TallmanDashboard_new\scripts\verify-sql-updates.log"

# Start logging
Start-Transcript -Path $logPath -Append
Write-Host "Starting SQL update verification at $(Get-Date)"

# Define patterns to check for updated SQL expressions
$p21Patterns = @(
    "dbo\.\w+ WITH \(NOLOCK\)",
    "GETDATE\(\)",
    "as value"
)

$porPatterns = @(
    "Count\(\*\) as value",
    "Date\(\)",
    "Month\(",
    "Year\("
)

# Read the file content
$fileContent = Get-Content -Path $filePath -Raw
$entries = [regex]::Matches($fileContent, '{\s*"id":\s*"(\d+)".*?"serverName":\s*"(P21|POR)".*?"productionSqlExpression":\s*"([^"]+)"', [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Initialize counters
$totalP21 = 0
$totalPOR = 0
$updatedP21 = 0
$preservedPOR = 0
$problemEntries = @()

# Process each entry
foreach ($entry in $entries) {
    $id = [int]$entry.Groups[1].Value
    $server = $entry.Groups[2].Value
    $sql = $entry.Groups[3].Value
    
    if ($server -eq "P21") {
        $totalP21++
        $isUpdated = $true
        
        # Check if the SQL expression matches all P21 patterns
        foreach ($pattern in $p21Patterns) {
            if (-not ($sql -match $pattern)) {
                $isUpdated = $false
                break
            }
        }
        
        if ($isUpdated) {
            $updatedP21++
        } else {
            $problemEntries += [PSCustomObject]@{
                Id = $id
                Server = $server
                Status = "Not properly updated"
                SQL = $sql
            }
        }
    } elseif ($server -eq "POR") {
        $totalPOR++
        $isPreserved = $true
        
        # Check if the SQL expression does NOT contain P21-specific patterns
        if ($sql -match "dbo\." -or $sql -match "WITH \(NOLOCK\)" -or $sql -match "GETDATE\(\)") {
            $isPreserved = $false
        }
        
        if ($isPreserved) {
            $preservedPOR++
        } else {
            $problemEntries += [PSCustomObject]@{
                Id = $id
                Server = $server
                Status = "Not properly preserved"
                SQL = $sql
            }
        }
    }
}

# Write summary
Write-Host "`nSummary:"
Write-Host "Total P21 entries: $totalP21"
Write-Host "Updated P21 entries: $updatedP21"
Write-Host "Total POR entries: $totalPOR"
Write-Host "Preserved POR entries: $preservedPOR"

# Display problem entries
if ($problemEntries.Count -gt 0) {
    Write-Host "`nProblem entries:"
    foreach ($entry in $problemEntries) {
        Write-Host "ID: $($entry.Id), Server: $($entry.Server), Status: $($entry.Status)" -ForegroundColor Yellow
        Write-Host "  SQL: $($entry.SQL)" -ForegroundColor Cyan
        Write-Host ""
    }
} else {
    Write-Host "`nAll entries have been properly updated or preserved!" -ForegroundColor Green
}

Write-Host "SQL update verification completed at $(Get-Date)"
Stop-Transcript
