Write-Host "Installing MCP server dependencies..." -ForegroundColor Green
Set-Location "C:\Users\BobM\Desktop\TallmanDashboard\mcp-servers"
npm install --timeout=30000
Write-Host "Dependencies installed!" -ForegroundColor Green