#!/usr/bin/env pwsh

Write-Host "Waiting for npm install to complete..." -ForegroundColor Yellow

# Wait for npm install to complete
do {
    Start-Sleep -Seconds 5
    $npmProcess = Get-Process -Name "npm" -ErrorAction SilentlyContinue
    if ($npmProcess) {
        Write-Host "npm install still running..." -ForegroundColor Yellow
    }
} while ($npmProcess)

Write-Host "npm install completed, checking node_modules..." -ForegroundColor Green

# Check if essential packages are installed
$essentialPackages = @("next", "react", "react-dom")
$allInstalled = $true

foreach ($package in $essentialPackages) {
    if (!(Test-Path "node_modules\$package")) {
        Write-Host "Missing package: $package" -ForegroundColor Red
        $allInstalled = $false
    } else {
        Write-Host "Found package: $package" -ForegroundColor Green
    }
}

if (!$allInstalled) {
    Write-Host "Some essential packages are missing. Installing them now..." -ForegroundColor Yellow
    npm install next react react-dom --no-optional
}

# Kill any existing processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Start the development server
Write-Host "Starting Next.js development server..." -ForegroundColor Green
Write-Host "URL: http://localhost:5500" -ForegroundColor Cyan

try {
    npx next dev -p 5500
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
