# PowerShell script to kill conflicting processes, start TallmanDashboard (Next.js), IIS, and test/report status
# Run as Administrator for best results

Write-Host "[INFO] Stopping any process using port 60005..." -ForegroundColor Cyan
try {
    $pids = Get-NetTCPConnection -LocalPort 60005 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($pids) {
        foreach ($procId in $pids) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "[INFO] Stopped process $procId using port 60005." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[INFO] No process found on port 60005." -ForegroundColor Green
    }
} catch {
    Write-Host "[WARN] Could not stop all processes on port 60005. Try running as Administrator." -ForegroundColor Red
}

Write-Host "[INFO] Stopping any orphaned Node.js processes..." -ForegroundColor Cyan
try {
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[INFO] Stopped all node processes." -ForegroundColor Yellow
} catch {
    Write-Host "[WARN] Could not stop all node processes." -ForegroundColor Red
}

# Start IIS (if not already running)
Write-Host "[INFO] Starting IIS service..." -ForegroundColor Cyan
try {
    Start-Service -Name W3SVC -ErrorAction SilentlyContinue
    Write-Host "[INFO] IIS started." -ForegroundColor Green
} catch {
    Write-Host "[WARN] Could not start IIS. It may already be running or unavailable." -ForegroundColor Red
}

# Start the Next.js dev server
Write-Host "[INFO] Starting TallmanDashboard dev server (npm run dev)..." -ForegroundColor Cyan
# Set environment variables
$env:POR_Path = "\\ts03\POR\POR.MDB"
$env:JWT_SECRET = "tallman_dashboard_secret_key"
$env:LANG = "en_US.UTF-8"
Write-Host "[INFO] Set POR_Path to $env:POR_Path" -ForegroundColor Cyan
Write-Host "[INFO] Set JWT_SECRET environment variable" -ForegroundColor Cyan
Write-Host "[INFO] Set LANG to $env:LANG" -ForegroundColor Cyan

# Start the process with environment variables properly set
Start-Process powershell -ArgumentList '-NoExit', '-Command', "npm run dev" -WorkingDirectory "$PSScriptRoot\.."

# Wait for the server to start and test
Start-Sleep -Seconds 10

Write-Host "[INFO] Testing if http://localhost:60005 is up..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:60005' -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] TallmanDashboard is running at http://localhost:60005" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] TallmanDashboard did not start successfully. Status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Could not connect to http://localhost:60005. Check server logs for details." -ForegroundColor Red
}

Write-Host "[INFO] Startup script completed." -ForegroundColor Cyan
