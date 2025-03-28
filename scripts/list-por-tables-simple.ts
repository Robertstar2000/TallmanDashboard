import fs from 'fs';
import MDBReader from 'mdb-reader';

// Set the correct POR database path
const POR_DB_PATH = 'C:\\Users\\BobM\\Desktop\\POR.MDB';

/**
 * Main function to list tables in the POR database
 */
async function main() {
  console.log('Listing tables in POR database...');
  
  // Get the POR database path
  const porFilePath = process.env.POR_FILE_PATH || POR_DB_PATH;
  console.log(`Using POR database path: ${porFilePath}`);
  
  // Check if the file exists
  if (!fs.existsSync(porFilePath)) {
    console.error(`POR database file not found at path: ${porFilePath}`);
    process.exit(1);
  }
  
  try {
    // Read the database file
    const buffer = fs.readFileSync(porFilePath);
    const reader = new MDBReader(buffer);
    
    // Get table names
    const tableNames = reader.getTableNames();
    console.log('Available tables:');
    tableNames.forEach(table => console.log(`- ${table}`));
    
    // Look for tables that might be related to rentals, contracts, etc.
    const rentalRelatedTables = tableNames.filter(table => 
      table.toLowerCase().includes('rent') || 
      table.toLowerCase().includes('contract') || 
      table.toLowerCase().includes('order') ||
      table.toLowerCase().includes('invoice') ||
      table.toLowerCase().includes('customer') ||
      table.toLowerCase().includes('transaction')
    );
    
    console.log('\nPotential rental-related tables:');
    rentalRelatedTables.forEach(table => console.log(`- ${table}`));
    
    // Get column information for a few key tables
    if (rentalRelatedTables.length > 0) {
      for (const tableName of rentalRelatedTables.slice(0, 5)) { // Limit to first 5 tables to avoid overwhelming output
        try {
          console.log(`\nColumns in ${tableName}:`);
          const table = reader.getTable(tableName);
          const columns = table.getColumnNames();
          columns.forEach(column => console.log(`- ${column}`));
          
          // Count rows in the table
          const rows = table.getData();
          console.log(`Total rows in ${tableName}: ${rows.length}`);
        } catch (error) {
          console.error(`Error reading table ${tableName}:`, error);
        }
      }
    }
    
  } catch (error) {
    console.error('Error reading POR database:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
