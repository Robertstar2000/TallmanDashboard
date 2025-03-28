# PowerShell script to kill processes on port 3000 and restart the server
Write-Host "Checking for processes using port 3000..."

# Find processes using port 3000
$processesUsingPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess

if ($processesUsingPort) {
    Write-Host "Found processes using port 3000. Stopping them..."
    
    foreach ($processId in $processesUsingPort) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        if ($process) {
            Write-Host "Stopping process: $($process.Name) (PID: $processId)"
            Stop-Process -Id $processId -Force
        }
    }
    
    # Give some time for processes to fully terminate
    Start-Sleep -Seconds 2
    
    Write-Host "All processes on port 3000 have been stopped."
} else {
    Write-Host "No processes found using port 3000."
}

# Change to the project directory
Set-Location -Path $PSScriptRoot

# Start the Next.js development server on port 3000
Write-Host "Starting Next.js development server on port 3000..."
npx next dev -p 3000
