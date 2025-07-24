# Simple LDAP test using .NET DirectoryServices

$server = "10.10.20.253"
$port = 389
$baseDn = "DC=tallman,DC=com"
$username = "LDAP@tallman.com"
$password = "ebGGAm77kk"

# Test basic TCP connection first
try {
    Write-Host "Testing TCP connection to $($server):$($port)..."
    $tcpClient = New-Object System.Net.Sockets.TcpClient($server, $port)
    Write-Host "✅ Successfully connected to $($server):$($port)" -ForegroundColor Green
    $tcpClient.Close()
} catch {
    Write-Host "❌ TCP connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test LDAP bind
try {
    Write-Host "`nTesting LDAP bind..."
    
    # Create LDAP connection string
    $ldapPath = "LDAP://$($server):$($port)/$baseDn"
    Write-Host "Connecting to: $ldapPath"
    
    # Create directory entry
    $entry = New-Object System.DirectoryServices.DirectoryEntry(
        $ldapPath,
        $username,
        $password,
        [System.DirectoryServices.AuthenticationTypes]::Secure
    )
    
    # Force connection attempt
    $dummy = $entry.psbase.NativeObject
    
    Write-Host "✅ Successfully bound to LDAP server" -ForegroundColor Green
    Write-Host "Connected as: $($entry.Username)"
    
    # Test search
    Write-Host "`nTesting LDAP search..."
    $searcher = New-Object System.DirectoryServices.DirectorySearcher($entry)
    $searcher.Filter = "(objectClass=*)"
    $searcher.SizeLimit = 1
    
    $results = $searcher.FindAll()
    Write-Host "✅ Found $($results.Count) entries" -ForegroundColor Green
    
    foreach ($result in $results) {
        Write-Host "`nEntry:"
        $result.Properties | Format-Table -AutoSize
    }
    
} catch [System.Runtime.InteropServices.COMException] {
    # Decode LDAP error codes
    $errorCode = $_.Exception.ErrorCode
    $win32Error = $errorCode -band 0xFFFF
    
    Write-Host "❌ LDAP error (0x$($errorCode.ToString('X8'))) - Win32: $win32Error" -ForegroundColor Red
    
    switch ($win32Error) {
        0x51 { $errorMsg = "Server is unavailable" }
        0x52 { $errorMsg = "Server is busy" }
        0x2072 { $errorMsg = "LDAP server not found" }
        0x2091 { $errorMsg = "Invalid credentials" }
        0x2094 { $errorMsg = "Insufficient access rights" }
        0x20B5 { $errorMsg = "Unwilling to perform" }
        default { $errorMsg = "Unknown LDAP error" }
    }
    
    Write-Host "Error: $errorMsg" -ForegroundColor Red
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor DarkGray
}
