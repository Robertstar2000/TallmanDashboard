# PowerShell script to fix SQL/table names in single-source-data.ts for P21 and POR rows

# Read all lines
$lines = Get-Content 'c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\single-source-data.ts'

$p21Pattern = '"serverName":\s*"P21"'
$porPattern = '"serverName":\s*"POR"'

for ($i = 0; $i -lt $lines.Count; $i++) {
    # P21 corrections
    if ($lines[$i] -match $p21Pattern) {
        # Fix tableName (add dbo. if missing)
        if ($lines[$i+1] -match '"tableName":\s*"([^"]+)"') {
            $table = $matches[1]
            if ($table -notmatch '^dbo\\.') {
                $lines[$i+1] = $lines[$i+1] -replace '"tableName":\s*"([^"]+)"', '"tableName": "dbo.' + $table + '"'
            }
        }
        # Fix productionSqlExpression
        if ($lines[$i+2] -match '"productionSqlExpression":\s*"([^"]+)"') {
            $sql = $matches[1]
            # Add dbo. prefix if missing
            $sql = $sql -replace 'FROM\s+([a-zA-Z0-9_]+)', 'FROM dbo.$1'
            # Add WITH (NOLOCK) if missing
            if ($sql -notmatch 'WITH \(NOLOCK\)') {
                $sql = $sql -replace '(FROM dbo\.[a-zA-Z0-9_]+)', '$1 WITH (NOLOCK)'
            }
            $lines[$i+2] = $lines[$i+2] -replace '"productionSqlExpression":\s*"([^"]+)"', '"productionSqlExpression": "' + $sql + '"'
        }
    }
    # POR corrections
    elseif ($lines[$i] -match $porPattern) {
        # Remove dbo. from tableName
        if ($lines[$i+1] -match '"tableName":\s*"dbo\\.([^"]+)"') {
            $lines[$i+1] = $lines[$i+1] -replace '"tableName":\s*"dbo\\.([^"]+)"', '"tableName": "$1"'
        }
        # Remove dbo. from SQL
        if ($lines[$i+2] -match '"productionSqlExpression":\s*"([^"]+)"') {
            $sql = $matches[1]
            $sql = $sql -replace 'FROM\s+dbo\.([a-zA-Z0-9_]+)', 'FROM $1'
            $lines[$i+2] = $lines[$i+2] -replace '"productionSqlExpression":\s*"([^"]+)"', '"productionSqlExpression": "' + $sql + '"'
        }
    }
}

# Write back to file
Set-Content 'c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\single-source-data.ts' $lines
