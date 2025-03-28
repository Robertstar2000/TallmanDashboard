/**
 * Test script for reading purchase order data from POR database
 * 
 * This script uses the mdb-reader package to directly read data from the MS Access database
 * without requiring ODBC or the Microsoft Access Database Engine.
 */

const fs = require('fs');
const path = require('path');
const MDBReader = require('mdb-reader').default;

// Path to the MS Access database
const dbPath = 'C:\\Users\\BobM\\Desktop\\POR.mdb';

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Error: MS Access file not found at path: ${dbPath}`);
  console.error('Please ensure the file exists at the specified location.');
  process.exit(1);
}

// Array to store table information
const tableInfo = [];

// Array to store POR Overview queries
const porOverviewQueries = [
  {
    chartName: "POR Overview",
    variableName: "Open POs",
    sqlExpression: "SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Open'",
    tableName: "PurchaseOrder"
  },
  {
    chartName: "POR Overview",
    variableName: "Closed POs",
    sqlExpression: "SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Closed'",
    tableName: "PurchaseOrder"
  },
  {
    chartName: "POR Overview",
    variableName: "POs This Month",
    sqlExpression: "SELECT COUNT(*) FROM PurchaseOrder WHERE [Date] BETWEEN #" + 
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString() + 
      "# AND #" + new Date().toLocaleDateString() + "#",
    tableName: "PurchaseOrder"
  },
  {
    chartName: "POR Overview",
    variableName: "POs Last Month",
    sqlExpression: "SELECT COUNT(*) FROM PurchaseOrder WHERE [Date] BETWEEN #" + 
      new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString() + 
      "# AND #" + new Date(new Date().getFullYear(), new Date().getMonth(), 0).toLocaleDateString() + "#",
    tableName: "PurchaseOrder"
  }
];

// Function to find purchase order related tables
async function findPurchaseOrderTables() {
  try {
    console.log('Reading POR database...');
    
    // Read the database file
    const buffer = fs.readFileSync(dbPath);
    const reader = new MDBReader(buffer);
    
    // Get all table names
    const tables = reader.getTableNames();
    
    console.log(`Found ${tables.length} tables in the database.`);
    
    // Store all table names for documentation
    tables.forEach(tableName => {
      try {
        const table = reader.getTable(tableName);
        const columns = table.getColumnNames();
        const rowCount = table.getRowCount();
        
        tableInfo.push({
          name: tableName,
          columns: columns,
          rowCount: rowCount
        });
        
        // Check if this is a purchase order related table
        if (tableName === 'PurchaseOrder' || 
            tableName.includes('PO') || 
            tableName.includes('Purchase')) {
          console.log(`\nFound purchase order related table: ${tableName}`);
          console.log(`Columns: ${columns.join(', ')}`);
          console.log(`Row count: ${rowCount}`);
          
          // Sample data if available
          if (rowCount > 0) {
            const rows = table.getData();
            console.log('\nSample data (first 5 rows):');
            rows.slice(0, 5).forEach((row, index) => {
              console.log(`Row ${index + 1}:`, JSON.stringify(row));
            });
          }
        }
      } catch (error) {
        console.error(`Error reading table ${tableName}:`, error.message);
      }
    });
    
    // Test the POR Overview queries against the database
    console.log('\nTesting POR Overview queries...');
    
    // Get the PurchaseOrder table
    if (tables.includes('PurchaseOrder')) {
      const purchaseOrderTable = reader.getTable('PurchaseOrder');
      
      // Execute each query and store the results
      for (const query of porOverviewQueries) {
        console.log(`\nExecuting query for ${query.variableName}:`);
        console.log(query.sqlExpression);
        
        try {
          // This is a simplified approach - in reality, we would need to parse and execute the SQL
          // For demonstration, we'll just count rows based on the condition in the query
          let result = 0;
          
          if (query.variableName === 'Open POs') {
            result = purchaseOrderTable.getData().filter(row => row.Status === 'Open').length;
          } else if (query.variableName === 'Closed POs') {
            result = purchaseOrderTable.getData().filter(row => row.Status === 'Closed').length;
          } else if (query.variableName === 'POs This Month') {
            const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const endDate = new Date();
            result = purchaseOrderTable.getData().filter(row => {
              const rowDate = new Date(row.Date);
              return rowDate >= startDate && rowDate <= endDate;
            }).length;
          } else if (query.variableName === 'POs Last Month') {
            const startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
            const endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
            result = purchaseOrderTable.getData().filter(row => {
              const rowDate = new Date(row.Date);
              return rowDate >= startDate && rowDate <= endDate;
            }).length;
          }
          
          console.log(`Result: ${result}`);
          
          // Store the result in the query object
          query.value = result;
        } catch (error) {
          console.error(`Error executing query: ${error.message}`);
          query.value = 0;
        }
      }
      
      // Save the queries with values to a JSON file
      const queriesWithValues = JSON.stringify(porOverviewQueries, null, 2);
      fs.writeFileSync('por-overview-rows-with-values.json', queriesWithValues);
      console.log('\nSaved POR Overview queries with values to por-overview-rows-with-values.json');
      
      // Generate MS Access compatible SQL for each query
      console.log('\nGenerating MS Access compatible SQL for each query:');
      
      for (const query of porOverviewQueries) {
        const msAccessSQL = formatSQLForMSAccess(query.sqlExpression);
        query.productionSqlExpression = msAccessSQL;
        
        console.log(`\n${query.variableName}:`);
        console.log(msAccessSQL);
      }
      
      // Save the queries with MS Access SQL to a JSON file
      const queriesWithMSAccessSQL = JSON.stringify(porOverviewQueries, null, 2);
      fs.writeFileSync('por-overview-rows-with-ms-access-sql.json', queriesWithMSAccessSQL);
      console.log('\nSaved POR Overview queries with MS Access SQL to por-overview-rows-with-ms-access-sql.json');
      
      console.log('\nNext steps:');
      console.log('1. Run the update-por-admin-production-sql.ts script to update the admin spreadsheet');
      console.log('2. Start the development server with npm run dev');
      console.log('3. Verify the POR Overview queries in the admin spreadsheet');
    } else {
      console.error('Error: PurchaseOrder table not found in the database.');
    }
    
    // Write table information to a markdown file
    writeTableInfoToMarkdown(tableInfo);
    
  } catch (error) {
    console.error('Error reading POR database:', error.message);
  }
}

/**
 * Format SQL for MS Access
 * 
 * This function ensures SQL queries are compatible with MS Access:
 * - Uses # for date literals instead of single quotes
 * - Uses [] for column names with spaces
 * - Adjusts other syntax as needed
 */
function formatSQLForMSAccess(sql) {
  // Format the SQL for MS Access
  let formattedSql = sql;
  
  // Replace date literals using single quotes with # format
  const datePattern = /'(\d{1,2}\/\d{1,2}\/\d{4})'/g;
  formattedSql = formattedSql.replace(datePattern, '#$1#');
  
  // Replace SQL Server specific functions with MS Access equivalents
  formattedSql = formattedSql
    .replace(/GETDATE\(\)/gi, 'Date()')
    .replace(/DATEADD\((\w+),\s*([^,]+),\s*([^)]+)\)/gi, (match, unit, number, date) => {
      // Convert DATEADD to DateAdd for MS Access
      return `DateAdd("${unit}", ${number}, ${date})`;
    });
  
  return formattedSql;
}

// Function to write table information to a markdown file
function writeTableInfoToMarkdown(tableInfo) {
  let markdown = '# POR Database Structure\n\n';
  markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
  
  // Sort tables by name
  tableInfo.sort((a, b) => a.name.localeCompare(b.name));
  
  // Table of contents
  markdown += '## Table of Contents\n\n';
  tableInfo.forEach(table => {
    markdown += `- [${table.name}](#${table.name.toLowerCase().replace(/\s+/g, '-')})\n`;
  });
  
  // Table details
  markdown += '\n## Tables\n\n';
  tableInfo.forEach(table => {
    markdown += `### ${table.name}\n\n`;
    markdown += `Row count: ${table.rowCount}\n\n`;
    markdown += '| Column Name | Data Type |\n';
    markdown += '|------------|----------|\n';
    
    table.columns.forEach(column => {
      markdown += `| ${column} | - |\n`;
    });
    
    markdown += '\n';
  });
  
  // Write to file
  fs.writeFileSync('por-database-structure.md', markdown);
  console.log('\nWrote table information to por-database-structure.md');
}

// Run the test
findPurchaseOrderTables();
