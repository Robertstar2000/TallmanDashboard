/**
 * Check POR Database Connection
 *
 * This script tests the connection to the POR.MDB file and verifies that it can be accessed.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
// Convert exec to Promise-based
const execPromise = util.promisify(exec);
function checkPorConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // POR database path from memory
            const porDbPath = 'C:\\Users\\BobM\\Desktop\\POR.MDB';
            console.log(`Checking if POR database exists at: ${porDbPath}`);
            // Check if the file exists
            if (!fs.existsSync(porDbPath)) {
                console.error(`ERROR: POR.MDB file not found at ${porDbPath}`);
                console.log('Please make sure the file exists at this location.');
                return;
            }
            console.log(`✓ POR.MDB file found at ${porDbPath}`);
            // Create a temporary PowerShell script to test the connection
            const scriptPath = path.join(process.cwd(), 'temp', 'test-por-connection.ps1');
            const scriptDir = path.dirname(scriptPath);
            // Ensure the directory exists
            if (!fs.existsSync(scriptDir)) {
                fs.mkdirSync(scriptDir, { recursive: true });
            }
            // Create the PowerShell script content
            const scriptContent = `
# PowerShell script to test MS Access database connection
param(
    [string]$filePath
)

try {
    # Create connection to the Access database
    $conn = New-Object -ComObject ADODB.Connection
    $connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$filePath;Persist Security Info=False;"
    $conn.Open($connString)
    
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
    Write-Output "Successfully connected to POR database"
    Write-Output "Found $($tables.Count) tables"
    Write-Output "Tables: $($tables -join ', ')"
    
    # Close connection
    $conn.Close()
    
    # Return success
    @{
        success = $true
        tableCount = $tables.Count
        tables = $tables
    } | ConvertTo-Json -Depth 10
}
catch {
    Write-Error "Error connecting to POR database: $_"
    
    # Return error
    @{
        success = $false
        error = $_.Exception.Message
    } | ConvertTo-Json -Depth 10
    
    exit 1
}
`;
            // Write the script to a file
            fs.writeFileSync(scriptPath, scriptContent);
            console.log('Testing connection to POR database...');
            // Execute the PowerShell script
            const { stdout, stderr } = yield execPromise(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -filePath "${porDbPath}"`);
            if (stderr) {
                console.error('PowerShell error:', stderr);
                return;
            }
            try {
                // Parse the JSON output
                const results = JSON.parse(stdout);
                if (results.success) {
                    console.log(`✓ Successfully connected to POR database`);
                    console.log(`✓ Found ${results.tableCount} tables`);
                    console.log(`✓ Sample tables: ${results.tables.slice(0, 5).join(', ')}...`);
                    // Create a file with the correct POR path to ensure it's used throughout the application
                    const porPathFile = path.join(process.cwd(), 'data', 'por-path.json');
                    fs.writeFileSync(porPathFile, JSON.stringify({ path: porDbPath }, null, 2));
                    console.log(`✓ Saved POR database path to ${porPathFile}`);
                }
                else {
                    console.error(`ERROR: Failed to connect to POR database: ${results.error}`);
                }
            }
            catch (parseError) {
                console.error('Error parsing PowerShell output:', parseError);
                console.log('Raw output:', stdout);
            }
        }
        catch (error) {
            console.error('Error checking POR connection:', error);
        }
    });
}
// Run the script
checkPorConnection().catch(error => {
    console.error('Unhandled error:', error);
});
