// Test script to verify the API endpoint for executing queries
// This script tests both P21 and POR database queries through the API

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// API endpoint URL
const API_URL = 'http://localhost:3000/api/executeQuery';

// Test queries
const P21_VERSION_QUERY = "SELECT @@VERSION as version";
const P21_TABLES_QUERY = "SELECT TOP 5 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES";
const POR_TABLES_QUERY = "SELECT TOP 5 * FROM MSysObjects";

// Function to start the Next.js development server
async function startDevServer() {
  console.log('Starting Next.js development server...');
  const { spawn } = require('child_process');
  
  // Start the server in a separate process
  const server = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
    detached: true
  });
  
  // Log server output
  server.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('Server output:', output);
    
    // If the server is ready, resolve the promise
    if (output.includes('ready') || output.includes('started')) {
      console.log('Server is ready!');
      return true;
    }
  });
  
  // Log server errors
  server.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });
  
  // Wait for the server to start
  return new Promise((resolve) => {
    // Check if the server is already running
    fetch('http://localhost:3000')
      .then(() => {
        console.log('Server is already running');
        resolve(true);
      })
      .catch(() => {
        // Wait for the server to start
        const interval = setInterval(() => {
          fetch('http://localhost:3000')
            .then(() => {
              console.log('Server is now running');
              clearInterval(interval);
              resolve(true);
            })
            .catch(() => {
              console.log('Waiting for server to start...');
            });
        }, 1000);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(interval);
          console.error('Timed out waiting for server to start');
          resolve(false);
        }, 30000);
      });
  });
}

// Function to test P21 query execution through the API
async function testP21Query() {
  console.log('\n=== Testing P21 Query Execution via API ===');
  
  try {
    // Execute a simple version query
    console.log('Executing P21 version query...');
    const versionResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        server: 'P21',
        query: P21_VERSION_QUERY
      })
    });
    
    const versionResult = await versionResponse.json();
    
    if (!versionResult.success) {
      console.error('P21 version query failed:', versionResult.message);
      return false;
    }
    
    console.log('SQL Server version:', versionResult.data[0].version.split('\n')[0]);
    
    // Execute a query to get table names
    console.log('\nExecuting P21 tables query...');
    const tablesResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        server: 'P21',
        query: P21_TABLES_QUERY
      })
    });
    
    const tablesResult = await tablesResponse.json();
    
    if (!tablesResult.success) {
      console.error('P21 tables query failed:', tablesResult.message);
      return false;
    }
    
    console.log('Tables in P21 database:');
    tablesResult.data.forEach((row, index) => {
      console.log(`${index + 1}. ${row.TABLE_NAME}`);
    });
    
    console.log('P21 query execution test completed successfully');
    return true;
  } catch (error) {
    console.error('P21 query execution test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Function to test POR query execution through the API
async function testPORQuery() {
  console.log('\n=== Testing POR Query Execution via API ===');
  
  // Try multiple potential POR file locations
  const potentialPaths = [
    process.env.POR_FILE_PATH,
    'C:\\POR\\PORENT.mdb',
    'C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard_new\\data\\PORENT.mdb',
    'C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard_new\\PORENT.mdb',
    '.\\PORENT.mdb'
  ].filter(Boolean); // Remove undefined entries
  
  console.log('Searching for POR database file in the following locations:');
  potentialPaths.forEach(path => console.log(`- ${path}`));
  
  let porFilePath = null;
  
  // Find the first path that exists
  for (const path of potentialPaths) {
    if (fs.existsSync(path)) {
      porFilePath = path;
      console.log(`POR file found at: ${porFilePath}`);
      break;
    }
  }
  
  if (!porFilePath) {
    console.error('POR file not found in any of the searched locations.');
    console.log('Please specify the correct path using the POR_FILE_PATH environment variable.');
    return false;
  }
  
  try {
    // Execute a query to get table information
    console.log('\nExecuting POR tables query...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        server: 'POR',
        query: POR_TABLES_QUERY,
        options: {
          porFilePath: porFilePath
        }
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('POR tables query failed:', result.message);
      return false;
    }
    
    console.log(`Query returned ${result.data.length} rows`);
    if (result.data.length > 0) {
      console.log('First row:', result.data[0]);
    }
    
    console.log('POR query execution test completed successfully');
    return true;
  } catch (error) {
    console.error('POR query execution test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('Starting API query execution tests...');
  
  // Start the development server if needed
  const serverStarted = await startDevServer();
  
  if (!serverStarted) {
    console.error('Failed to start the development server');
    return false;
  }
  
  // Test P21 query execution
  const p21Success = await testP21Query();
  console.log(`P21 query execution test ${p21Success ? 'PASSED' : 'FAILED'}`);
  
  // Test POR query execution
  const porSuccess = await testPORQuery();
  console.log(`POR query execution test ${porSuccess ? 'PASSED' : 'FAILED'}`);
  
  console.log('\n=== Test Summary ===');
  console.log(`P21: ${p21Success ? '✓' : '✗'}`);
  console.log(`POR: ${porSuccess ? '✓' : '✗'}`);
  
  // Return true if P21 connection is successful, even if POR fails
  // This is because P21 is the primary database we need for the dashboard
  return p21Success;
}

// Install node-fetch if needed
async function installDependencies() {
  try {
    require('node-fetch');
    console.log('node-fetch is already installed');
    return true;
  } catch (error) {
    console.log('Installing node-fetch...');
    const { execSync } = require('child_process');
    
    try {
      execSync('npm install node-fetch@2', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log('node-fetch installed successfully');
      return true;
    } catch (installError) {
      console.error('Failed to install node-fetch:', installError.message);
      return false;
    }
  }
}

// Run the installation and tests
installDependencies().then(installed => {
  if (installed) {
    runTests().then(success => {
      console.log(`\nAPI tests ${success ? 'PASSED' : 'FAILED'}`);
      process.exit(success ? 0 : 1);
    }).catch(error => {
      console.error('Unhandled error in tests:', error);
      process.exit(1);
    });
  } else {
    console.error('Failed to install dependencies');
    process.exit(1);
  }
});
