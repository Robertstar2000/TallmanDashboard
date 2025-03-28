/**
 * Find POR Sales Tables
 * 
 * This script examines the POR database to find tables related to sales data
 * that can be used for the Historical Data chart.
 */

const fs = require('fs');
const path = require('path');
const MDBReader = require('mdb-reader').default;

// Path to the MS Access database - use environment variable or default
const dbPath = process.env.POR_ACCESS_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.mdb';

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Error: MS Access file not found at path: ${dbPath}`);
  console.error('Please ensure the file exists at the specified location or set the POR_ACCESS_FILE_PATH environment variable.');
  process.exit(1);
}

// Function to find sales-related tables in the POR database
async function findPorSalesTables() {
  try {
    console.log(`Reading POR database from ${dbPath}...`);
    
    // Read the database file
    const buffer = fs.readFileSync(dbPath);
    const reader = new MDBReader(buffer);
    
    // Get all table names
    const tables = reader.getTableNames();
    
    console.log(`Found ${tables.length} tables in the database.`);
    
    // Keywords to look for in table and column names
    const salesKeywords = ['sale', 'order', 'invoice', 'revenue', 'income', 'purchase', 'po', 'amount', 'price', 'cost'];
    
    // Store sales-related tables
    const salesTables = [];
    
    // Examine each table
    for (const tableName of tables) {
      try {
        const table = reader.getTable(tableName);
        const columns = table.getColumnNames();
        const rowCount = table.getRowCount();
        
        // Check if table name contains any sales keywords
        const tableNameLower = tableName.toLowerCase();
        const isTableNameRelated = salesKeywords.some(keyword => tableNameLower.includes(keyword));
        
        // Check if any column names contain sales keywords
        const salesRelatedColumns = columns.filter(col => 
          salesKeywords.some(keyword => col.toLowerCase().includes(keyword))
        );
        
        // If table name or columns are sales-related, examine further
        if (isTableNameRelated || salesRelatedColumns.length > 0) {
          console.log(`\nFound potential sales-related table: ${tableName}`);
          console.log(`Columns: ${columns.join(', ')}`);
          console.log(`Row count: ${rowCount}`);
          console.log(`Sales-related columns: ${salesRelatedColumns.join(', ')}`);
          
          // Sample data if available
          if (rowCount > 0) {
            const rows = table.getData();
            console.log('\nSample data (first 3 rows):');
            rows.slice(0, 3).forEach((row, index) => {
              console.log(`Row ${index + 1}:`, JSON.stringify(row));
            });
            
            // Store table info
            salesTables.push({
              name: tableName,
              columns: columns,
              salesColumns: salesRelatedColumns,
              rowCount: rowCount,
              sampleData: rows.slice(0, 3)
            });
          }
        }
      } catch (error) {
        console.error(`Error reading table ${tableName}:`, error.message);
      }
    }
    
    // Save sales tables info to a JSON file
    const salesTablesJson = JSON.stringify(salesTables, null, 2);
    fs.writeFileSync('por-sales-tables.json', salesTablesJson);
    console.log('\nSaved sales-related tables info to por-sales-tables.json');
    
    // Generate MS Access SQL for monthly sales queries
    console.log('\nGenerating MS Access SQL for monthly sales queries:');
    
    // Find the best table for sales data
    let bestTable = null;
    let bestColumn = null;
    
    if (salesTables.length > 0) {
      // Look for PurchaseOrder table first
      const purchaseOrderTable = salesTables.find(t => t.name === 'PurchaseOrder');
      if (purchaseOrderTable) {
        bestTable = 'PurchaseOrder';
        // Look for amount/total column
        const amountColumn = purchaseOrderTable.columns.find(c => 
          ['amount', 'total', 'price', 'cost', 'value'].some(k => c.toLowerCase().includes(k))
        );
        bestColumn = amountColumn || 'Total';
      } else {
        // Otherwise use the first sales table found
        bestTable = salesTables[0].name;
        // Look for amount/total column
        const amountColumn = salesTables[0].columns.find(c => 
          ['amount', 'total', 'price', 'cost', 'value'].some(k => c.toLowerCase().includes(k))
        );
        bestColumn = amountColumn || salesTables[0].salesColumns[0] || salesTables[0].columns[0];
      }
      
      console.log(`\nSelected table for sales data: ${bestTable}`);
      console.log(`Selected column for sales amount: ${bestColumn}`);
      
      // Generate MS Access SQL for each month
      const monthlyQueries = [];
      
      for (let i = 0; i < 12; i++) {
        const monthName = `Month ${i + 1}`;
        const monthOffset = i === 0 ? 0 : -i;
        
        // SQL Server version (for reference)
        const sqlServerSql = `SELECT ISNULL(SUM([${bestColumn}]), 0) as value FROM [${bestTable}] WHERE FORMAT([Date], 'yyyy-MM') = FORMAT(DATEADD(month, ${monthOffset}, GETDATE()), 'yyyy-MM')`;
        
        // MS Access version
        const msAccessSql = `SELECT Sum(Nz([${bestColumn}],0)) AS value FROM [${bestTable}] WHERE Format([Date],"yyyy-mm") = Format(DateAdd("m",${monthOffset},Date()),"yyyy-mm")`;
        
        monthlyQueries.push({
          timeframe: monthName,
          variableName: "POR",
          sqlServerSql: sqlServerSql,
          msAccessSql: msAccessSql,
          tableName: bestTable
        });
        
        console.log(`\n${monthName}:`);
        console.log(`MS Access SQL: ${msAccessSql}`);
      }
      
      // Save monthly queries to a JSON file
      const monthlyQueriesJson = JSON.stringify(monthlyQueries, null, 2);
      fs.writeFileSync('por-monthly-sales-queries.json', monthlyQueriesJson);
      console.log('\nSaved monthly sales queries to por-monthly-sales-queries.json');
    } else {
      console.log('\nNo sales-related tables found in the POR database.');
    }
    
  } catch (error) {
    console.error('Error examining POR database:', error.message);
  }
}

// Run the function
findPorSalesTables();
