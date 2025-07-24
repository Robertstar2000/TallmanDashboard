# Simple LDAP test using telnet-like connection
$server = "10.10.20.253"
$port = 389

# Test basic TCP connection
try {
    Write-Host "Testing connection to $($server):$($port)..."
    $tcpClient = New-Object System.Net.Sockets.TcpClient($server, $port)
    
    if ($tcpClient.Connected) {
        Write-Host "✅ Successfully connected to $($server):$($port)" -ForegroundColor Green
        
        $stream = $tcpClient.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $writer = New-Object System.IO.StreamWriter($stream)
        
        # Set a read timeout
        $stream.ReadTimeout = 5000
        
        # Try to read any banner or response
        try {
            $response = $reader.ReadToEnd()
            Write-Host "Server response: $response"
        } catch {
            Write-Host "No response from server (expected for LDAP)" -ForegroundColor Yellow
        }
        
        # Send a simple LDAP bind request
        $bindRequest = [byte[]]@(
            0x30, 0x0c,  # LDAPMessage sequence
            0x02, 0x01, 0x01,  # Message ID: 1
            0x60, 0x07,  # Bind Request
            0x02, 0x01, 0x03,  # LDAP version: 3
            0x04, 0x02, 0x6e, 0x6f  # Empty name
        )
        
        Write-Host "Sending LDAP bind request..."
        $stream.Write($bindRequest, 0, $bindRequest.Length)
        $stream.Flush()
        
        # Try to read response
        Start-Sleep -Milliseconds 1000  # Give server time to respond
        
        $response = New-Object byte[] 1024
        $bytesRead = $stream.Read($response, 0, $response.Length)
        
        if ($bytesRead -gt 0) {
            $hexResponse = [System.BitConverter]::ToString($response, 0, $bytesRead) -replace '-', ' '
            Write-Host "Received response ($bytesRead bytes):" -ForegroundColor Cyan
            Write-Host $hexResponse
            
            # Try to interpret as LDAP response
            if ($bytesRead >= 2) {
                $resultCode = $response[8]  # Usually the result code is at position 8
                Write-Host "LDAP Result Code: $resultCode" -ForegroundColor Cyan
            }
        } else {
            Write-Host "No response received from server" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Failed to connect to $($server):$($port)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor DarkGray
} finally {
    if ($null -ne $tcpClient) {
        $tcpClient.Close()
    }
}
