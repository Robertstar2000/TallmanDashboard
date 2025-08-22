# Start P21 MCP Server directly for Windsurf MCP tool testing
Write-Host "Starting P21 MCP Server for Windsurf..." -ForegroundColor Cyan

# Change to P21 package directory
Set-Location "P21-MCP-Server-Package"

# Build the server
Write-Host "Building P21 MCP Server..." -ForegroundColor Yellow
& npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
    
    # Start the MCP server
    Write-Host "Starting P21 MCP Server..." -ForegroundColor Yellow
    Write-Host "Server will run until you press Ctrl+C" -ForegroundColor Gray
    
    & node build/index.js
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
}
