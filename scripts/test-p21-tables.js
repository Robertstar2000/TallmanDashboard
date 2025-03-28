// Script to test simple queries on P21 database tables
const odbc = require('odbc');

// List of tables to test
const tablesToTest = [
  'dbo.oe_hdr',
  'dbo.invoice_hdr',
  'dbo.customer',
  'dbo.inv_mast'
];

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

async function testTable(connection, tableName) {
  try {
    // Simple COUNT query to test if table has data
    const sql = `SELECT COUNT(*) as count FROM ${tableName} WITH (NOLOCK)`;
    
    console.log(`\n=== Testing table: ${tableName} ===`);
    console.log(`Executing: ${sql}`);
    
    const result = await connection.query(sql);
    
    if (result && result.length > 0) {
      console.log(`Table ${tableName} has ${result[0].count} rows.`);
      return result[0].count;
    } else {
      console.log(`Failed to get row count for ${tableName}.`);
      return 0;
    }
  } catch (error) {
    console.error(`Error testing table ${tableName}:`, error.message);
    return -1;
  }
}

async function main() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return;
  }
  
  const results = [];
  
  // Test each table
  for (const tableName of tablesToTest) {
    const count = await testTable(connection, tableName);
    results.push({ table: tableName, count });
  }
  
  // Print summary
  console.log('\n=== Summary ===');
  results.forEach(r => {
    console.log(`${r.table}: ${r.count === -1 ? 'ERROR' : r.count} rows`);
  });
  
  // Close connection
  await connection.close();
}

// Run the script
main();
