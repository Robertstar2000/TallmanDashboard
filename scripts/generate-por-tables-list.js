/**
 * Script to generate a list of all tables in the Point of Rental database
 * and save them to a markdown file
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert exec to Promise-based
const execPromise = util.promisify(exec);

// Configuration
const POR_DB_PATH = 'C:\\Users\\BobM\\Desktop\\POR.mdb';
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'PORTables.md');

// Ensure the docs directory exists
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

// Function to execute a PowerShell script to list tables
async function listTablesInAccess(filePath) {
  try {
    console.log(`Listing tables in MS Access database: ${filePath}`);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`MS Access file not found at path: ${filePath}`);
      return [];
    }
    
    // Create a temporary PowerShell script
    const scriptPath = path.join(__dirname, '..', 'temp', 'list-tables.ps1');
    const scriptDir = path.dirname(scriptPath);
    
    // Ensure the directory exists
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }
    
    // Create the PowerShell script content
    const scriptContent = `
# PowerShell script to list tables in MS Access database
param(
    [string]$filePath
)

try {
    # Create connection to the Access database
    $conn = New-Object -ComObject ADODB.Connection
    $connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$filePath;Persist Security Info=False;"
    $conn.Open($connString)
    
    # Get schema information (tables)
    $schema = $conn.OpenSchema(20) # adSchemaTables = 20
    $tables = @()
    
    while (-not $schema.EOF) {
        if ($schema.Fields.Item("TABLE_TYPE").Value -eq "TABLE") {
            $tableName = $schema.Fields.Item("TABLE_NAME").Value
            $tables += @{
                name = $tableName
            }
        }
        $schema.MoveNext()
    }
    
    $schema.Close()
    $conn.Close()
    
    # Output as JSON
    $tables | ConvertTo-Json -Depth 10
}
catch {
    Write-Error "Error: $_"
    exit 1
}
`;
    
    // Write the script to a file
    fs.writeFileSync(scriptPath, scriptContent);
    
    // Execute the PowerShell script
    const { stdout, stderr } = await execPromise(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -filePath "${filePath}"`);
    
    if (stderr) {
      console.error('PowerShell error:', stderr);
      return [];
    }
    
    // Parse the JSON output
    const tables = JSON.parse(stdout);
    console.log(`Found ${tables.length} tables in the database`);
    return tables;
  } catch (error) {
    console.error('Error listing tables:', error);
    return [];
  }
}

// Function to generate markdown content
function generateMarkdown(tables) {
  const timestamp = new Date().toLocaleString();
  
  let markdown = `# Point of Rental Database Tables\n\n`;
  markdown += `This document contains a list of all tables in the Point of Rental database.\n\n`;
  markdown += `Generated on: ${timestamp}\n\n`;
  
  markdown += `## Database Information\n\n`;
  markdown += `- **File Path**: ${POR_DB_PATH}\n`;
  markdown += `- **Total Tables**: ${tables.length}\n\n`;
  
  markdown += `## Table List\n\n`;
  
  // Sort tables alphabetically
  tables.sort((a, b) => a.name.localeCompare(b.name));
  
  // Group tables by first letter for better organization
  const groupedTables = {};
  tables.forEach(table => {
    const firstLetter = table.name.charAt(0).toUpperCase();
    if (!groupedTables[firstLetter]) {
      groupedTables[firstLetter] = [];
    }
    groupedTables[firstLetter].push(table);
  });
  
  // Create a table of contents
  markdown += `### Table of Contents\n\n`;
  Object.keys(groupedTables).sort().forEach(letter => {
    markdown += `- [${letter}](#${letter.toLowerCase()})\n`;
  });
  markdown += `\n`;
  
  // List all tables by group
  Object.keys(groupedTables).sort().forEach(letter => {
    markdown += `### ${letter}\n\n`;
    markdown += `| Table Name |\n`;
    markdown += `|------------|\n`;
    
    groupedTables[letter].forEach(table => {
      markdown += `| \`${table.name}\` |\n`;
    });
    
    markdown += `\n`;
  });
  
  return markdown;
}

// Main function
async function main() {
  try {
    console.log('Generating Point of Rental tables list...');
    
    // List all tables in the database
    const tables = await listTablesInAccess(POR_DB_PATH);
    
    if (tables.length === 0) {
      console.error('No tables found in the database');
      return;
    }
    
    // Generate markdown content
    const markdown = generateMarkdown(tables);
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, markdown);
    console.log(`Table list written to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating table list:', error);
  }
}

// Run the main function
main();
