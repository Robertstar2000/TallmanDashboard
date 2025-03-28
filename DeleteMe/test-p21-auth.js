const sql = require('mssql');

// Test Windows Authentication
async function testWindowsAuth() {
  console.log('\n=== TESTING WINDOWS AUTHENTICATION ===\n');
  
  try {
    // Create SQL Server connection configuration with Windows authentication
    const sqlConfig = {
      server: 'SQL01',
      database: 'P21Play',
      options: {
        trustServerCertificate: true,
        enableArithAbort: true,
        encrypt: false,
        connectTimeout: 30000,
        requestTimeout: 30000
      },
      authentication: {
        type: 'default',
        options: {
          trustedConnection: true
        }
      }
    };
    
    console.log('Windows Auth connection config:', JSON.stringify(sqlConfig, null, 2));
    
    console.log('Attempting to connect with Windows authentication...');
    const pool = new sql.ConnectionPool(sqlConfig);
    await pool.connect();
    
    console.log('Connected successfully with Windows authentication!');
    console.log('Testing a simple query...');
    
    const result = await pool.request().query('SELECT 1 AS TestValue');
    console.log('Query executed successfully. Result:', result.recordset);
    
    await pool.close();
    console.log('Connection closed.');
    
    return {
      success: true,
      message: 'Successfully connected with Windows authentication'
    };
  } catch (error) {
    console.error('Windows authentication test failed with error:', error.message);
    
    return {
      success: false,
      message: `Failed to connect with Windows authentication: ${error.message}`
    };
  }
}

// Test SQL Server Authentication
async function testSqlAuth(username, password) {
  console.log('\n=== TESTING SQL SERVER AUTHENTICATION ===\n');
  
  try {
    // Create SQL Server connection configuration with SQL Server authentication
    const sqlConfig = {
      server: 'SQL01',
      database: 'P21Play',
      user: username,
      password: password,
      options: {
        trustServerCertificate: true,
        enableArithAbort: true,
        encrypt: false,
        connectTimeout: 30000,
        requestTimeout: 30000
      }
    };
    
    console.log('SQL Auth connection config:', {
      ...sqlConfig,
      password: '***' // Hide password in logs
    });
    
    console.log('Attempting to connect with SQL Server authentication...');
    const pool = new sql.ConnectionPool(sqlConfig);
    await pool.connect();
    
    console.log('Connected successfully with SQL Server authentication!');
    console.log('Testing a simple query...');
    
    const result = await pool.request().query('SELECT 1 AS TestValue');
    console.log('Query executed successfully. Result:', result.recordset);
    
    await pool.close();
    console.log('Connection closed.');
    
    return {
      success: true,
      message: 'Successfully connected with SQL Server authentication'
    };
  } catch (error) {
    console.error('SQL Server authentication test failed with error:', error.message);
    
    return {
      success: false,
      message: `Failed to connect with SQL Server authentication: ${error.message}`
    };
  }
}

// Run both tests
async function runTests() {
  // First try Windows authentication
  const windowsAuthResult = await testWindowsAuth();
  console.log('\nWindows Authentication Test Result:', windowsAuthResult);
  
  // If Windows auth fails, prompt for SQL Server credentials
  if (!windowsAuthResult.success) {
    console.log('\nWindows authentication failed. Please provide SQL Server credentials:');
    
    // For this example, we'll use hardcoded credentials
    // In a real application, you would prompt the user for these
    const username = process.env.SQL_USERNAME || 'your_username';
    const password = process.env.SQL_PASSWORD || 'your_password';
    
    console.log(`Using username: ${username}`);
    
    const sqlAuthResult = await testSqlAuth(username, password);
    console.log('\nSQL Server Authentication Test Result:', sqlAuthResult);
    
    return sqlAuthResult.success;
  }
  
  return windowsAuthResult.success;
}

// Run the tests
runTests()
  .then(success => {
    console.log('\nFinal result:', success ? 'At least one authentication method succeeded' : 'All authentication methods failed');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
