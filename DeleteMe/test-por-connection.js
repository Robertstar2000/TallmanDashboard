/**
 * Test POR Connection
 * 
 * This script tests the connection to the POR database using the mdb-reader package.
 * It helps verify that the POR.MDB file can be accessed and read correctly.
 */

const fs = require('fs');
const path = require('path');
const { default: MDBReader } = require('mdb-reader');

// Default POR database file path
const DEFAULT_POR_FILE_PATH = 'C:\\Users\\BobM\\Desktop\\POR.MDB';

// Simple implementation of PORDirectReader for testing
class PORDirectReader {
  constructor(filePath) {
    this.filePath = filePath;
    this.reader = null;
  }

  async connect() {
    try {
      // Check if the file exists
      if (!this.filePath) {
        return { success: false, message: 'No file path provided for MS Access database' };
      }
      
      if (!fs.existsSync(this.filePath)) {
        return { success: false, message: `MS Access file not found at path: ${this.filePath}` };
      }
      
      // Read the database file
      console.log('Reading database file...');
      const buffer = fs.readFileSync(this.filePath);
      this.reader = new MDBReader(buffer);
      
      // Get available tables
      const tables = this.reader.getTableNames();
      
      if (tables.length === 0) {
        return { success: false, message: 'No tables found in the database' };
      }
      
      console.log(`Successfully read database. Found ${tables.length} tables.`);
      
      return { 
        success: true, 
        message: `Successfully connected to POR database and found ${tables.length} tables` 
      };
    } catch (error) {
      return { success: false, message: `Error connecting to POR database: ${error.message}` };
    }
  }

  async executeQuery(query) {
    if (!this.reader) {
      throw new Error('Not connected to database');
    }

    try {
      // This is a simplified implementation - in reality, we'd parse the SQL and execute it
      // For this test, we'll just return some table info based on the query
      if (query.toLowerCase().includes('select') && query.toLowerCase().includes('from')) {
        // Extract table name from query (very simplified)
        const tableMatch = query.match(/from\s+([^\s;]+)/i);
        if (tableMatch && tableMatch[1]) {
          const tableName = tableMatch[1];
          if (this.reader.getTableNames().includes(tableName)) {
            const table = this.reader.getTable(tableName);
            const columns = table.getColumnNames();
            const rows = table.getData();
            return {
              success: true,
              columns,
              rows: rows.slice(0, 5), // Just return first 5 rows for testing
              rowCount: rows.length
            };
          } else {
            return { success: false, message: `Table '${tableName}' not found` };
          }
        }
      }
      return { success: false, message: 'Query not supported in this test script' };
    } catch (error) {
      return { success: false, message: `Query execution error: ${error.message}` };
    }
  }

  disconnect() {
    this.reader = null;
    return Promise.resolve();
  }
}

async function testPORConnection(filePath = DEFAULT_POR_FILE_PATH) {
  console.log(`Testing connection to POR database at: ${filePath}`);
  
  try {
    const reader = new PORDirectReader(filePath);
    const result = await reader.connect();
    
    if (!result.success) {
      console.error(`Connection failed: ${result.message}`);
      return false;
    }
    
    console.log(`Connection successful: ${result.message}`);
    
    // Try to execute a simple query
    console.log('\nTesting query execution...');
    const tables = reader.reader.getTableNames();
    
    if (tables.length > 0) {
      const testTable = tables[0];
      console.log(`Executing query on table: ${testTable}`);
      
      const queryResult = await reader.executeQuery(`SELECT * FROM ${testTable} LIMIT 5`);
      
      if (queryResult.success) {
        console.log(`Query successful. Found ${queryResult.rowCount} rows in table ${testTable}`);
        console.log('Column names:', queryResult.columns);
        console.log('Sample data (first 5 rows):', queryResult.rows);
      } else {
        console.error(`Query failed: ${queryResult.message}`);
      }
    }
    
    // Disconnect
    await reader.disconnect();
    console.log('Disconnected from database');
    
    return true;
  } catch (error) {
    console.error('Test failed with error:', error);
    return false;
  }
}

// Get file path from command line argument or use default
const filePath = process.argv[2] || DEFAULT_POR_FILE_PATH;

// Run the test
testPORConnection(filePath)
  .then(success => {
    if (success) {
      console.log('\nPOR connection test completed successfully');
    } else {
      console.error('\nPOR connection test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error during test:', error);
    process.exit(1);
  });
