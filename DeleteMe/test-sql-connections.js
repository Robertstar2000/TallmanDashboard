// Comprehensive script to test SQL Server connections using different methods
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { Connection, Request } = require('tedious');

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to the main database to get connection details
const db = sqlite3(path.join(dataDir, 'dashboard.db'));

// Get server connection details from server_configs table
function getServerConnectionDetails(serverName) {
  try {
    const config = db.prepare(`
      SELECT host, port, database, username, password
      FROM server_configs
      WHERE server_name = ?
    `).get(serverName);
    
    if (!config) {
      console.error(`No ${serverName} configuration found in server_configs table`);
      return null;
    }
    
    return config;
  } catch (error) {
    console.error(`Error getting ${serverName} connection details:`, error.message);
    return null;
  }
}

// Get the SQL expression for a specific chart and variable
function getSqlExpression(chartName, variableName) {
  try {
    const row = db.prepare(`
      SELECT id, production_sql_expression
      FROM chart_data
      WHERE chart_name = ? AND variable_name = ?
    `).get(chartName, variableName);
    
    if (!row || !row.production_sql_expression) {
      console.error(`No SQL expression found for ${chartName} - ${variableName}`);
      return { id: null, sql: null };
    }
    
    return { id: row.id, sql: row.production_sql_expression };
  } catch (error) {
    console.error(`Error getting SQL for ${chartName} - ${variableName}:`, error.message);
    return { id: null, sql: null };
  }
}

// Test connection using tedious
async function testTediousConnection(serverName) {
  return new Promise((resolve) => {
    // Get connection details
    const config = getServerConnectionDetails(serverName);
    if (!config) {
      console.error(`Failed to get ${serverName} connection details`);
      return resolve({ success: false, error: 'No connection details found' });
    }
    
    console.log(`\n${serverName} Connection Details:`);
    console.log(`- Server: ${config.host}:${config.port}`);
    console.log(`- Database: ${config.database}`);
    console.log(`- Username: ${config.username}`);
    
    // Get SQL expression
    const { id, sql } = getSqlExpression('Key Metrics', 'Total Orders');
    if (!sql) {
      console.error('Failed to get SQL expression');
      return resolve({ success: false, error: 'No SQL expression found' });
    }
    
    console.log('\nSQL Expression:');
    console.log(sql);
    
    // Configure tedious connection
    const connectionConfig = {
      server: config.host,
      authentication: {
        type: 'default',
        options: {
          userName: config.username,
          password: config.password
        }
      },
      options: {
        port: parseInt(config.port, 10),
        database: config.database,
        trustServerCertificate: true,
        rowCollectionOnRequestCompletion: true,
        useColumnNames: true,
        encrypt: true,
        connectTimeout: 15000, // 15 seconds
        requestTimeout: 15000, // 15 seconds
        debug: {
          packet: true,
          data: true,
          payload: true,
          token: true,
          log: true
        }
      }
    };
    
    console.log(`\nAttempting to connect to ${serverName} database using tedious...`);
    
    // Create connection
    const connection = new Connection(connectionConfig);
    
    // Connection event handlers
    connection.on('connect', (err) => {
      if (err) {
        console.error('Connection error:', err);
        return resolve({ 
          success: false, 
          error: `Connection error: ${err.message}`,
          details: err
        });
      }
      
      console.log(`Connected to ${serverName} database successfully`);
      
      // Execute query
      console.log('\nExecuting SQL query...');
      
      const request = new Request(sql, (err, rowCount, rows) => {
        if (err) {
          console.error('Error executing query:', err);
          connection.close();
          return resolve({ 
            success: false, 
            error: `Query error: ${err.message}`,
            details: err
          });
        }
        
        console.log(`Query executed. Row count: ${rowCount}`);
        
        let result = null;
        
        if (rows && rows.length > 0) {
          // Get the first column of the first row
          const firstRow = rows[0];
          const firstColumn = Object.keys(firstRow)[0];
          result = firstRow[firstColumn].value;
          
          console.log('\nQuery Result:');
          console.log(`- Value: ${result}`);
          
          if (result === null || result === undefined || result === 0) {
            console.log('WARNING: Query returned zero/null value');
          } else {
            console.log('SUCCESS: Query returned non-zero value');
          }
        } else {
          console.log('\nQuery returned no results');
        }
        
        // Close connection
        connection.close();
        resolve({ 
          success: true, 
          result: result,
          rowCount: rowCount
        });
      });
      
      // Execute the SQL request
      connection.execSql(request);
    });
    
    connection.on('error', (err) => {
      console.error('Connection error event:', err);
      resolve({ 
        success: false, 
        error: `Connection error event: ${err.message}`,
        details: err
      });
    });
    
    connection.on('debug', (message) => {
      console.log('Debug:', message);
    });
    
    // Set a timeout in case the connection hangs
    const timeout = setTimeout(() => {
      console.error('Connection timeout after 30 seconds');
      try {
        connection.close();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
      resolve({ 
        success: false, 
        error: 'Connection timeout after 30 seconds'
      });
    }, 30000);
    
    // Connect to the database
    try {
      connection.connect();
    } catch (err) {
      clearTimeout(timeout);
      console.error('Error initiating connection:', err);
      resolve({ 
        success: false, 
        error: `Error initiating connection: ${err.message}`,
        details: err
      });
    }
  });
}

// Test direct connection using a simple TCP socket
function testTcpConnection(host, port) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    console.log(`\nTesting TCP connection to ${host}:${port}...`);
    
    // Set a timeout
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      console.log(`TCP connection to ${host}:${port} successful`);
      socket.end();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      console.error(`TCP connection to ${host}:${port} timed out`);
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (err) => {
      console.error(`TCP connection to ${host}:${port} failed:`, err.message);
      resolve(false);
    });
    
    // Attempt to connect
    socket.connect(port, host);
  });
}

// Test connection using a simple SQL query
async function testSimpleSqlQuery(serverName) {
  // Get connection details
  const config = getServerConnectionDetails(serverName);
  if (!config) {
    console.error(`Failed to get ${serverName} connection details`);
    return false;
  }
  
  // Test TCP connection first
  const tcpConnected = await testTcpConnection(config.host, config.port);
  if (!tcpConnected) {
    console.error(`TCP connection to ${config.host}:${config.port} failed`);
    return false;
  }
  
  // Test tedious connection
  const result = await testTediousConnection(serverName);
  return result.success;
}

// Check if test data exists
function checkTestData(chartName, variableName) {
  const { id } = getSqlExpression(chartName, variableName);
  if (!id) {
    console.error(`No row found for ${chartName} - ${variableName}`);
    return false;
  }
  
  try {
    const testValue = db.prepare(`
      SELECT test_value
      FROM test_data_mapping
      WHERE id = ?
    `).get(id);
    
    if (testValue) {
      console.log('\nTest data found:');
      console.log(`- Row ID: ${id}`);
      console.log(`- Test Value: ${testValue.test_value}`);
      return true;
    } else {
      console.log(`\nNo test data found for ${chartName} - ${variableName} (ID: ${id})`);
      return false;
    }
  } catch (error) {
    console.error('Error checking test data:', error.message);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Testing SQL Server connections...');
    
    // Check if we have server configs
    const servers = db.prepare(`
      SELECT server_name
      FROM server_configs
    `).all();
    
    console.log(`\nFound ${servers.length} server configurations:`);
    for (const server of servers) {
      console.log(`- ${server.server_name}`);
    }
    
    // Check test data
    console.log('\nChecking test data for Total Orders:');
    const hasTestData = checkTestData('Key Metrics', 'Total Orders');
    
    // Test P21 connection
    console.log('\n=== Testing P21 Connection ===');
    const p21Connected = await testSimpleSqlQuery('P21');
    
    // Test POR connection if available
    let porConnected = false;
    if (servers.some(s => s.server_name === 'POR')) {
      console.log('\n=== Testing POR Connection ===');
      porConnected = await testSimpleSqlQuery('POR');
    }
    
    // Summary
    console.log('\n=== Connection Test Summary ===');
    console.log(`- P21 Connection: ${p21Connected ? 'SUCCESS' : 'FAILED'}`);
    if (servers.some(s => s.server_name === 'POR')) {
      console.log(`- POR Connection: ${porConnected ? 'SUCCESS' : 'FAILED'}`);
    }
    console.log(`- Test Data Available: ${hasTestData ? 'YES' : 'NO'}`);
    
    console.log('\nTest complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the main function
main();
