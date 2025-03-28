/**
 * Script to list all tables in the Point of Rental database
 * using node-adodb and generate a markdown file
 */

const ADODB = require('node-adodb');
const fs = require('fs');
const path = require('path');

// Configuration
const POR_DB_PATH = 'C:\\Users\\BobM\\Desktop\\POR.mdb';
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'PORTables.md');

// Ensure the docs directory exists
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

// Create a connection to the MS Access database
const connection = ADODB.open(
  `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${POR_DB_PATH};Persist Security Info=False;`
);

// Function to list all tables in the database
async function listTables() {
  try {
    console.log(`Connecting to MS Access database: ${POR_DB_PATH}`);
    
    // Query to get all user tables
    const query = `
      SELECT MSysObjects.Name AS TableName
      FROM MSysObjects
      WHERE (((MSysObjects.Type) In (1,4,6)) AND ((MSysObjects.Flags)=0))
      ORDER BY MSysObjects.Name
    `;
    
    // Execute the query
    const tables = await connection.query(query);
    console.log(`Found ${tables.length} tables in the database`);
    
    return tables;
  } catch (error) {
    console.error('Error listing tables:', error);
    
    // Try alternative approach if the first one fails
    try {
      console.log('Trying alternative approach to list tables...');
      
      // Alternative query using schema information
      const schemaQuery = `SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0`;
      const tables = await connection.query(schemaQuery);
      
      console.log(`Found ${tables.length} tables using alternative approach`);
      return tables;
    } catch (altError) {
      console.error('Alternative approach failed:', altError);
      
      // Try a third approach if the second one fails
      try {
        console.log('Trying to list tables using schema rowset...');
        
        // This uses the OpenSchema method which might work in some versions
        const tables = [];
        const schema = await connection.schema(20); // adSchemaTables = 20
        
        for (const table of schema) {
          if (table.TABLE_TYPE === 'TABLE') {
            tables.push({ TableName: table.TABLE_NAME });
          }
        }
        
        console.log(`Found ${tables.length} tables using schema rowset`);
        return tables;
      } catch (schemaError) {
        console.error('Schema rowset approach failed:', schemaError);
        return [];
      }
    }
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
  tables.sort((a, b) => a.TableName.localeCompare(b.TableName));
  
  // Group tables by first letter for better organization
  const groupedTables = {};
  tables.forEach(table => {
    const firstLetter = table.TableName.charAt(0).toUpperCase();
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
      markdown += `| \`${table.TableName}\` |\n`;
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
    const tables = await listTables();
    
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
