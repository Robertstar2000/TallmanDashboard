# PowerShell script to manage TallmanDashboard startup with comprehensive process and port management
# Run as Administrator for best results (required for port checking)

# Set the working directory to the script's directory
$scriptPath = $PSScriptRoot
if (-not $scriptPath) {
    $scriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
}
Set-Location -Path $scriptPath

# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Status {
    param([string]$Message, [string]$Type = "INFO")
    $colors = @{
        "INFO" = "Cyan"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR" = "Red"
    }
    $color = if ($colors.ContainsKey($Type)) { $colors[$Type] } else { "White" }
    Write-Host "[$($Type.PadRight(7))] $Message" -ForegroundColor $color
}

# Clear the console
Clear-Host
Write-Status "=== TallmanDashboard Startup Script ==="
Write-Status "Starting at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Stop any process using port 60005
Write-Status "Stopping any process using port 60005..."
try {
    $pids = @()
    try {
        $pids = Get-NetTCPConnection -LocalPort 60005 -ErrorAction Stop | 
                Select-Object -ExpandProperty OwningProcess -Unique
    } catch {
        Write-Status "No processes found on port 60005" "SUCCESS"
    }
    
    if ($pids -and $pids.Count -gt 0) {
        foreach ($processId in $pids) {
            try {
                $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Status "Stopping process $processId ($($proc.ProcessName)) using port 60005..." "WARNING"
                    Stop-Process -Id $processId -Force -ErrorAction Stop
                    Write-Status "Successfully stopped process $processId" "SUCCESS"
                }
            } catch {
                Write-Status "Error stopping process $($processId): $_" "ERROR"
            }
        }
        # Give processes a moment to fully terminate
        Start-Sleep -Seconds 2
    } else {
        Write-Status "No processes found on port 60005" "SUCCESS"
    }
} catch {
    Write-Status "Error checking for processes on port 60005: $_" "ERROR"
}

# Stop any orphaned Node.js processes
Write-Status "Stopping any orphaned Node.js processes..."
try {
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Status "Found $($nodeProcesses.Count) Node.js process(es) to stop..." "WARNING"
        $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Status "Stopped $($nodeProcesses.Count) Node.js process(es)" "SUCCESS"
        # Give processes a moment to fully terminate
        Start-Sleep -Seconds 1
    } else {
        Write-Status "No Node.js processes found" "SUCCESS"
    }
} catch {
    Write-Status "Error stopping Node.js processes: $_" "ERROR"
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
    Write-Status "Error: Could not find npm in PATH or common locations" "ERROR"
    Write-Status "Please ensure Node.js is installed and in your system PATH" "ERROR"
    exit 1
}

# Ensure the path is properly quoted if it contains spaces
$npmPath = "`"$npmPath`""

# Start the Next.js development server
Write-Status "Starting TallmanDashboard (npm run dev)"
Write-Status "Using npm from: $npmPath"
Write-Status "Working directory: $(Get-Location)"

try {
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "`"$npmPath`" run dev" -PassThru -NoNewWindow -WorkingDirectory $PWD
    Write-Status "Started npm with process ID $($process.Id)" "SUCCESS"
} catch {
    Write-Status "Error starting npm: $_" "ERROR"
    exit 1
}
    
# Wait for the server to start
Write-Status "Waiting for server to start (this may take a moment)..."
$maxAttempts = 10
$attempt = 0
$serverReady = $false
    
while ($attempt -lt $maxAttempts -and -not $serverReady) {
    $attempt++
    Write-Status "Checking if server is up (attempt $attempt/$maxAttempts)..."
    
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:60005' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Status "Server is up and running!" "SUCCESS"
        }
    } catch {
        Write-Status "Server not ready yet, waiting..." "WARNING"
        Start-Sleep -Seconds 2
    }
}

if (-not $serverReady) {
    Write-Status "Warning: Server might not have started correctly after $maxAttempts attempts" "WARNING"
} else {
    # Open the browser to the application
    Write-Status "Opening browser to http://localhost:60005..."
    try {
        Start-Process "http://localhost:60005"
    } catch {
        Write-Status "Warning: Could not open browser automatically" "WARNING"
        Write-Status "Please open http://localhost:60005 in your web browser" "INFO"
    }
}

Write-Status "=== Startup script completed ===" "SUCCESS"
Write-Status "Application should now be running at http://localhost:60005" "SUCCESS"
Write-Status "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
