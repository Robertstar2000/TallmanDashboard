param(
  [string]$Root = "C:\Users\BobM\Desktop\TallmanDashboard"
)

Write-Host "Stopping previous Node processes..." -ForegroundColor Yellow

# Stop backend by matching server.js path
Get-Process node -ErrorAction SilentlyContinue |
  ForEach-Object {
    try {
      $wmi = Get-WmiObject Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue
      if ($wmi -and $wmi.CommandLine -and ($wmi.CommandLine -match "backend\\server.js")) {
        Write-Host "Stopping backend node pid $($_.Id)" -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force
      }
    } catch {}
  }

# Optional: stop any long-running MCP node processes if they exist
Get-Process node -ErrorAction SilentlyContinue |
  ForEach-Object {
    try {
      $wmi = Get-WmiObject Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue
      if ($wmi -and $wmi.CommandLine) {
        if ($wmi.CommandLine -match "P21.*MCP" -or $wmi.CommandLine -match "POR.*MCP") {
          Write-Host "Stopping MCP node pid $($_.Id)" -ForegroundColor Yellow
          Stop-Process -Id $_.Id -Force
        }
      }
    } catch {}
  }

Write-Host "Building frontend with Vite..." -ForegroundColor Cyan
Set-Location $Root
npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Error "Frontend build failed. Aborting."
  exit 1
}

# Verify dist output exists
if (-not (Test-Path "$Root\dist\index.html")) {
  Write-Error "Build output not found at $Root\dist\index.html"
  exit 1
}

# Ensure production environment for backend (for this process too)
$env:NODE_ENV = "production"

Write-Host "Starting backend server (serves API and frontend)..." -ForegroundColor Cyan
# Start backend in a new window that stays open, with production env. Escape $ so child sets it.
$cmd = "`$env:NODE_ENV='production'; node .\backend\server.js"
Start-Process -FilePath "powershell" -WorkingDirectory $Root -ArgumentList @("-NoExit", "-Command", $cmd) -WindowStyle Normal

Write-Host "" 
Write-Host "Done. Open the app and verify endpoints:" -ForegroundColor Green
Write-Host "APP http://localhost:3001" -ForegroundColor Green
Write-Host "GET http://localhost:3001/api/connections/status"
Write-Host "POST http://localhost:3001/api/mcp/execute-query"
