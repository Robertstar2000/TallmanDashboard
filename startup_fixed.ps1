# TallmanDashboard Startup Script
# Handles starting the Next.js development server with proper cleanup

# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Function to write status messages with colors
function Write-Status {
    param (
        [string]$Message,
        [ValidateSet("INFO", "SUCCESS", "WARNING", "ERROR")]
        [string]$Level = "INFO"
    )
    
    # Format the message with the current timestamp
    $formattedMessage = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR"   { "Red" }
        default   { "Cyan" }
    }
    
    # Use the formatted message that includes timestamp
    Write-Host "$formattedMessage" -ForegroundColor $color
}

# Main script execution
try {
    Write-Status "=== TallmanDashboard Startup Script ==="
    Write-Status "Starting at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    
    # Stop any process using port 60005
    Write-Status "Stopping any process using port 60005..."
    $portProcess = Get-NetTCPConnection -LocalPort 60005 -ErrorAction SilentlyContinue
    if ($portProcess) {
        $portProcess | ForEach-Object {
            $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                $process | Stop-Process -Force
                Write-Status "Stopped process $($process.ProcessName) (PID: $($process.Id))" "SUCCESS"
            }
        }
    } else {
        Write-Status "No processes found on port 60005" "SUCCESS"
    }
    
    # Stop any orphaned Node.js processes
    Write-Status "Stopping any orphaned Node.js processes..."
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force
        Write-Status "Stopped $($nodeProcesses.Count) Node.js process(es)" "SUCCESS"
    } else {
        Write-Status "No Node.js processes found" "SUCCESS"
    }
    
    # Get the full path to npm
    $npmPath = (Get-Command npm -ErrorAction SilentlyContinue).Source
    if (-not $npmPath) {
        # If npm is not in PATH, try common locations
        $nodePaths = @(
            "${env:ProgramFiles}\nodejs\npm.cmd",
            "${env:ProgramFiles(x86)}\nodejs\npm.cmd",
            "${env:APPDATA}\npm\npm.cmd"
        )
        
        foreach ($path in $nodePaths) {
            if (Test-Path $path) {
                $npmPath = $path
                break
            }
        }
    }

    # Ensure we have a valid npm path
    if (-not $npmPath) {
        throw "Could not find npm in PATH or common locations. Please ensure Node.js is installed."
    }
    
    # Ensure the path is properly quoted if it contains spaces
    $npmPath = "`"$npmPath`""
    
    # Start the Next.js development server
    Write-Status "Starting TallmanDashboard (npm run dev)"
    Write-Status "Using npm from: $npmPath"
    Write-Status "Working directory: $(Get-Location)"
    
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "$npmPath run dev" -PassThru -NoNewWindow -WorkingDirectory $PWD
    Write-Status "Started npm with process ID $($process.Id)" "SUCCESS"
    
    # Wait for the server to start
    $maxAttempts = 10
    $attempt = 1
    $serverReady = $false
    $serverUrl = "http://localhost:60005"
    
    Write-Status "Waiting for server to start (this may take a moment)..."
    
    while ($attempt -le $maxAttempts -and -not $serverReady) {
        Write-Status "Checking if server is up (attempt $attempt/$maxAttempts)..."
        
        try {
            $response = Invoke-WebRequest -Uri $serverUrl -Method Head -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $serverReady = $true
                Write-Status "Server is up and running!" "SUCCESS"
                break
            }
        } catch {
            # Ignore errors and continue waiting
        }
        
        if (-not $serverReady) {
            Write-Status "Server not ready yet, waiting..." "WARNING"
            Start-Sleep -Seconds 2
            $attempt++
        }
    }
    
    if (-not $serverReady) {
        Write-Status "Warning: Server might not have started correctly after $maxAttempts attempts" "WARNING"
    } else {
        # Open the default browser
        Start-Process $serverUrl
    }
    
    Write-Status "=== Startup script completed ===" "SUCCESS"
    Write-Status "Application should now be running at $serverUrl" "SUCCESS"
    Write-Status "Press any key to close this window..." "INFO"
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    
} catch {
    Write-Status "An error occurred: $_" "ERROR"
    Write-Status "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    Write-Status "Press any key to exit..." "ERROR"
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit 1
}
