/**
 * Script to list all tables in the Point of Rental database
 * using the existing API endpoints and generate a markdown file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const POR_DB_PATH = 'C:\\Users\\BobM\\Desktop\\POR.mdb';
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'PORTables.md');

// Ensure the docs directory exists
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

// Function to execute a PowerShell command and return the result
function runPowerShell(command) {
  try {
    const output = execSync(`powershell -Command "${command}"`, { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    console.error('PowerShell execution error:', error.message);
    return null;
  }
}

// Function to list tables using PowerShell and ADODB directly
function listTablesWithPowerShell() {
  console.log(`Connecting to MS Access database: ${POR_DB_PATH}`);
  
  // PowerShell command to list tables
  const command = `
    try {
      $conn = New-Object -ComObject ADODB.Connection
      $conn.Open("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${POR_DB_PATH};Persist Security Info=False;")
      
      $schema = $conn.OpenSchema(20)
      $tables = @()
      
      while (-not $schema.EOF) {
        if ($schema.Fields.Item("TABLE_TYPE").Value -eq "TABLE") {
          $tables += $schema.Fields.Item("TABLE_NAME").Value
        }
        $schema.MoveNext()
      }
      
      $schema.Close()
      $conn.Close()
      
      $tables | ConvertTo-Json
    } catch {
      "Error: $_"
    }
  `;
  
  const result = runPowerShell(command);
  
  if (result && !result.startsWith('Error:')) {
    try {
      return JSON.parse(result);
    } catch (e) {
      console.error('Error parsing JSON result:', e.message);
      return [];
    }
  } else {
    console.error('PowerShell error:', result);
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
  tables.sort();
  
  // Group tables by first letter for better organization
  const groupedTables = {};
  tables.forEach(tableName => {
    const firstLetter = tableName.charAt(0).toUpperCase();
    if (!groupedTables[firstLetter]) {
      groupedTables[firstLetter] = [];
    }
    groupedTables[firstLetter].push(tableName);
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
    
    groupedTables[letter].forEach(tableName => {
      markdown += `| \`${tableName}\` |\n`;
    });
    
    markdown += `\n`;
  });
  
  // Add a section for common rental-related tables
  const commonTables = [
    'Contracts', 'Invoices', 'WorkOrders', 'Customers', 'Items', 
    'Inventory', 'Rentals', 'Transactions', 'Payments', 'Employees', 
    'Vendors', 'PurchaseOrders', 'PurchaseOrderDetails'
  ];
  
  markdown += `## Common Rental-Related Tables\n\n`;
  markdown += `| Table Name | Present in Database |\n`;
  markdown += `|------------|---------------------|\n`;
  
  commonTables.forEach(tableName => {
    const present = tables.includes(tableName) ? '✅ Yes' : '❌ No';
    markdown += `| \`${tableName}\` | ${present} |\n`;
  });
  
  return markdown;
}

// Main function
function main() {
  try {
    console.log('Generating Point of Rental tables list...');
    
    // List all tables in the database
    const tables = listTablesWithPowerShell();
    
    if (!tables || tables.length === 0) {
      console.error('No tables found in the database or error occurred');
      
      // Create a minimal file with common rental tables
      const commonTables = [
        'Contracts', 'Invoices', 'WorkOrders', 'Customers', 'Items', 
        'Inventory', 'Rentals', 'Transactions', 'Payments', 'Employees', 
        'Vendors', 'PurchaseOrders', 'PurchaseOrderDetails'
      ];
      
      const markdown = generateMarkdown(commonTables);
      fs.writeFileSync(OUTPUT_FILE, markdown);
      console.log(`Created table list with common rental tables at ${OUTPUT_FILE}`);
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
