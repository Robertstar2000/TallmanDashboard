param(
    [Parameter(Mandatory=$false)]
    [string]$JsonPath = "c:\Users\BobM\Desktop\TallmanDashboard\allData.json"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $JsonPath)) {
    throw "File not found: $JsonPath"
}

# Backup
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = "$JsonPath.bak-$ts"
Copy-Item -LiteralPath $JsonPath -Destination $backupPath -Force
Write-Host "Backup created: $backupPath"

# Load JSON
$jsonText = Get-Content -LiteralPath $JsonPath -Raw
$data = $jsonText | ConvertFrom-Json
if ($null -eq $data) {
    throw "Failed to parse JSON at $JsonPath"
}

$targets = @('DAILY_ORDERS','CUSTOMER_METRICS','WEB_ORDERS')
$updated = 0

# Optional: print sample before
$sampleBefore = $data | Where-Object { $targets -contains $_.chartGroup } | Select-Object -First 5 |
    ForEach-Object { "ID=$($_.id) Value=$($_.value) Group=$($_.chartGroup)" }
if ($sampleBefore) {
    Write-Host "Sample before:"
    $sampleBefore | ForEach-Object { Write-Host "  $_" }
}

foreach ($row in $data) {
    if ($row.chartGroup -and $targets -contains [string]$row.chartGroup) {
        $row.value = 99999
        if ([string]::IsNullOrWhiteSpace([string]$row.productionSqlExpression)) {
            $row.productionSqlExpression = ''
        }
        $updated++
    }
}

# Save JSON
$data | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $JsonPath -Encoding UTF8

# Verify
$data2 = (Get-Content -LiteralPath $JsonPath -Raw) | ConvertFrom-Json
$sampleAfter = $data2 | Where-Object { $targets -contains $_.chartGroup } | Select-Object -First 5 |
    ForEach-Object { "ID=$($_.id) Value=$($_.value) Group=$($_.chartGroup)" }

Write-Host "Updated rows: $updated"
if ($sampleAfter) {
    Write-Host "Sample after:"
    $sampleAfter | ForEach-Object { Write-Host "  $_" }
}

Write-Host "Done."
