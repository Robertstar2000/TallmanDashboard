# PowerShell script to fix EPIPE errors in mcpControllerFixed.js
$filePath = "c:\Users\BobM\Desktop\TallmanDashboard\backend\mcpControllerFixed.js"
$content = Get-Content $filePath -Raw

# Fix the first initialization write (around line 294)
$pattern1 = 'connection\.stdin\.write\(JSON\.stringify\(initRequest\) \+ ''\\n''\);'
$replacement1 = @'
// Check if connection is alive before writing initialization request
            if (connection.stdin && !connection.stdin.destroyed && connection.exitCode === null) {
                try {
                    connection.stdin.write(JSON.stringify(initRequest) + '\n');
                } catch (writeError) {
                    console.error(`❌ Failed to write init request to MCP server:`, writeError.message);
                    reject(writeError);
                    return;
                }
            } else {
                reject(new Error('MCP server connection closed before initialization'));
                return;
            }
'@

# Apply the fix to both occurrences
$content = $content -replace $pattern1, $replacement1

# Save the fixed content
Set-Content -Path $filePath -Value $content -Encoding UTF8

Write-Host "✅ Fixed EPIPE errors in mcpControllerFixed.js"
