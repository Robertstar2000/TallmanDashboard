param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

Write-Host "Dump-Schemas: Starting" -ForegroundColor Cyan

# Resolve paths
$nodeScript = Join-Path $ProjectRoot 'backend\tools\dumpSchemas.mjs'
if (-not (Test-Path -LiteralPath $nodeScript)) {
    throw "Schema dumper not found at: $nodeScript"
}

# Expected outputs
$p21Out = Join-Path $ProjectRoot 'schemas-P21.json'
$porOut = Join-Path $ProjectRoot 'schemas-POR.json'

# Run Node
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

# Live output
$proc.add_OutputDataReceived({ param($s,$e) if ($e.Data) { Write-Host $e.Data } })
$proc.add_ErrorDataReceived({ param($s,$e) if ($e.Data) { Write-Host $e.Data -ForegroundColor DarkYellow } })

$null = $proc.Start()
$proc.BeginOutputReadLine()
$proc.BeginErrorReadLine()
$proc.WaitForExit()

$exitCode = $proc.ExitCode
if ($exitCode -ne 0) {
    Write-Warning "dumpSchemas exited with code $exitCode. Review output above."
}

# Summarize
$existsP21 = Test-Path -LiteralPath $p21Out
$existsPOR = Test-Path -LiteralPath $porOut
Write-Host "Dump-Schemas: Finished with code $exitCode" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot"
Write-Host "P21 Schema: $p21Out (exists: $existsP21)"
Write-Host "POR Schema: $porOut (exists: $existsPOR)"
