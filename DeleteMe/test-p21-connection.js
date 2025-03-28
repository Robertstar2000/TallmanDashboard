// Script to test P21 connection and execute a SQL query for total orders
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to the main database to get connection details
const db = sqlite3(path.join(dataDir, 'dashboard.db'));

// Hardcoded P21 connection details based on provided information
const P21_CONNECTION = {
  host: 'SQL01',
  port: 1433,
  database: 'P21play',
  username: 'SA',
  password: '' // Password should be entered at runtime or stored securely
};

// Get P21 connection details from server_configs table or use hardcoded values
function getP21ConnectionDetails() {
  try {
    // First try to get from database
    const config = db.prepare(`
      SELECT host, port, database, username, password
      FROM server_configs
      WHERE server_name = 'P21'
    `).get();
    
    if (config) {
      console.log('Using P21 configuration from server_configs table');
      return config;
    } else {
      console.log('No P21 configuration found in server_configs table, using hardcoded values');
      return P21_CONNECTION;
    }
  } catch (error) {
    console.error('Error getting P21 connection details:', error.message);
    console.log('Using hardcoded P21 connection details');
    return P21_CONNECTION;
  }
}

// Get the SQL expression for total orders from chart_data
function getTotalOrdersSQL() {
  try {
    const row = db.prepare(`
      SELECT production_sql_expression
      FROM chart_data
      WHERE chart_name = 'Key Metrics' AND variable_name = 'Total Orders'
    `).get();
    
    if (!row || !row.production_sql_expression) {
      console.error('No SQL expression found for Total Orders');
      return null;
    }
    
    return row.production_sql_expression;
  } catch (error) {
    console.error('Error getting Total Orders SQL:', error.message);
    return null;
  }
}

// Test connection to P21 and execute SQL query
async function testP21Connection() {
  // Get P21 connection details
  const config = getP21ConnectionDetails();
  if (!config) {
    console.error('Failed to get P21 connection details');
    return;
  }
  
  console.log('P21 Connection Details:');
  console.log(`- Server: ${config.host}:${config.port}`);
  console.log(`- Database: ${config.database}`);
  console.log(`- Username: ${config.username}`);
  
  // Get Total Orders SQL
  const sql = getTotalOrdersSQL();
  if (!sql) {
    console.error('Failed to get Total Orders SQL expression');
    return;
  }
  
  console.log('\nTotal Orders SQL:');
  console.log(sql);
  
  try {
    // Try to connect to P21 using mssql (since we're testing the real connection)
    console.log('\nAttempting to connect to P21 database...');
    
    // Check if mssql module is available
    try {
      const mssql = require('mssql');
      
      // Configure connection
      const sqlConfig = {
        user: config.username,
        password: config.password,
        database: config.database,
        server: config.host,
        port: config.port,
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true
        }
      };
      
      try {
        // Connect to database
        await mssql.connect(sqlConfig);
        console.log('Connected to P21 database successfully');
        
        // Execute query
        console.log('\nExecuting Total Orders SQL query...');
        const result = await mssql.query(sql);
        
        if (result.recordset && result.recordset.length > 0) {
          const firstRow = result.recordset[0];
          const value = firstRow ? Object.values(firstRow)[0] : null;
          
          console.log('\nQuery Result:');
          console.log(`- Value: ${value}`);
          
          if (value === null || value === undefined || value === 0) {
            console.log('WARNING: Query returned zero/null value');
          } else {
            console.log('SUCCESS: Query returned non-zero value');
          }
        } else {
          console.log('\nQuery returned no results');
        }
        
        // Close connection
        await mssql.close();
        console.log('\nConnection closed');
      } catch (queryError) {
        console.error('Error executing query:', queryError);
      }
    } catch (moduleError) {
      console.error('mssql module not available. Please install it with: npm install mssql');
      console.log('Trying alternative approach with better-sqlite3...');
      
      // Since we can't connect to the real P21 database without mssql,
      // let's check if we have any test data for this query
      const chartDataRow = db.prepare(`
        SELECT id
        FROM chart_data
        WHERE chart_name = 'Key Metrics' AND variable_name = 'Total Orders'
      `).get();
      
      if (chartDataRow) {
        const testValue = db.prepare(`
          SELECT test_value
          FROM test_data_mapping
          WHERE id = ?
        `).get(chartDataRow.id);
        
        if (testValue) {
          console.log('\nTest data found:');
          console.log(`- Row ID: ${chartDataRow.id}`);
          console.log(`- Test Value: ${testValue.test_value}`);
        } else {
          console.log('\nNo test data found for Total Orders');
        }
      }
    }
  } catch (error) {
    console.error('Error testing P21 connection:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('Testing P21 connection and SQL execution...');
    
    await testP21Connection();
    
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
