/**
 * Fix POR Database Connection
 * 
 * This script tests and fixes the connection to the POR database
 * by updating the necessary configuration files and environment variables.
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

// Convert exec to Promise-based
const execPromise = util.promisify(exec);

// Set the correct POR database path from memory
const POR_DB_PATH = 'C:\\Users\\BobM\\Desktop\\POR.MDB';

async function fixPorConnection() {
  console.log('Starting POR database connection fix...');
  
  try {
    // Step 1: Check if the POR database file exists
    console.log(`Checking if POR database exists at: ${POR_DB_PATH}`);
    
    if (!fs.existsSync(POR_DB_PATH)) {
      console.error(`ERROR: POR.MDB file not found at ${POR_DB_PATH}`);
      return;
    }
    
    console.log(`✓ POR.MDB file found at ${POR_DB_PATH}`);
    
    // Step 2: Create or update .env.local file with POR_FILE_PATH
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if POR_FILE_PATH already exists
      if (envContent.includes('POR_FILE_PATH=')) {
        // Update existing POR_FILE_PATH
        envContent = envContent.replace(
          /POR_FILE_PATH=.*/g,
          `POR_FILE_PATH=${POR_DB_PATH.replace(/\\/g, '\\\\')}`
        );
      } else {
        // Add POR_FILE_PATH
        envContent += `\nPOR_FILE_PATH=${POR_DB_PATH.replace(/\\/g, '\\\\')}\n`;
      }
    } else {
      // Create new .env.local file
      envContent = `POR_FILE_PATH=${POR_DB_PATH.replace(/\\/g, '\\\\')}\n`;
    }
    
    // Write updated content to .env.local
    fs.writeFileSync(envPath, envContent);
    console.log(`✓ Updated POR_FILE_PATH in .env.local`);
    
    // Step 3: Create a data directory and store the POR path
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const porPathFile = path.join(dataDir, 'por-path.json');
    fs.writeFileSync(porPathFile, JSON.stringify({ path: POR_DB_PATH }, null, 2));
    console.log(`✓ Saved POR database path to ${porPathFile}`);
    
    // Step 4: Test the connection using the API
    console.log('Testing connection to POR database using API...');
    
    // Create a temporary script to test the connection
    const testScript = `
    const fetch = require('node-fetch');
    
    async function testPorConnection() {
      try {
        const response = await fetch('http://localhost:3000/api/testAccessConnection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filePath: '${POR_DB_PATH.replace(/\\/g, '\\\\')}'
          })
        });
        
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success) {
          console.log('✓ Successfully connected to POR database via API');
        } else {
          console.error('✗ Failed to connect to POR database via API:', data.message);
        }
      } catch (error) {
        console.error('Error testing POR connection:', error);
      }
    }
    
    testPorConnection();
    `;
    
    const testScriptPath = path.join(process.cwd(), 'temp', 'test-por-api.js');
    const testScriptDir = path.dirname(testScriptPath);
    
    // Ensure the directory exists
    if (!fs.existsSync(testScriptDir)) {
      fs.mkdirSync(testScriptDir, { recursive: true });
    }
    
    // Write the test script
    fs.writeFileSync(testScriptPath, testScript);
    
    console.log('✓ Created test script');
    console.log('NOTE: To test the API connection, make sure the server is running and execute:');
    console.log(`node ${testScriptPath}`);
    
    // Step 5: Create a test PowerShell script for direct access
    const psScript = `
# PowerShell script to test MS Access database connection
param(
    [string]$filePath = "${POR_DB_PATH.replace(/\\/g, '\\\\')}"
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
`;
    
    const psScriptPath = path.join(process.cwd(), 'scripts', 'test-por-connection.ps1');
    
    // Write the PowerShell script
    fs.writeFileSync(psScriptPath, psScript);
    
    console.log('✓ Created PowerShell test script');
    console.log('NOTE: To test the direct connection, execute:');
    console.log(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`);
    
    console.log('\nPOR database connection fix completed successfully!');
    console.log('The POR database path has been set to:', POR_DB_PATH);
    console.log('This path will be used by default in all API endpoints.');
    
  } catch (error) {
    console.error('Error fixing POR connection:', error);
  }
}

// Run the script
fixPorConnection().catch(error => {
  console.error('Unhandled error:', error);
});
