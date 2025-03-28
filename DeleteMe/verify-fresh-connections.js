/**
 * Verification script to test fresh connection implementation
 * This script tests that each SQL query is executed with a clean connection
 * 
 * Run with: node verify-fresh-connections.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  outputFile: 'fresh-connection-results.json',
  // Key metrics queries from the dashboard - using dbo schema prefix
  queries: [
    {
      name: 'Total Orders',
      server: 'P21',
      sql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())`
    },
    {
      name: 'Open Orders',
      server: 'P21',
      sql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'`
    },
    {
      name: 'Open Orders Value',
      server: 'P21',
      sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'`
    },
    {
      name: 'Daily Revenue',
      server: 'P21',
      sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`
    },
    {
      name: 'Open Invoices',
      server: 'P21',
      sql: `SELECT COUNT(*) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())`
    },
    {
      name: 'Orders Backlogged',
      server: 'P21',
      sql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())`
    },
    {
      name: 'Total Monthly Sales',
      server: 'P21',
      sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())`
    }
  ]
};

// Helper function to make HTTP requests
async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
            error: 'Failed to parse JSON response'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Function to execute a query directly using ODBC
async function executeDirectQuery(query) {
  console.log(`Executing direct ODBC query: ${query}`);
  
  try {
    // Connect using the DSN that's already configured in Windows
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('Connected successfully to ODBC data source!');
    
    // Execute the query
    console.log('Executing query...');
    const result = await connection.query(query);
    console.log('Query executed successfully. Result:', result);
    
    // Close the connection
    await connection.close();
    console.log('Connection closed.');
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('ODBC query execution failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to execute a query through the API
async function executeQuery(query) {
  const url = new URL(`${config.baseUrl}/api/executeQuery`);
  
  const options = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const data = {
    server: query.server,
    query: query.sql
  };
  
  try {
    console.log(`\nExecuting query: ${query.name}`);
    console.log(`SQL: ${query.sql}`);
    
    // First try direct ODBC connection to verify the query works
    console.log('\n--- Direct ODBC Execution ---');
    const directResult = await executeDirectQuery(query.sql);
    
    if (!directResult.success) {
      console.error(`Error executing direct query: ${directResult.error}`);
      return {
        name: query.name,
        success: false,
        error: directResult.error,
        method: 'direct'
      };
    }
    
    console.log(`Direct query result:`, directResult.data);
    
    // Then try the API to verify our fresh connection implementation
    console.log('\n--- API Execution with Fresh Connection ---');
    const response = await makeRequest(options, data);
    
    if (response.statusCode !== 200) {
      console.error(`Error executing API query: ${response.statusCode}`);
      console.error(response.data);
      return {
        name: query.name,
        success: false,
        error: response.data.error || 'Unknown error',
        statusCode: response.statusCode,
        method: 'api',
        directResult: directResult.data
      };
    }
    
    console.log(`API query executed successfully: ${query.name}`);
    console.log(`API Result:`, response.data);
    
    return {
      name: query.name,
      success: true,
      apiData: response.data,
      directData: directResult.data,
      apiValue: response.data.data && response.data.data[0] ? response.data.data[0].value : null,
      directValue: directResult.data && directResult.data[0] && 'value' in directResult.data[0] ? directResult.data[0].value : null
    };
  } catch (error) {
    console.error(`Error executing query: ${error.message}`);
    return {
      name: query.name,
      success: false,
      error: error.message
    };
  }
}

// Main function to run all queries
async function runAllQueries() {
  const results = [];
  
  console.log('Starting verification of fresh connections...');
  console.log(`Testing ${config.queries.length} queries`);
  
  // Execute each query in sequence
  for (const query of config.queries) {
    try {
      console.log(`\n--- Executing query: ${query.name} ---`);
      const result = await executeQuery(query);
      results.push(result);
      
      // Add a small delay between queries to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error executing query ${query.name}: ${error.message}`);
      results.push({
        name: query.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // Save results to file
  fs.writeFileSync(
    path.join(__dirname, config.outputFile),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\nVerification complete. Results saved to ${config.outputFile}`);
  
  // Summarize results
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log('\nSummary:');
  console.log(`Total queries: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  
  if (failureCount > 0) {
    console.log('\nFailed queries:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.name}: ${result.error}`);
    });
  }
  
  // Show values for successful queries
  if (successCount > 0) {
    console.log('\nQuery results:');
    results.filter(r => r.success).forEach(result => {
      console.log(`- ${result.name}:`);
      console.log(`  Direct: ${result.directValue !== null ? result.directValue : 'No value returned'}`);
      console.log(`  API: ${result.apiValue !== null ? result.apiValue : 'No value returned'}`);
    });
  }
}

// Run the verification
runAllQueries().catch(error => {
  console.error('Error running verification:', error);
  process.exit(1);
});
