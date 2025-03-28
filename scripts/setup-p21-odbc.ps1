# PowerShell script to set up ODBC DSN for P21
# This script needs to be run with administrator privileges

# Define the DSN parameters
$dsnName = "P21Play"
$serverName = "10.10.20.28"
$databaseName = "P21Play"
$description = "P21 Database Connection"

# Check if running as administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges. Please run PowerShell as administrator." -ForegroundColor Red
    exit 1
}

# Check if the ODBC driver for SQL Server is installed
$odbcDrivers = Get-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBCINST.INI\ODBC Drivers" -ErrorAction SilentlyContinue
if (-not $odbcDrivers -or -not ($odbcDrivers.PSObject.Properties.Name -match "SQL Server")) {
    Write-Host "SQL Server ODBC driver not found. Please install the SQL Server ODBC driver." -ForegroundColor Red
    exit 1
}

# Create or update the DSN
try {
    # Check if DSN already exists
    $dsnExists = Test-Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName"
    
    if ($dsnExists) {
        Write-Host "DSN '$dsnName' already exists. Updating configuration..." -ForegroundColor Yellow
        
        # Update existing DSN
        Set-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName" -Name "Server" -Value $serverName
        Set-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName" -Name "Database" -Value $databaseName
        Set-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName" -Name "Description" -Value $description
        Set-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName" -Name "Trusted_Connection" -Value "Yes"
    } else {
        Write-Host "Creating new DSN '$dsnName'..." -ForegroundColor Green
        
        # Create new DSN
        New-Item -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName" -Force | Out-Null
        
        # Set DSN properties
        New-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName" -Name "Driver" -Value "C:\Windows\system32\msodbcsql17.dll" -PropertyType String | Out-Null
        New-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName" -Name "Server" -Value $serverName -PropertyType String | Out-Null
        New-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName" -Name "Database" -Value $databaseName -PropertyType String | Out-Null
        New-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName" -Name "Description" -Value $description -PropertyType String | Out-Null
        New-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName" -Name "Trusted_Connection" -Value "Yes" -PropertyType String | Out-Null
        
        # Add DSN to ODBC Data Sources
        $odbcDataSourcesPath = "HKLM:\SOFTWARE\ODBC\ODBC.INI\ODBC Data Sources"
        if (-not (Test-Path $odbcDataSourcesPath)) {
            New-Item -Path $odbcDataSourcesPath -Force | Out-Null
        }
        
        New-ItemProperty -Path $odbcDataSourcesPath -Name $dsnName -Value "SQL Server" -PropertyType String -Force | Out-Null
    }
    
    Write-Host "DSN '$dsnName' has been successfully configured." -ForegroundColor Green
    Write-Host "Server: $serverName" -ForegroundColor Cyan
    Write-Host "Database: $databaseName" -ForegroundColor Cyan
    Write-Host "Using Windows Authentication" -ForegroundColor Cyan
} catch {
    Write-Host "Error configuring DSN: $_" -ForegroundColor Red
    exit 1
}

# Test the DSN connection
Write-Host "`nTesting connection to DSN '$dsnName'..." -ForegroundColor Yellow

try {
    $connection = New-Object System.Data.Odbc.OdbcConnection
    $connection.ConnectionString = "DSN=$dsnName;Trusted_Connection=Yes;"
    
    $connection.Open()
    
    if ($connection.State -eq 'Open') {
        Write-Host "Successfully connected to DSN '$dsnName'!" -ForegroundColor Green
        
        # Test a simple query
        $command = $connection.CreateCommand()
        $command.CommandText = "SELECT @@VERSION as Version"
        
        $reader = $command.ExecuteReader()
        
        if ($reader.Read()) {
            $version = $reader["Version"]
            Write-Host "SQL Server Version: $version" -ForegroundColor Cyan
        }
        
        $reader.Close()
        $connection.Close()
    } else {
        Write-Host "Failed to connect to DSN '$dsnName'." -ForegroundColor Red
    }
} catch {
    Write-Host "Error testing DSN connection: $_" -ForegroundColor Red
}

Write-Host "`nDSN setup complete. You can now use the DSN '$dsnName' in your application." -ForegroundColor Green
