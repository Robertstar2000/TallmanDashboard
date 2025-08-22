# Diagnose Node.js execution issues
Write-Host "=== Node.js Execution Diagnosis ===" -ForegroundColor Green

# Check Node.js installation
Write-Host "`n1. Node.js Installation Check:" -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found or not accessible" -ForegroundColor Red
}

# Check npm installation
Write-Host "`n2. NPM Installation Check:" -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ NPM version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ NPM not found or not accessible" -ForegroundColor Red
}

# Check PATH environment
Write-Host "`n3. PATH Environment Check:" -ForegroundColor Yellow
$pathEntries = $env:PATH -split ';'
$nodeInPath = $pathEntries | Where-Object { $_ -like "*node*" }
if ($nodeInPath) {
    Write-Host "✅ Node.js paths found in PATH:" -ForegroundColor Green
    $nodeInPath | ForEach-Object { Write-Host "  - $_" -ForegroundColor Cyan }
} else {
    Write-Host "⚠️  No Node.js paths found in PATH" -ForegroundColor Yellow
}

# Check running Node.js processes
Write-Host "`n4. Running Node.js Processes:" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ Found $($nodeProcesses.Count) Node.js processes:" -ForegroundColor Green
    $nodeProcesses | ForEach-Object { 
        Write-Host "  - PID: $($_.Id), CPU: $($_.CPU), Memory: $([math]::Round($_.WorkingSet64/1MB, 2))MB" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No Node.js processes currently running" -ForegroundColor Yellow
}

# Check for hung processes
Write-Host "`n5. Process Resource Usage:" -ForegroundColor Yellow
$allNodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($allNodeProcesses) {
    foreach ($proc in $allNodeProcesses) {
        $cpuTime = $proc.TotalProcessorTime.TotalSeconds
        $memoryMB = [math]::Round($proc.WorkingSet64/1MB, 2)
        
        if ($cpuTime -gt 30) {
            Write-Host "⚠️  High CPU process - PID: $($proc.Id), CPU Time: $([math]::Round($cpuTime, 2))s" -ForegroundColor Yellow
        }
        if ($memoryMB -gt 500) {
            Write-Host "⚠️  High Memory process - PID: $($proc.Id), Memory: ${memoryMB}MB" -ForegroundColor Yellow
        }
    }
}

# Test simple Node.js execution
Write-Host "`n6. Simple Node.js Execution Test:" -ForegroundColor Yellow
try {
    $testResult = node -e "console.log('Node.js execution test successful'); process.exit(0);" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js execution test passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js execution test failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Output: $testResult" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Node.js execution test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check for package.json and dependencies
Write-Host "`n7. Project Dependencies Check:" -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✅ package.json found" -ForegroundColor Green
    if (Test-Path "node_modules") {
        Write-Host "✅ node_modules directory exists" -ForegroundColor Green
        $moduleCount = (Get-ChildItem "node_modules" -Directory).Count
        Write-Host "  - $moduleCount modules installed" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  node_modules directory missing - run 'npm install'" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  package.json not found in current directory" -ForegroundColor Yellow
}

# Check for common Node.js issues
Write-Host "`n8. Common Issues Check:" -ForegroundColor Yellow

# Check for antivirus interference
$antivirusProcesses = Get-Process | Where-Object { $_.ProcessName -match "avast|norton|mcafee|kaspersky|bitdefender|avg" }
if ($antivirusProcesses) {
    Write-Host "⚠️  Antivirus software detected - may interfere with Node.js execution" -ForegroundColor Yellow
}

# Check available disk space
$disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
$freeSpaceGB = [math]::Round($disk.FreeSpace/1GB, 2)
if ($freeSpaceGB -lt 1) {
    Write-Host "⚠️  Low disk space: ${freeSpaceGB}GB free" -ForegroundColor Yellow
} else {
    Write-Host "✅ Disk space OK: ${freeSpaceGB}GB free" -ForegroundColor Green
}

Write-Host "`n=== Diagnosis Complete ===" -ForegroundColor Green
Write-Host "If Node.js scripts are hanging, try:" -ForegroundColor Cyan
Write-Host "1. Kill all Node.js processes: Get-Process node | Stop-Process -Force" -ForegroundColor White
Write-Host "2. Clear npm cache: npm cache clean --force" -ForegroundColor White
Write-Host "3. Reinstall dependencies: Remove-Item node_modules -Recurse -Force; npm install" -ForegroundColor White
Write-Host "4. Use PowerShell alternatives for testing instead of Node.js scripts" -ForegroundColor White
