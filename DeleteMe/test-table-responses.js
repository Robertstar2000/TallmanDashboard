/**
 * Test script to check P21 and POR tables for non-zero responses
 * This script will attempt to count records in each table and report the results
 */

const odbc = require('odbc');
const fs = require('fs');
const path = require('path');
const MDBReader = require('mdb-reader');

// Tables to test from DBTables.txt
const p21Tables = [
  'oe_hdr',
  'ar_open_items',
  'ap_open_items',
  'customer',
  'inv_mast',
  'customer_mst',
  'invoice_hdr',
  'order_hdr',
  'location_mst'
];

const porTables = [
  'PurchaseOrder',
  'MSysObjects', // System table that should always exist
  'MSysQueries',
  'MSysRelationships'
];

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
  p21: {},
  por: {}
};

/**
 * Test P21 tables using ODBC connection
 */
async function testP21Tables() {
  console.log('\n=== Testing P21 Tables ===');
  
  try {
    // Connect to P21 database
    const connectionString = `DSN=${config.p21.dsn};Trusted_Connection=Yes;`;
    console.log(`Connecting to P21 using DSN: ${config.p21.dsn}`);
    
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected to P21 database');
    
    // Test each table
    for (const tableName of p21Tables) {
      try {
        // Try different schema variations
        const queries = [
          `SELECT COUNT(*) AS count FROM ${tableName}`,
          `SELECT COUNT(*) AS count FROM dbo.${tableName}`,
          `SELECT COUNT(*) AS count FROM P21.dbo.${tableName}`
        ];
        
        let success = false;
        let count = 0;
        let error = null;
        let successQuery = '';
        
        // Try each query variation until one succeeds
        for (const query of queries) {
          try {
            console.log(`Trying: ${query}`);
            const result = await connection.query(query);
            
            if (result && result.length > 0) {
              count = result[0].count;
              success = true;
              successQuery = query;
              console.log(`✅ Table ${tableName}: ${count} records`);
              break; // Exit the loop if successful
            }
          } catch (queryError) {
            error = queryError;
            console.log(`  Query failed: ${queryError.message}`);
            // Continue to the next query variation
          }
        }
        
        if (!success) {
          console.log(`❌ Table ${tableName}: All queries failed`);
        }
        
        // Store the result
        results.p21[tableName] = {
          exists: success,
          count: count,
          error: success ? null : (error ? error.message : 'Unknown error'),
          successQuery: successQuery
        };
        
        // Add a small delay between queries to prevent overwhelming the connection
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (tableError) {
        console.error(`❌ Error testing table ${tableName}:`, tableError.message);
        results.p21[tableName] = {
          exists: false,
          count: 0,
          error: tableError.message
        };
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('❌ P21 connection error:', error.message);
    results.p21.connectionError = error.message;
  }
}

/**
 * Test POR tables using MDB Reader
 */
async function testPORTables() {
  console.log('\n=== Testing POR Tables ===');
  
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
    console.log('Available tables:', tableNames.join(', '));
    
    // Test each table
    for (const tableName of porTables) {
      try {
        if (tableNames.includes(tableName)) {
          const table = reader.getTable(tableName);
          const records = table.getData();
          const count = records.length;
          
          console.log(`✅ Table ${tableName}: ${count} records`);
          
          results.por[tableName] = {
            exists: true,
            count: count,
            error: null
          };
        } else {
          console.log(`❌ Table ${tableName}: Not found in database`);
          
          results.por[tableName] = {
            exists: false,
            count: 0,
            error: 'Table not found'
          };
        }
      } catch (tableError) {
        console.error(`❌ Error testing table ${tableName}:`, tableError.message);
        
        results.por[tableName] = {
          exists: false,
          count: 0,
          error: tableError.message
        };
      }
    }
    
  } catch (error) {
    console.error('❌ POR connection error:', error.message);
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
      if (result.exists) {
        console.log(`✅ ${tableName}: ${result.count} records`);
        if (result.successQuery) {
          console.log(`   Using: ${result.successQuery}`);
        }
        successCount++;
      } else {
        console.log(`❌ ${tableName}: Failed - ${result.error}`);
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
      if (result.exists) {
        console.log(`✅ ${tableName}: ${result.count} records`);
        successCount++;
      } else {
        console.log(`❌ ${tableName}: Failed - ${result.error}`);
        failCount++;
      }
    }
    
    console.log(`\nPOR Summary: ${successCount} tables succeeded, ${failCount} tables failed`);
  }
  
  // Save results to file
  const reportPath = path.join(__dirname, 'table-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${reportPath}`);
  
  // Also save a text report
  const textReportPath = path.join(__dirname, 'table-test-results.txt');
  let textReport = '=== Database Table Response Test Results ===\n';
  textReport += `Generated at: ${new Date().toISOString()}\n\n`;
  
  // P21 section
  textReport += '=== P21 Tables ===\n';
  if (results.p21.connectionError) {
    textReport += `CONNECTION ERROR: ${results.p21.connectionError}\n`;
  } else {
    for (const [tableName, result] of Object.entries(results.p21)) {
      if (result.exists) {
        textReport += `✓ ${tableName}: ${result.count} records\n`;
        if (result.successQuery) {
          textReport += `   Using: ${result.successQuery}\n`;
        }
      } else {
        textReport += `✗ ${tableName}: Failed - ${result.error}\n`;
      }
    }
  }
  
  // POR section
  textReport += '\n=== POR Tables ===\n';
  if (results.por.connectionError) {
    textReport += `CONNECTION ERROR: ${results.por.connectionError}\n`;
  } else {
    for (const [tableName, result] of Object.entries(results.por)) {
      if (result.exists) {
        textReport += `✓ ${tableName}: ${result.count} records\n`;
      } else {
        textReport += `✗ ${tableName}: Failed - ${result.error}\n`;
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
  console.log('=== Database Table Response Test ===');
  console.log('Starting test at', new Date().toISOString());
  
  try {
    // Test P21 tables
    await testP21Tables();
    
    // Test POR tables
    await testPORTables();
    
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
