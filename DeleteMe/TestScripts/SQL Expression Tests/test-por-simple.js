const fs = require('fs');
// Import mdb-reader correctly
const MdbReader = require('mdb-reader');

// Configuration
const POR_FILE_PATH = 'C:\\Users\\BobM\\Desktop\\POR.MDB';

// Main function
async function main() {
  console.log('Starting simple POR database test...');
  
  try {
    // Check if file exists
    console.log(`Checking if POR database file exists: ${POR_FILE_PATH}`);
    if (!fs.existsSync(POR_FILE_PATH)) {
      console.log(`❌ POR database file not found at: ${POR_FILE_PATH}`);
      return;
    }
    
    console.log('POR database file exists, reading file...');
    const buffer = fs.readFileSync(POR_FILE_PATH);
    console.log(`Read ${buffer.length} bytes from POR database file`);
    
    console.log('Creating reader instance...');
    console.log('mdb-reader module type:', typeof MdbReader);
    
    // Create reader instance
    const reader = new MdbReader(buffer);
    
    console.log('Getting table names...');
    const tables = reader.getTableNames();
    console.log(`Found ${tables.length} tables in POR database`);
    
    if (tables.length > 0) {
      console.log('Tables:');
      tables.forEach(table => {
        console.log(`- ${table}`);
      });
      
      // Get sample data from first table
      const firstTable = tables[0];
      console.log(`\nGetting data from first table: ${firstTable}`);
      
      const table = reader.getTable(firstTable);
      const rowCount = table.getRowCount();
      console.log(`Table ${firstTable} has ${rowCount} rows`);
      
      const columns = table.getColumnNames();
      console.log(`Columns: ${columns.join(', ')}`);
      
      if (rowCount > 0) {
        console.log('\nFirst row data:');
        const firstRow = table.getData(0);
        console.log(JSON.stringify(firstRow, null, 2));
      }
    } else {
      console.log('No tables found in the database');
    }
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(error.stack);
  }
}

// Run the main function
main();
