
# PowerShell script to test MS Access database connection
param(
    [string]$filePath = "C:\\Users\\BobM\\Desktop\\POR.MDB"
)

try {
    Write-Output "Testing connection to POR database at: $filePath"
    
    # Check if the file exists
    if (-not (Test-Path $filePath)) {
        Write-Error "POR database file not found at: $filePath"
        exit 1
    }
    
    Write-Output "POR database file exists"
    
    # Create connection to the Access database
    $conn = New-Object -ComObject ADODB.Connection
    $connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$filePath;Persist Security Info=False;"
    
    Write-Output "Attempting to open connection with: $connString"
    $conn.Open($connString)
    
    Write-Output "Connection successful!"
    
    # Get list of tables
    $schema = $conn.OpenSchema(20) # adSchemaTables = 20
    $tables = @()
    
    while (-not $schema.EOF) {
        if ($schema.Fields.Item("TABLE_TYPE").Value -eq "TABLE") {
            $tables += $schema.Fields.Item("TABLE_NAME").Value
        }
        $schema.MoveNext()
    }
    
    $schema.Close()
    
    # Output results
    Write-Output "Found $($tables.Count) tables"
    Write-Output "Sample tables: $($tables[0..4] -join ', ')..."
    
    # Execute a simple query
    $rs = New-Object -ComObject ADODB.Recordset
    $rs.Open("SELECT TOP 5 * FROM MSysObjects", $conn)
    
    $count = 0
    while (-not $rs.EOF -and $count -lt 5) {
        $row = @{}
        for ($i = 0; $i -lt $rs.Fields.Count; $i++) {
            $fieldName = $rs.Fields.Item($i).Name
            $fieldValue = $rs.Fields.Item($i).Value
            $row[$fieldName] = $fieldValue
        }
        Write-Output "Row $count: $($row | ConvertTo-Json -Compress)"
        $rs.MoveNext()
        $count++
    }
    
    $rs.Close()
    
    # Close connection
    $conn.Close()
    
    Write-Output "Test completed successfully"
} catch {
    Write-Error "Error testing POR database connection: $_"
    exit 1
}
