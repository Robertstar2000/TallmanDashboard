/**
 * Test script to check P21 and POR database connections via the API
 * This script makes direct calls to the /api/executeQuery endpoint
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Tables to test
const tablesToTest = {
  p21: [
    { name: 'oe_hdr', query: 'SELECT COUNT(*) AS count FROM oe_hdr' },
    { name: 'customer', query: 'SELECT COUNT(*) AS count FROM customer' },
    { name: 'inv_mast', query: 'SELECT COUNT(*) AS count FROM inv_mast' }
  ],
  por: [
    { name: 'MSysObjects', query: 'SELECT COUNT(*) AS count FROM MSysObjects' },
    { name: 'PurchaseOrder', query: 'SELECT COUNT(*) AS count FROM PurchaseOrder' }
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
  },
  api: {
    host: 'localhost',
    port: 3000,
    path: '/api/executeQuery',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }
};

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  p21: {},
  por: {}
};

/**
 * Execute a query via the API
 */
async function executeQuery(serverType, query, serverConfig = {}) {
  return new Promise((resolve, reject) => {
    // Prepare request data
    const requestData = JSON.stringify({
      server: serverType,
      query: query,
      config: serverConfig
    });
    
    // Set content length
    const options = { ...config.api };
    options.headers['Content-Length'] = Buffer.byteLength(requestData);
    
    // Create request
    const req = http.request(options, (res) => {
      let data = '';
      
      // Collect response data
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Process response when complete
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    // Send request data
    req.write(requestData);
    req.end();
  });
}

/**
 * Test P21 tables
 */
async function testP21Tables() {
  console.log('\n=== Testing P21 Tables ===');
  
  for (const table of tablesToTest.p21) {
    console.log(`\nTesting table: ${table.name}`);
    console.log(`Query: ${table.query}`);
    
    try {
      const response = await executeQuery('P21', table.query, config.p21);
      
      if (response.success) {
        console.log(`Success: ${JSON.stringify(response.data)}`);
        
        // Extract count from response
        let count = 0;
        if (response.data && response.data.length > 0) {
          count = response.data[0].count;
        }
        
        results.p21[table.name] = {
          success: true,
          count: count,
          data: response.data
        };
      } else {
        console.log(`Error: ${response.error}`);
        
        results.p21[table.name] = {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error(`Request error: ${error.message}`);
      
      results.p21[table.name] = {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Test POR tables
 */
async function testPORTables() {
  console.log('\n=== Testing POR Tables ===');
  
  for (const table of tablesToTest.por) {
    console.log(`\nTesting table: ${table.name}`);
    console.log(`Query: ${table.query}`);
    
    try {
      const response = await executeQuery('POR', table.query, config.por);
      
      if (response.success) {
        console.log(`Success: ${JSON.stringify(response.data)}`);
        
        // Extract count from response
        let count = 0;
        if (response.data && response.data.length > 0) {
          count = response.data[0].count;
        }
        
        results.por[table.name] = {
          success: true,
          count: count,
          data: response.data
        };
      } else {
        console.log(`Error: ${response.error}`);
        
        results.por[table.name] = {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error(`Request error: ${error.message}`);
      
      results.por[table.name] = {
        success: false,
        error: error.message
      };
    }
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
  
  let p21SuccessCount = 0;
  let p21FailCount = 0;
  
  for (const [tableName, result] of Object.entries(results.p21)) {
    if (result.success) {
      console.log(`✅ ${tableName}: ${result.count} records`);
      p21SuccessCount++;
    } else {
      console.log(`❌ ${tableName}: Failed - ${result.error}`);
      p21FailCount++;
    }
  }
  
  console.log(`\nP21 Summary: ${p21SuccessCount} tables succeeded, ${p21FailCount} tables failed`);
  
  // POR Results
  console.log('\nPOR Tables:');
  console.log('-------------');
  
  let porSuccessCount = 0;
  let porFailCount = 0;
  
  for (const [tableName, result] of Object.entries(results.por)) {
    if (result.success) {
      console.log(`✅ ${tableName}: ${result.count} records`);
      porSuccessCount++;
    } else {
      console.log(`❌ ${tableName}: Failed - ${result.error}`);
      porFailCount++;
    }
  }
  
  console.log(`\nPOR Summary: ${porSuccessCount} tables succeeded, ${porFailCount} tables failed`);
  
  // Save results to file
  const reportPath = path.join(__dirname, 'api-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${reportPath}`);
  
  // Also save a text report
  const textReportPath = path.join(__dirname, 'api-test-results.txt');
  let textReport = '=== API Database Query Test Results ===\n';
  textReport += `Generated at: ${results.timestamp}\n\n`;
  
  // P21 section
  textReport += '=== P21 Tables ===\n';
  for (const [tableName, result] of Object.entries(results.p21)) {
    if (result.success) {
      textReport += `✓ ${tableName}: ${result.count} records\n`;
    } else {
      textReport += `✗ ${tableName}: Failed - ${result.error}\n`;
    }
  }
  
  // POR section
  textReport += '\n=== POR Tables ===\n';
  for (const [tableName, result] of Object.entries(results.por)) {
    if (result.success) {
      textReport += `✓ ${tableName}: ${result.count} records\n`;
    } else {
      textReport += `✗ ${tableName}: Failed - ${result.error}\n`;
    }
  }
  
  fs.writeFileSync(textReportPath, textReport);
  console.log(`Text report saved to: ${textReportPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('=== API Database Query Test ===');
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
