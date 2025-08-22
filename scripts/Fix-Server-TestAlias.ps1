# Fix-Server-TestAlias.ps1
# Safely updates backend/server.js to use 'SELECT 1 as value' for MCP status checks
# Creates a timestamped backup before modifying.

$ErrorActionPreference = 'Stop'

# Determine server.js path relative to this script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
$serverPath = Join-Path $repoRoot 'backend\server.js'

if (-not (Test-Path $serverPath)) {
    Write-Error "server.js not found at $serverPath"
}

# Read file
$content = Get-Content -Raw -LiteralPath $serverPath -Encoding UTF8

# Create backup
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = "$serverPath.bak-$timestamp"
Set-Content -LiteralPath $backupPath -Value $content -Encoding UTF8
Write-Output "Backup created: $backupPath"

# Replace patterns
$updated = $content -replace "SELECT\s+1\s+as\s+test_connection","SELECT 1 as value"

if ($updated -ne $content) {
    Set-Content -LiteralPath $serverPath -Value $updated -Encoding UTF8
    Write-Output "Updated $serverPath (replaced test_connection alias to value)"
} else {
    Write-Output "No changes needed (pattern not found)."
}
