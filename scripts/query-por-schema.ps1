# Script to query POR database schema and output to JSON
# This script uses PowerShell to connect to an MS Access database and extract its schema

# POR database file path
$porFilePath = "C:\Users\BobM\Desktop\POR.MDB"

# Check if file exists
if (-not (Test-Path $porFilePath)) {
    Write-Error "POR database file not found at: $porFilePath"
    exit 1
}

# Create connection to MS Access database
try {
    $conn = New-Object -ComObject ADODB.Connection
    $conn.Open("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$porFilePath")
    
    # Get list of tables
    $schema = @{}
    $catalog = New-Object -ComObject ADOX.Catalog
    $catalog.ActiveConnection = $conn
    
    # Array to store table information
    $tables = @()
    
    # Loop through each table
    foreach ($table in $catalog.Tables) {
        # Skip system tables
        if ($table.Name -notlike "MSys*" -and $table.Type -eq "TABLE") {
            Write-Host "Processing table: $($table.Name)"
            
            # Get columns for this table
            $columns = @()
            foreach ($column in $table.Columns) {
                $dataType = switch ($column.Type) {
                    0 { "EMPTY" }
                    2 { "INTEGER" }
                    3 { "DECIMAL" }
                    4 { "FLOAT" }
                    5 { "DOUBLE" }
                    6 { "CURRENCY" }
                    7 { "DATE" }
                    8 { "BSTR" }
                    9 { "IDISPATCH" }
                    10 { "ERROR" }
                    11 { "BOOLEAN" }
                    12 { "VARIANT" }
                    13 { "IUNKNOWN" }
                    14 { "DECIMAL" }
                    16 { "TINYINT" }
                    17 { "UNSIGNEDTINYINT" }
                    18 { "UNSIGNEDSMALLINT" }
                    19 { "UNSIGNEDINT" }
                    20 { "BIGINT" }
                    21 { "UNSIGNEDBIGINT" }
                    72 { "GUID" }
                    128 { "BINARY" }
                    129 { "CHAR" }
                    130 { "WCHAR" }
                    131 { "NUMERIC" }
                    132 { "USERDEFINED" }
                    133 { "DBDATE" }
                    134 { "DBTIME" }
                    135 { "DBTIMESTAMP" }
                    136 { "CHAPTER" }
                    200 { "VARCHAR" }
                    201 { "LONGVARCHAR" }
                    202 { "LONGVARWCHAR" }
                    203 { "VARBINARY" }
                    204 { "LONGVARBINARY" }
                    205 { "LONGVARCHAR" }
                    default { "UNKNOWN" }
                }
                
                $columns += @{
                    Name = $column.Name
                    DataType = $dataType
                    Size = $column.DefinedSize
                    IsNullable = $column.Properties.Item("Nullable").Value
                }
            }
            
            # Get primary key information
            $primaryKeys = @()
            foreach ($index in $table.Indexes) {
                if ($index.PrimaryKey) {
                    foreach ($column in $index.Columns) {
                        $primaryKeys += $column.Name
                    }
                }
            }
            
            # Add table information to array
            $tables += @{
                Name = $table.Name
                Columns = $columns
                PrimaryKeys = $primaryKeys
            }
        }
    }
    
    # Convert to JSON and save to file
    $schema = @{
        Tables = $tables
        DatabaseName = "POR"
        LastUpdated = (Get-Date).ToString("o")
    }
    
    $jsonOutput = ConvertTo-Json -InputObject $schema -Depth 10
    $outputPath = Join-Path $PSScriptRoot "por-schema.json"
    $jsonOutput | Out-File -FilePath $outputPath -Encoding UTF8
    
    Write-Host "Schema exported to: $outputPath"
    
    # Clean up
    $catalog = $null
    $conn.Close()
    $conn = $null
    
    # Return the path to the JSON file
    return $outputPath
}
catch {
    Write-Error "Error querying POR schema: $_"
    exit 1
}
