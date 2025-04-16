# --- Configuration ---
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\single-source-data.ts"
$backupPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\single-source-data.ts.bak" # Backup file path

# --- Backup the original file ---
Write-Host "Backing up '$filePath' to '$backupPath'..."
Copy-Item -Path $filePath -Destination $backupPath -Force

# --- Read the file content ---
Write-Host "Reading file: $filePath"
$lines = Get-Content $filePath -Raw

# --- Define the replacement logic ---
$scriptBlock = {
    param($Match)

    # Extract the content between the braces {}
    $objectContent = $Match.Groups[1].Value

    # Check if it's the correct chartGroup and variableName
    if ($objectContent -match '"chartGroup":\s*"Customer Metrics A"' -and $objectContent -match '"variableName":\s*"accounts_receivable"') {
        Write-Host "Found matching object: $($objectContent | Out-String | Select-String -Pattern '"rowId":\s*"(\d+)"' | ForEach-Object {$_.Matches.Groups[1].Value})"
        # Extract month number X from axisStep
        $monthMatch = [regex]::Match($objectContent, '"axisStep":\s*"Month (\d+)"')
        if ($monthMatch.Success) {
            $monthNumber = [int]$monthMatch.Groups[1].Value
            Write-Host "  - Month Number: $monthNumber"

            # Calculate date offsets
            $startOffset = 13 - $monthNumber
            $endOffset = 12 - $monthNumber
            Write-Host "  - Calculated Offsets: Start=$startOffset, End=$endOffset"

            # Construct the new SQL expression
            $newSqlExpression = "SELECT ISNULL(SUM(total_amount), 0) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -$startOffset, DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)) AND invoice_date < DATEADD(month, -$endOffset, DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0));"
            # Escape backslashes and quotes for JSON compatibility within the script block
            $escapedNewSqlExpression = $newSqlExpression -replace '"', '""' # Double quotes for PS string replacement

            # Replace tableName
            $updatedContent = $objectContent -replace '("tableName":\s*")[^"]+(")', "`$1dbo.invoice_hdr`$2"
            # Replace productionSqlExpression
            $updatedContent = $updatedContent -replace '("productionSqlExpression":\s*")[^"]+(")', "`$1$escapedNewSqlExpression`$2"

            # Return the updated object content wrapped in braces
            return "{$updatedContent}"
        } else {
             Write-Host "  - Could not extract month number from axisStep. Skipping."
             # Return original match if month number extraction fails
             return $Match.Value
        }
    } else {
        # Return the original match if it's not the target object
        return $Match.Value
    }
}

# --- Use regex to find and replace object content ---
# This regex finds blocks starting with { followed by "rowId" and ending with } before the next potential "rowId" or end of array ]
# It captures the content inside the braces. Using Singleline mode to match across newlines.
Write-Host "Processing replacements..."
$updatedContent = [regex]::Replace($lines, '(?s)\{\s*"rowId":.*?\}', $scriptBlock, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# --- Write the updated content back to the file ---
Write-Host "Writing updated content back to $filePath"
Set-Content -Path $filePath -Value $updatedContent -NoNewline -Encoding UTF8

Write-Host "Script finished."
