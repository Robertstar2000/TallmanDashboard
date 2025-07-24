# Start development server with environment variables
$env:LANG = "en_US.UTF-8"
$env:POR_Path = "\\ts03\POR\POR.MDB"
$env:JWT_SECRET = "tallman_dashboard_secret_key"

Write-Host "Starting Next.js development server on port 60005..." -ForegroundColor Green
Write-Host "Environment variables set:" -ForegroundColor Cyan
Write-Host "  LANG: $env:LANG" -ForegroundColor Yellow
Write-Host "  POR_Path: $env:POR_Path" -ForegroundColor Yellow
Write-Host "  JWT_SECRET: $env:JWT_SECRET" -ForegroundColor Yellow

try {
    # Start the Next.js development server
    & npx next dev -p 60005
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}
