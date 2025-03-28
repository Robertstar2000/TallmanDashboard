// Simple script to test database connections
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Base URL for API calls
const BASE_URL = 'http://localhost:3000';

// Main function
async function main() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  function addResult(name, success, details) {
    results.tests.push({
      name,
      success,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Check if the server is running
  console.log('Checking if server is running...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      addResult('Server Health Check', false, {
        status: response.status,
        statusText: response.statusText
      });
      console.log('❌ Server is not running. Please start the server with "npm run dev" and try again.');
    } else {
      addResult('Server Health Check', true, {
        status: response.status,
        statusText: response.statusText
      });
      console.log('✅ Server is running.');
    }
  } catch (error) {
    addResult('Server Health Check', false, {
      error: error.message,
      stack: error.stack
    });
    console.log(`❌ Error checking server status: ${error.message}`);
  }

  // Test P21 connection using the direct API endpoint
  console.log('Testing P21 database connection using direct API endpoint...');
  try {
    const p21Response = await fetch(`${BASE_URL}/api/test-p21-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'SELECT 1 AS value'
      })
    });
    
    const responseDetails = {
      status: p21Response.status,
      statusText: p21Response.statusText
    };
    
    if (!p21Response.ok) {
      addResult('P21 Direct API Test', false, responseDetails);
      console.log('❌ P21 connection test failed: Server responded with status ' + p21Response.status);
    } else {
      const p21Result = await p21Response.json();
      responseDetails.result = p21Result;
      
      if (!p21Result.success) {
        addResult('P21 Direct API Test', false, responseDetails);
        console.log(`❌ P21 connection test failed: ${p21Result.message || 'Unknown error'}`);
      } else {
        addResult('P21 Direct API Test', true, responseDetails);
        console.log('✅ P21 connection successful using direct API endpoint.');
      }
    }
  } catch (error) {
    addResult('P21 Direct API Test', false, {
      error: error.message,
      stack: error.stack
    });
    console.log(`❌ Error testing P21 connection using direct API endpoint: ${error.message}`);
  }

  // Test POR connection using the direct API endpoint
  console.log('Testing POR database connection using direct API endpoint...');
  try {
    const porResponse = await fetch(`${BASE_URL}/api/por-mdb-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'SELECT 1 AS value',
        filePath: process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB'
      })
    });
    
    const responseDetails = {
      status: porResponse.status,
      statusText: porResponse.statusText
    };
    
    if (!porResponse.ok) {
      addResult('POR Direct API Test', false, responseDetails);
      console.log('❌ POR connection test failed: Server responded with status ' + porResponse.status);
    } else {
      const porResult = await porResponse.json();
      responseDetails.result = porResult;
      
      if (!porResult.success) {
        addResult('POR Direct API Test', false, responseDetails);
        console.log(`❌ POR connection test failed: ${porResult.message || 'Unknown error'}`);
      } else {
        addResult('POR Direct API Test', true, responseDetails);
        console.log('✅ POR connection successful using direct API endpoint.');
      }
    }
  } catch (error) {
    addResult('POR Direct API Test', false, {
      error: error.message,
      stack: error.stack
    });
    console.log(`❌ Error testing POR connection using direct API endpoint: ${error.message}`);
  }

  // Test P21 connection using the testConnection API endpoint
  console.log('Testing P21 database connection using testConnection API endpoint...');
  try {
    const p21Config = {
      dsn: 'P21Play',
      database: 'P21Play',
      trustedConnection: true
    };
    
    const p21TestResponse = await fetch(`${BASE_URL}/api/testConnection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        server: 'P21',
        config: p21Config
      })
    });
    
    const responseDetails = {
      status: p21TestResponse.status,
      statusText: p21TestResponse.statusText,
      config: p21Config
    };
    
    if (!p21TestResponse.ok) {
      addResult('P21 testConnection API Test', false, responseDetails);
      console.log('❌ P21 connection test failed: Server responded with status ' + p21TestResponse.status);
      try {
        const errorText = await p21TestResponse.text();
        responseDetails.errorText = errorText;
        console.log(`Response text: ${errorText}`);
      } catch (textError) {
        console.log(`Error getting response text: ${textError.message}`);
      }
    } else {
      const p21TestResult = await p21TestResponse.json();
      responseDetails.result = p21TestResult;
      
      if (!p21TestResult.success) {
        addResult('P21 testConnection API Test', false, responseDetails);
        console.log(`❌ P21 connection test failed: ${p21TestResult.message || 'Unknown error'}`);
      } else {
        addResult('P21 testConnection API Test', true, responseDetails);
        console.log('✅ P21 connection successful using testConnection API endpoint.');
      }
    }
  } catch (error) {
    addResult('P21 testConnection API Test', false, {
      error: error.message,
      stack: error.stack
    });
    console.log(`❌ Error testing P21 connection using testConnection API endpoint: ${error.message}`);
  }

  // Test POR connection using the testConnection API endpoint
  console.log('Testing POR database connection using testConnection API endpoint...');
  try {
    const porConfig = {
      filePath: process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB'
    };
    
    const porTestResponse = await fetch(`${BASE_URL}/api/testConnection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        server: 'POR',
        config: porConfig
      })
    });
    
    const responseDetails = {
      status: porTestResponse.status,
      statusText: porTestResponse.statusText,
      config: porConfig
    };
    
    if (!porTestResponse.ok) {
      addResult('POR testConnection API Test', false, responseDetails);
      console.log('❌ POR connection test failed: Server responded with status ' + porTestResponse.status);
      try {
        const errorText = await porTestResponse.text();
        responseDetails.errorText = errorText;
        console.log(`Response text: ${errorText}`);
      } catch (textError) {
        console.log(`Error getting response text: ${textError.message}`);
      }
    } else {
      const porTestResult = await porTestResponse.json();
      responseDetails.result = porTestResult;
      
      if (!porTestResult.success) {
        addResult('POR testConnection API Test', false, responseDetails);
        console.log(`❌ POR connection test failed: ${porTestResult.message || 'Unknown error'}`);
      } else {
        addResult('POR testConnection API Test', true, responseDetails);
        console.log('✅ POR connection successful using testConnection API endpoint.');
      }
    }
  } catch (error) {
    addResult('POR testConnection API Test', false, {
      error: error.message,
      stack: error.stack
    });
    console.log(`❌ Error testing POR connection using testConnection API endpoint: ${error.message}`);
  }

  // Write results to file
  const resultsFile = path.join(__dirname, 'db-connection-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nTest results written to: ${resultsFile}`);
  
  // Summary
  const successCount = results.tests.filter(t => t.success).length;
  const failureCount = results.tests.filter(t => !t.success).length;
  console.log(`\nSummary: ${successCount} tests passed, ${failureCount} tests failed.`);
  
  // Print instructions
  if (failureCount > 0) {
    console.log('\nSome database connection tests failed. Please:');
    console.log('1. Open http://localhost:3000/admin in your browser');
    console.log('2. Go to the Query Test page');
    console.log('3. Configure the database connections and test them');
    console.log('4. Run this script again to verify the connections are working');
  } else {
    console.log('\nAll database connection tests passed!');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:', error);
  // Write error to file
  const errorFile = path.join(__dirname, 'db-connection-test-error.json');
  fs.writeFileSync(errorFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack
    }
  }, null, 2));
  console.error(`Error details written to: ${errorFile}`);
});
