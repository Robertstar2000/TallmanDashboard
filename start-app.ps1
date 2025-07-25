#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Green
Write-Host "Starting Tallman Dashboard Application" -ForegroundColor Green
Write-Host "Time: $(Get-Date)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Change to the correct directory
Set-Location "c:\Users\BobM\TallmanDashboard"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Kill existing processes on port 5500
Write-Host "Checking for existing processes on port 5500..." -ForegroundColor Yellow
try {
    $processes = Get-NetTCPConnection -LocalPort 5500 -ErrorAction SilentlyContinue
    if ($processes) {
        foreach ($process in $processes) {
            Write-Host "Killing process $($process.OwningProcess)" -ForegroundColor Yellow
            Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
} catch {
    Write-Host "No processes found on port 5500" -ForegroundColor Green
}

# Create cache refresh markers
Write-Host "Creating cache refresh markers..." -ForegroundColor Yellow
if (!(Test-Path "data")) { New-Item -ItemType Directory -Path "data" -Force }
Get-Date | Out-File "data\refresh_required" -Encoding UTF8
Get-Date | Out-File "data\cache-refresh.txt" -Encoding UTF8
@{timestamp=(Get-Date); reason="Application startup"} | ConvertTo-Json | Out-File "data\force_refresh.json" -Encoding UTF8

# Clear Next.js cache
Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
try {
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "ERROR: npm install failed - $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start the application
Write-Host "" 
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TALLMAN DASHBOARD STARTING" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:5500" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    npx next dev -p 5500
} catch {
    Write-Host "ERROR: Server failed to start - $_" -ForegroundColor Red
    Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   SERVER STOPPED" -ForegroundColor Red
    Write-Host "   Time: $(Get-Date)" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
