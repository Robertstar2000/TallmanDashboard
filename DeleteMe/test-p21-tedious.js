// Script to test P21 connection using tedious and execute a SQL query for total orders
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { Connection, Request, TYPES } = require('tedious');

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to the main database to get connection details
const db = sqlite3(path.join(dataDir, 'dashboard.db'));

// Get P21 connection details from server_configs table
function getP21ConnectionDetails() {
  try {
    const config = db.prepare(`
      SELECT host, port, database, username, password
      FROM server_configs
      WHERE server_name = 'P21'
    `).get();
    
    if (!config) {
      console.error('No P21 configuration found in server_configs table');
      return null;
    }
    
    return config;
  } catch (error) {
    console.error('Error getting P21 connection details:', error.message);
    return null;
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

// Test connection to P21 and execute SQL query using tedious
async function testP21Connection() {
  return new Promise((resolve, reject) => {
    // Get P21 connection details
    const config = getP21ConnectionDetails();
    if (!config) {
      console.error('Failed to get P21 connection details');
      return resolve(false);
    }
    
    console.log('P21 Connection Details:');
    console.log(`- Server: ${config.host}:${config.port}`);
    console.log(`- Database: ${config.database}`);
    console.log(`- Username: ${config.username}`);
    
    // Get Total Orders SQL
    const sql = getTotalOrdersSQL();
    if (!sql) {
      console.error('Failed to get Total Orders SQL expression');
      return resolve(false);
    }
    
    console.log('\nTotal Orders SQL:');
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
        encrypt: true
      }
    };
    
    console.log('\nAttempting to connect to P21 database using tedious...');
    
    // Create connection
    const connection = new Connection(connectionConfig);
    
    // Connection event handlers
    connection.on('connect', (err) => {
      if (err) {
        console.error('Connection error:', err);
        return resolve(false);
      }
      
      console.log('Connected to P21 database successfully');
      
      // Execute query
      console.log('\nExecuting Total Orders SQL query...');
      
      let result = null;
      
      const request = new Request(sql, (err, rowCount, rows) => {
        if (err) {
          console.error('Error executing query:', err);
          connection.close();
          return resolve(false);
        }
        
        console.log(`Query executed. Row count: ${rowCount}`);
        
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
        resolve(true);
      });
      
      // Execute the SQL request
      connection.execSql(request);
    });
    
    connection.on('error', (err) => {
      console.error('Connection error:', err);
      resolve(false);
    });
    
    // Connect to the database
    connection.connect();
  });
}

// Main function
async function main() {
  try {
    console.log('Testing P21 connection and SQL execution using tedious...');
    
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
