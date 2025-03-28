/**
 * Test script to check POR tables using the API endpoint
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Tables to test in POR database - include all tables used in the test-admin-query buttons
const porTables = [
  'MSysObjects',  // System table that should exist
  'MSysQueries',
  'MSysRelationships',
  'PO_HDR',
  'PO_DTL',
  'CUSTOMER',
  'PurchaseOrder',
  'Orders',
  'Contracts',
  'Invoices',
  'Customers',
  'Inventory',
  'Equipment',
  'Rental',
  'RentalItems',
  'RentalContracts'
];

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  tables: {},
  tableNames: []
};

/**
 * Execute a query against the POR database using the API endpoint
 */
async function executeQuery(query) {
  return new Promise((resolve, reject) => {
    // Prepare the request data
    const data = JSON.stringify({
      server: 'POR',
      query: query
    });
    
    // Prepare the request options
    const options = {
      hostname: 'localhost',
      port: 3001, // Updated port to match our running server
      path: '/api/executeQuery',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    // Send the request
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    // Write the data and end the request
    req.write(data);
    req.end();
  });
}

/**
 * Test a single POR table
 */
async function testPORTable(tableName) {
  console.log(`\nTesting POR table: ${tableName}`);
  
  try {
    // Create a COUNT query
    const query = `SELECT COUNT(*) AS count FROM [${tableName}]`;
    console.log(`  Query: ${query}`);
    
    // Execute the query using the API endpoint
    const response = await executeQuery(query);
    
    if (response.success && response.data && response.data.length > 0) {
      const count = response.data[0].count;
      console.log(`  Success: ${count} records`);
      
      results.tables[tableName] = {
        success: true,
        count: count,
        query: query
      };
      
      return true;
    } else if (response.success) {
      console.log('  No results returned');
      results.tables[tableName] = {
        success: true,
        count: 0,
        query: query
      };
      return true;
    } else {
      console.error(`  Error: ${response.error || 'Unknown error'}`);
      results.tables[tableName] = {
        success: false,
        error: response.error || 'Unknown error',
        query: query
      };
      return false;
    }
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    results.tables[tableName] = {
      success: false,
      error: error.message,
      query: query
    };
    return false;
  }
}

/**
 * Get all table names from the POR database
 */
async function getAllTableNames() {
  console.log('\nGetting all table names from POR database');
  
  try {
    // Use SHOW TABLES query
    const response = await executeQuery('SHOW TABLES');
    
    if (response.success && response.data && response.data.length > 0) {
      const tableNames = response.data.map(row => row.TableName);
      console.log(`Found ${tableNames.length} tables in the database`);
      results.tableNames = tableNames;
      return tableNames;
    } else {
      console.log('No tables found in the database');
      results.tableNames = [];
      return [];
    }
  } catch (error) {
    console.error(`Error getting table names: ${error.message}`);
    results.tableNames = [];
    return [];
  }
}

/**
 * Test all POR tables
 */
async function testPORTables() {
  console.log('Starting POR tables test');
  
  // Get all table names first
  const allTables = await getAllTableNames();
  
  // Test each table in our list
  for (const tableName of porTables) {
    await testPORTable(tableName);
  }
  
  // Generate a report
  generateReport();
}

/**
 * Generate a summary report
 */
function generateReport() {
  console.log('\n=== POR Tables Test Report ===');
  console.log(`Timestamp: ${results.timestamp}`);
  
  // Count successful and failed tables
  const successCount = Object.values(results.tables).filter(t => t.success).length;
  const failCount = Object.values(results.tables).filter(t => !t.success).length;
  
  console.log(`\nTested ${Object.keys(results.tables).length} tables`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  // List all tables in the database
  console.log(`\nAll tables in database (${results.tableNames.length}):`);
  console.log(results.tableNames.join(', '));
  
  // List successful tables
  console.log('\nSuccessful tables:');
  Object.entries(results.tables)
    .filter(([_, data]) => data.success)
    .forEach(([table, data]) => {
      console.log(`  ${table}: ${data.count} records`);
    });
  
  // List failed tables
  console.log('\nFailed tables:');
  Object.entries(results.tables)
    .filter(([_, data]) => !data.success)
    .forEach(([table, data]) => {
      console.log(`  ${table}: ${data.error}`);
    });
  
  // Save results to file
  const reportPath = path.join(__dirname, 'por-tables-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

// Run the tests
testPORTables()
  .then(() => {
    console.log('Test script completed successfully');
  })
  .catch((error) => {
    console.error('Test script failed:', error);
  });
