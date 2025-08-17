param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$AllDataPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'allData.json')
)

Write-Host "Validate-And-Fix-Metrics: Starting" -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $AllDataPath)) {
    throw "allData.json not found at: $AllDataPath"
}

# Pre-run backup
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$preBackup = "$AllDataPath.$timestamp.pre.bak"
Copy-Item -LiteralPath $AllDataPath -Destination $preBackup -Force
Write-Host "Pre-backup created:" $preBackup -ForegroundColor Yellow

# Build Node script path
$nodeScript = Join-Path $ProjectRoot 'backend\tools\validateAndFixMetrics.mjs'
if (-not (Test-Path -LiteralPath $nodeScript)) {
    throw "Validator script not found at: $nodeScript"
}

# Run Node validator
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'node'
$psi.Arguments = '"' + $nodeScript + '"'
$psi.WorkingDirectory = $ProjectRoot
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi
$proc.EnableRaisingEvents = $true

# Attach live stream handlers
$proc.add_OutputDataReceived({ param($s,$e) if ($e.Data) { Write-Host $e.Data } })
$proc.add_ErrorDataReceived({ param($s,$e) if ($e.Data) { Write-Host $e.Data -ForegroundColor DarkYellow } })

# Start and begin async reads
$null = $proc.Start()
$proc.BeginOutputReadLine()
$proc.BeginErrorReadLine()

# Wait for completion
$proc.WaitForExit()

$exitCode = $proc.ExitCode
if ($exitCode -ne 0) {
    Write-Warning "Validator exited with code $exitCode. Review output above."
}

# Post summary
Write-Host "Validate-And-Fix-Metrics: Finished with code $exitCode" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot"
Write-Host "allData.json: $AllDataPath"
Write-Host "Node Script: $nodeScript"
