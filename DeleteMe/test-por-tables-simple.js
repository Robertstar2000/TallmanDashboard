/**
 * Simple test script to check POR tables using the API endpoint
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Tables to test in POR database
const porTables = [
  'PurchaseOrder',
  'PurchaseOrderDetail',
  'CustomerFile_Tr_Bak',
  'Transactions',
  'TransactionItems',
  'ItemFile',
  'ItemPurchaseDetail',
  'ItemPurchaseDetailFinancing',
  'PurchaseOrderColumns'
];

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  tables: {},
  allTableNames: []
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
      port: 3001,
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
 * Get all table names from the POR database
 */
async function getAllTableNames() {
  console.log('Getting all table names from POR database...');
  
  try {
    // Use SHOW TABLES query
    const response = await executeQuery('SHOW TABLES');
    
    if (response.success && response.data && response.data.length > 0) {
      const tableNames = response.data.map(row => row.TableName);
      console.log(`Found ${tableNames.length} tables in the database`);
      results.allTableNames = tableNames;
      return tableNames;
    } else {
      console.log('No tables found or error in response:', response.message || 'Unknown error');
      results.allTableNames = [];
      return [];
    }
  } catch (error) {
    console.error(`Error getting table names: ${error.message}`);
    results.allTableNames = [];
    return [];
  }
}

/**
 * Test if a table exists in the database by checking against all table names
 */
async function testTableExists(tableName, allTables) {
  console.log(`Testing if table exists: ${tableName}`);
  
  try {
    // Check if table exists in the list of all tables (case-insensitive)
    const exists = allTables.some(name => name.toLowerCase() === tableName.toLowerCase());
    
    // Find the actual table name with correct case
    const actualTableName = exists 
      ? allTables.find(name => name.toLowerCase() === tableName.toLowerCase()) 
      : tableName;
    
    console.log(`  Table ${tableName}: ${exists ? 'EXISTS' : 'DOES NOT EXIST'}`);
    if (exists && actualTableName !== tableName) {
      console.log(`  Actual table name: ${actualTableName}`);
    }
    
    results.tables[tableName] = {
      exists: exists,
      actualName: actualTableName
    };
    
    return exists;
  } catch (error) {
    console.error(`  Error checking if table ${tableName} exists: ${error.message}`);
    
    results.tables[tableName] = {
      exists: false,
      error: error.message
    };
    
    return false;
  }
}

/**
 * Get table structure using DESCRIBE
 */
async function getTableStructure(tableName) {
  console.log(`Getting structure for table: ${tableName}`);
  
  try {
    // Use DESCRIBE query
    const response = await executeQuery(`DESCRIBE ${tableName}`);
    
    if (response.success && response.data && response.data.length > 0) {
      console.log(`  Table ${tableName} has ${response.data.length} columns`);
      results.tables[tableName].structure = response.data;
      return response.data;
    } else {
      console.log(`  Error or no columns found for table ${tableName}:`, response.message || 'Unknown error');
      results.tables[tableName].structureError = response.message || 'Unknown error';
      return null;
    }
  } catch (error) {
    console.error(`  Error getting structure for table ${tableName}: ${error.message}`);
    results.tables[tableName].structureError = error.message;
    return null;
  }
}

/**
 * Run the test
 */
async function runTest() {
  console.log('=== POR Tables Existence Test ===');
  
  // Get all table names
  const allTables = await getAllTableNames();
  
  if (allTables.length === 0) {
    console.log('No tables found in the database or connection error');
    return;
  }
  
  // Test each table
  for (const tableName of porTables) {
    const exists = await testTableExists(tableName, allTables);
    
    if (exists) {
      // Get table structure
      await getTableStructure(results.tables[tableName].actualName || tableName);
    }
  }
  
  // Generate report
  generateReport(allTables);
}

/**
 * Generate a report
 */
function generateReport(allTables) {
  console.log('\n=== POR Tables Existence Report ===');
  
  // Count tables that exist
  const existingTables = Object.entries(results.tables)
    .filter(([_, data]) => data.exists)
    .map(([name, _]) => name);
  
  const nonExistingTables = Object.entries(results.tables)
    .filter(([_, data]) => !data.exists)
    .map(([name, _]) => name);
  
  console.log(`Total tables in database: ${allTables.length}`);
  console.log(`Tables tested: ${porTables.length}`);
  console.log(`Tables that exist: ${existingTables.length}`);
  console.log(`Tables that do not exist: ${nonExistingTables.length}`);
  
  console.log('\nExisting tables:');
  existingTables.forEach(name => {
    const tableData = results.tables[name];
    const structureCount = tableData.structure ? tableData.structure.length : 0;
    console.log(`  - ${name}${tableData.actualName && tableData.actualName !== name ? ` (actual: ${tableData.actualName})` : ''} (${structureCount} columns)`);
  });
  
  console.log('\nNon-existing tables:');
  nonExistingTables.forEach(name => {
    console.log(`  - ${name}`);
  });
  
  // Save results to file
  const outputFile = path.join(__dirname, 'por-tables-report.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to ${outputFile}`);
  
  // Generate a list of all tables
  const allTablesFile = path.join(__dirname, 'por-tables-list.json');
  fs.writeFileSync(allTablesFile, JSON.stringify(allTables, null, 2));
  console.log(`All table names saved to ${allTablesFile}`);
}

// Run the test
runTest()
  .then(() => {
    console.log('Test completed successfully');
  })
  .catch(error => {
    console.error('Test failed:', error);
  });
