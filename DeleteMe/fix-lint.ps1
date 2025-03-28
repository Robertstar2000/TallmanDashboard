# PowerShell script to fix lint issues in complete-chart-data.ts
$filePath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.ts"
$content = Get-Content -Path $filePath -Raw

# Ensure the file ends with a single newline
if ($content.EndsWith("`n`n")) {
    # Remove extra newline at the end
    $content = $content.Substring(0, $content.Length - 1)
} elseif (-not $content.EndsWith("`n")) {
    # Add a newline if missing
    $content += "`n"
}

# Write the fixed content back to the file
Set-Content -Path $filePath -Value $content -NoNewline
Add-Content -Path $filePath -Value ""  # Add a single newline at the end

Write-Host "Lint issue fixed in $filePath"
