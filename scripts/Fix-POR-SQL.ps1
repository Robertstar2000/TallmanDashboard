param(
    [string]$AllDataPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'allData.json')
)

Write-Host "Fix-POR-SQL: Starting update for POR Historical metrics (ids 85–96)" -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $AllDataPath)) {
    throw "allData.json not found at: $AllDataPath"
}

# Read JSON
$jsonText = Get-Content -LiteralPath $AllDataPath -Raw -ErrorAction Stop
try {
    $data = $jsonText | ConvertFrom-Json -ErrorAction Stop
} catch {
    throw "Failed to parse JSON. $_"
}

if (-not ($data -is [System.Collections.IEnumerable])) {
    throw "Expected top-level JSON array in allData.json"
}

# Backup original
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = "$AllDataPath.$timestamp.bak"
Copy-Item -LiteralPath $AllDataPath -Destination $backupPath -Force
Write-Host "Backup created:" $backupPath -ForegroundColor Yellow

# Helper to convert SQL Server date funcs to Access
function Convert-ToAccessSql {
    param([string]$sql)
    if ([string]::IsNullOrWhiteSpace($sql)) { return $sql }

    $converted = $sql
    # Replace GETDATE() -> DATE()
    $converted = $converted -replace "GETDATE\(\)", "DATE()"
    # Normalize YEAR( ... ) spacing/case
    $converted = $converted -replace "YEAR\(\s*DATE\(\)\s*\)", "YEAR(DATE())"
    # Normalize MONTH( ... ) spacing/case
    $converted = $converted -replace "MONTH\(", "MONTH("

    # Optional: Access sometimes needs square brackets for names with spaces - not applicable here

    return $converted
}

$updatedCount = 0
$idsTouched = @()

foreach ($item in $data) {
    if ($null -ne $item.id -and $item.id -ge 85 -and $item.id -le 96) {
        if ($item.chartGroup -eq 'HISTORICAL_DATA' -and ($item.dataPoint -like 'POR Sales*')) {
            # Update server
            if ($item.serverName -ne 'POR') {
                $item.serverName = 'POR'
            }
            # Convert SQL
            $origSql = [string]$item.productionSqlExpression
            $newSql = Convert-ToAccessSql -sql $origSql
            if ($newSql -ne $origSql) {
                $item.productionSqlExpression = $newSql
            }
            $updatedCount++
            $idsTouched += $item.id
        }
    }
}

if ($updatedCount -eq 0) {
    Write-Warning "No matching POR Historical records (ids 85–96) found to update. Nothing changed."
    return
}

# Write JSON back prettified
$jsonOut = $data | ConvertTo-Json -Depth 15

# Validate round-trip
try {
    $null = $jsonOut | ConvertFrom-Json -ErrorAction Stop
} catch {
    throw "Validation failed after conversion to JSON. Aborting write. $_"
}

# Save
Set-Content -LiteralPath $AllDataPath -Value $jsonOut -Encoding UTF8

Write-Host "Updated $updatedCount items (ids: $((($idsTouched | Sort-Object) -join ', ')))" -ForegroundColor Green

# Show a quick summary of a couple of updated entries
$data | Where-Object { $_.id -ge 85 -and $_.id -le 96 } | Select-Object id, serverName, dataPoint, productionSqlExpression | Format-Table -AutoSize

Write-Host "Done. You may want to restart backend services to pick up changes (e.g., scripts\\Restart-All.ps1)." -ForegroundColor Cyan
