# Test LDAP Connection Script

$server = "10.10.20.253"
$port = 389
$timeout = 5000

# Test TCP connection
try {
    Write-Host "Testing TCP connection to $($server):$($port)..."
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connectTask = $tcpClient.ConnectAsync($server, $port)
    $timeoutTask = Start-Sleep -Seconds ($timeout / 1000) -AsJob
    
    $completedTask = Wait-Job -Job $connectTask, $timeoutTask -Any -ErrorAction SilentlyContinue
    
    if ($completedTask -eq $connectTask) {
        Write-Host "✅ Successfully connected to $($server):$($port)" -ForegroundColor Green
        
        # Test LDAP bind
        try {
            Write-Host "`nTesting LDAP bind..."
            $username = "LDAP@tallman.com"
            $password = ConvertTo-SecureString "ebGGAm77kk" -AsPlainText -Force
            $cred = New-Object System.Management.Automation.PSCredential($username, $password)
            
            $ldap = [ADSI]("LDAP://$($server):$($port)/DC=tallman,DC=com")
            $ldap.psbase.AuthenticationType = [System.DirectoryServices.AuthenticationTypes]::Secure
            
            Write-Host "Attempting to bind with username: $username"
            $ldap.psbase.Invoke("Bind", $cred.GetNetworkCredential())
            
            Write-Host "✅ Successfully bound to LDAP server" -ForegroundColor Green
            
            # Test search
            Write-Host "`nTesting LDAP search..."
            $searcher = New-Object System.DirectoryServices.DirectorySearcher($ldap)
            $searcher.Filter = "(objectClass=*)"
            $searcher.SizeLimit = 1
            
            $results = $searcher.FindAll()
            Write-Host "✅ Found $($results.Count) entries" -ForegroundColor Green
            
            foreach ($result in $results) {
                Write-Host "`nEntry:"
                $result.Properties | Format-Table -AutoSize
            }
            
        } catch {
            Write-Host "❌ LDAP error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor DarkGray
        } finally {
            if ($null -ne $ldap) {
                [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ldap) | Out-Null
            }
        }
    } else {
        Write-Host "❌ Connection timed out after $($timeout)ms" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Connection error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($null -ne $tcpClient) {
        $tcpClient.Close()
    }
    
    # Clean up any running jobs
    Get-Job | Remove-Job -Force
}
