// Script to list tables in the P21 database
const odbc = require('odbc');

async function connectToP21() {
  try {
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    const connection = await odbc.connect(connectionString);
    console.log('Successfully connected to P21 database');
    return connection;
  } catch (error) {
    console.error('Error connecting to P21 database:', error);
    return null;
  }
}

async function listTables(connection) {
  try {
    // SQL Server query to list all tables
    const sql = `
      SELECT 
        t.TABLE_SCHEMA as schema_name,
        t.TABLE_NAME as table_name
      FROM 
        INFORMATION_SCHEMA.TABLES t
      WHERE 
        t.TABLE_TYPE = 'BASE TABLE'
      ORDER BY 
        t.TABLE_SCHEMA, t.TABLE_NAME
    `;
    
    console.log('Executing query to list tables...');
    const result = await connection.query(sql);
    
    console.log('\n=== Tables in P21 Database ===');
    console.log('Total tables found:', result.length);
    
    // Print the first 50 tables
    console.log('\nFirst 50 tables:');
    for (let i = 0; i < Math.min(50, result.length); i++) {
      console.log(`${result[i].schema_name}.${result[i].table_name}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error listing tables:', error.message);
    return null;
  }
}

async function main() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return;
  }
  
  await listTables(connection);
  
  // Close connection
  await connection.close();
}

// Run the script
main();
