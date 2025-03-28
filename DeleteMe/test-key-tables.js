/**
 * Focused test script to check key P21 and POR tables for non-zero responses
 * Tests a smaller set of tables with better error handling
 */

const odbc = require('odbc');
const fs = require('fs');
const path = require('path');
const MDBReader = require('mdb-reader');

// Key tables to test from each database
const tablesToTest = {
  p21: [
    { name: 'oe_hdr', schemas: ['', 'dbo.', 'P21.dbo.'] },
    { name: 'customer', schemas: ['', 'dbo.', 'P21.dbo.'] },
    { name: 'inv_mast', schemas: ['', 'dbo.', 'P21.dbo.'] }
  ],
  por: [
    { name: 'MSysObjects' },  // System table that should exist
    { name: 'PurchaseOrder' }
  ]
};

// Configuration
const config = {
  p21: {
    dsn: 'P21Play',
    useWindowsAuth: true
  },
  por: {
    filePath: 'C:\\Users\\BobM\\Desktop\\POR.MDB'
  }
};

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  p21: {},
  por: {}
};

/**
 * Test a P21 table with different schema prefixes
 */
async function testP21Table(connection, tableInfo) {
  const { name, schemas } = tableInfo;
  console.log(`\nTesting P21 table: ${name}`);
  
  for (const schema of schemas) {
    const fullTableName = `${schema}${name}`;
    const query = `SELECT COUNT(*) AS count FROM ${fullTableName}`;
    
    try {
      console.log(`  Trying: ${query}`);
      const result = await connection.query(query);
      
      if (result && result.length > 0) {
        const count = result[0].count;
        console.log(`  ✅ Success: ${count} records`);
        
        // Store the successful result and stop trying other schemas
        results.p21[name] = {
          success: true,
          count: count,
          query: query
        };
        
        return true;
      }
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    
    // Add a small delay between queries
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // If we get here, all schema variations failed
  console.log(`  ❌ All queries failed for table: ${name}`);
  results.p21[name] = {
    success: false,
    count: 0,
    error: 'All schema variations failed'
  };
  
  return false;
}

/**
 * Test P21 database tables
 */
async function testP21Database() {
  console.log('\n=== Testing P21 Database ===');
  
  try {
    // Connect to P21
    const connectionString = `DSN=${config.p21.dsn};Trusted_Connection=Yes;`;
    console.log(`Connecting to P21 using DSN: ${config.p21.dsn}`);
    
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected to P21 database');
    
    // Test each table
    for (const tableInfo of tablesToTest.p21) {
      await testP21Table(connection, tableInfo);
    }
    
    // Close the connection
    await connection.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error(`❌ P21 connection error: ${error.message}`);
    results.p21.connectionError = error.message;
  }
}

/**
 * Test POR database tables
 */
async function testPORDatabase() {
  console.log('\n=== Testing POR Database ===');
  
  try {
    // Check if file exists
    if (!fs.existsSync(config.por.filePath)) {
      console.error(`❌ POR database file not found at: ${config.por.filePath}`);
      results.por.connectionError = 'File not found';
      return;
    }
    
    console.log(`Opening POR database at: ${config.por.filePath}`);
    const buffer = fs.readFileSync(config.por.filePath);
    const reader = new MDBReader(buffer);
    
    console.log('✅ Connected to POR database');
    
    // Get all table names
    const tableNames = reader.getTableNames();
    console.log(`Found ${tableNames.length} tables in POR database`);
    
    // Test each table
    for (const tableInfo of tablesToTest.por) {
      const tableName = tableInfo.name;
      console.log(`\nTesting POR table: ${tableName}`);
      
      try {
        if (tableNames.includes(tableName)) {
          const table = reader.getTable(tableName);
          const records = table.getData();
          const count = records.length;
          
          console.log(`  ✅ Success: ${count} records`);
          
          results.por[tableName] = {
            success: true,
            count: count
          };
        } else {
          console.log(`  ❌ Table not found in database`);
          
          results.por[tableName] = {
            success: false,
            count: 0,
            error: 'Table not found'
          };
        }
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        
        results.por[tableName] = {
          success: false,
          count: 0,
          error: error.message
        };
      }
    }
    
  } catch (error) {
    console.error(`❌ POR connection error: ${error.message}`);
    results.por.connectionError = error.message;
  }
}

/**
 * Generate a summary report
 */
function generateReport() {
  console.log('\n=== Test Results Summary ===');
  
  // P21 Results
  console.log('\nP21 Tables:');
  console.log('-------------');
  
  if (results.p21.connectionError) {
    console.log(`❌ Connection Error: ${results.p21.connectionError}`);
  } else {
    let successCount = 0;
    let failCount = 0;
    
    for (const [tableName, result] of Object.entries(results.p21)) {
      if (result.success) {
        console.log(`✅ ${tableName}: ${result.count} records`);
        if (result.query) {
          console.log(`   Using: ${result.query}`);
        }
        successCount++;
      } else {
        console.log(`❌ ${tableName}: Failed - ${result.error || 'Unknown error'}`);
        failCount++;
      }
    }
    
    console.log(`\nP21 Summary: ${successCount} tables succeeded, ${failCount} tables failed`);
  }
  
  // POR Results
  console.log('\nPOR Tables:');
  console.log('-------------');
  
  if (results.por.connectionError) {
    console.log(`❌ Connection Error: ${results.por.connectionError}`);
  } else {
    let successCount = 0;
    let failCount = 0;
    
    for (const [tableName, result] of Object.entries(results.por)) {
      if (result.success) {
        console.log(`✅ ${tableName}: ${result.count} records`);
        successCount++;
      } else {
        console.log(`❌ ${tableName}: Failed - ${result.error || 'Unknown error'}`);
        failCount++;
      }
    }
    
    console.log(`\nPOR Summary: ${successCount} tables succeeded, ${failCount} tables failed`);
  }
  
  // Save results to file
  const reportPath = path.join(__dirname, 'key-tables-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${reportPath}`);
  
  // Also save a text report
  const textReportPath = path.join(__dirname, 'key-tables-test-results.txt');
  let textReport = '=== Key Database Tables Response Test Results ===\n';
  textReport += `Generated at: ${results.timestamp}\n\n`;
  
  // P21 section
  textReport += '=== P21 Tables ===\n';
  if (results.p21.connectionError) {
    textReport += `CONNECTION ERROR: ${results.p21.connectionError}\n`;
  } else {
    for (const [tableName, result] of Object.entries(results.p21)) {
      if (result.success) {
        textReport += `✓ ${tableName}: ${result.count} records\n`;
        if (result.query) {
          textReport += `   Using: ${result.query}\n`;
        }
      } else {
        textReport += `✗ ${tableName}: Failed - ${result.error || 'Unknown error'}\n`;
      }
    }
  }
  
  // POR section
  textReport += '\n=== POR Tables ===\n';
  if (results.por.connectionError) {
    textReport += `CONNECTION ERROR: ${results.por.connectionError}\n`;
  } else {
    for (const [tableName, result] of Object.entries(results.por)) {
      if (result.success) {
        textReport += `✓ ${tableName}: ${result.count} records\n`;
      } else {
        textReport += `✗ ${tableName}: Failed - ${result.error || 'Unknown error'}\n`;
      }
    }
  }
  
  fs.writeFileSync(textReportPath, textReport);
  console.log(`Text report saved to: ${textReportPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('=== Key Database Tables Response Test ===');
  console.log('Starting test at', new Date().toISOString());
  
  try {
    // Test P21 tables
    await testP21Database();
    
    // Test POR tables
    await testPORDatabase();
    
    // Generate report
    generateReport();
    
    console.log('\n=== Test completed at', new Date().toISOString(), '===');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the tests
main()
  .then(() => {
    console.log('Test script completed successfully');
  })
  .catch(error => {
    console.error('Test script failed:', error);
  });
