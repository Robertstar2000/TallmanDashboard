# --- Configuration ---
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\single-source-data.ts"
# Use a new backup name
$backupPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\single-source-data.ts.bak3"

# --- Backup the original file ---
Write-Host "Backing up '$filePath' to '$backupPath'..."
if (Test-Path $filePath) {
    Copy-Item -Path $filePath -Destination $backupPath -Force
} else {
    Write-Error "Source file not found: $filePath"
    exit 1
}

# --- Read the file content ---
Write-Host "Reading file: $filePath"
$lines = Get-Content $filePath -Raw

# --- Define the replacement logic ---
$scriptBlock = {
    param($Match)

    # Extract the content between the braces {}
    $objectContent = $Match.Groups[1].Value

    # Check if it's the correct chartGroup and variableName
    if ($objectContent -match '("chartGroup":\s*"Accounts")' -and $objectContent -match '("variableName":\s*"Payables")') {
        $rowIdMatch = $objectContent | Select-String -Pattern '"rowId":\s*"(\d+)"'
        $rowId = if ($rowIdMatch) { $rowIdMatch.Matches.Groups[1].Value } else { "UNKNOWN" }
        Write-Host "Found matching object: rowId=$rowId (Group: Accounts, Variable: Payables)"

        # Extract month number X from axisStep
        $monthMatch = [regex]::Match($objectContent, '"axisStep":\s*"Month (\d+)"')
        if ($monthMatch.Success) {
            $monthNumber = [int]$monthMatch.Groups[1].Value
            Write-Host "  - Month Number: $monthNumber"

            # Calculate date offsets
            $startOffset = 13 - $monthNumber
            $endOffset = 12 - $monthNumber
            Write-Host "  - Calculated Offsets: Start=$startOffset, End=$endOffset"

            # Construct the new SQL expression for Accounts Payable
            $newSqlExpression = "SELECT ISNULL(SUM(total_amount - amount_paid), 0) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -$startOffset, DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)) AND invoice_date < DATEADD(month, -$endOffset, DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)) AND paid_in_full_flag <> 'Y';"

            # Replace tableName
            $updatedContent = $objectContent -replace '("tableName":\s*)".*?"', ('$1"dbo.invoice_hdr"') # Change to invoice_hdr
            # Replace productionSqlExpression
            $updatedContent = $updatedContent -replace '("productionSqlExpression":\s*)".*?"', ('$1"' + $newSqlExpression + '"')

            # Return the updated object content wrapped in braces
            Write-Host "  - Updating SQL Expression for Payables."
            return "{$updatedContent}"
        } else {
             Write-Host "  - Could not extract month number from axisStep for rowId $rowId. Skipping."
             return $Match.Value
        }
    } else {
        # Return the original match if it's not the target object
        return $Match.Value
    }
}

# --- Use regex to find and replace object content ---
Write-Host "Processing replacements for Accounts Payable..."
$updatedContent = [regex]::Replace($lines, '(?s)\{\s*("rowId":.*?)\}', $scriptBlock, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# --- Write the updated content back to the file ---
Write-Host "Writing updated content back to $filePath"
Out-File -FilePath $filePath -InputObject $updatedContent -Encoding UTF8 -NoNewline

Write-Host "Script finished."
