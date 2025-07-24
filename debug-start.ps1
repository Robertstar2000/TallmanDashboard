# Debug start script with verbose output
$env:LANG = "en_US.UTF-8"
$env:POR_Path = "\\ts03\POR\POR.MDB"
$env:JWT_SECRET = "tallman_dashboard_secret_key"
$env:NODE_ENV = "development"

Write-Host "=== Debug Start Script ===" -ForegroundColor Green
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Node version: $(node --version)" -ForegroundColor Cyan
Write-Host "NPM version: $(npm --version)" -ForegroundColor Cyan

Write-Host "`nEnvironment variables:" -ForegroundColor Yellow
Write-Host "  LANG: $env:LANG"
Write-Host "  POR_Path: $env:POR_Path"
Write-Host "  JWT_SECRET: $env:JWT_SECRET"
Write-Host "  NODE_ENV: $env:NODE_ENV"

Write-Host "`nStarting Next.js with verbose output..." -ForegroundColor Green

Write-Host "`nStarting Next.js development server..." -ForegroundColor Green

try {
    # Start Next.js development server
    & npx next dev -p 60005
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}
