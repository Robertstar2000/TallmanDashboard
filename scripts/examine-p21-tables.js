// Script to examine specific tables in the P21 database
const odbc = require('odbc');

// List of tables to examine
const tablesToExamine = [
  'dbo.oe_hdr',
  'dbo.oe_line',
  'dbo.invoice_hdr',
  'dbo.invoice_line',
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

async function getTableColumns(connection, tableName) {
  try {
    // Extract schema and table name
    const parts = tableName.split('.');
    const schema = parts.length > 1 ? parts[0] : 'dbo';
    const table = parts.length > 1 ? parts[1] : parts[0];
    
    // SQL Server query to list columns for a specific table
    const sql = `
      SELECT 
        c.COLUMN_NAME as column_name,
        c.DATA_TYPE as data_type,
        c.CHARACTER_MAXIMUM_LENGTH as max_length,
        c.IS_NULLABLE as is_nullable
      FROM 
        INFORMATION_SCHEMA.COLUMNS c
      WHERE 
        c.TABLE_SCHEMA = '${schema}' AND
        c.TABLE_NAME = '${table}'
      ORDER BY 
        c.ORDINAL_POSITION
    `;
    
    console.log(`\n=== Examining table: ${tableName} ===`);
    const result = await connection.query(sql);
    
    if (result.length === 0) {
      console.log(`Table ${tableName} not found or has no columns.`);
      return null;
    }
    
    console.log(`Found ${result.length} columns:`);
    result.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}${col.max_length ? `(${col.max_length})` : ''}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    return result;
  } catch (error) {
    console.error(`Error examining table ${tableName}:`, error.message);
    return null;
  }
}

async function testSimpleQuery(connection, tableName) {
  try {
    // Simple COUNT query to test if table has data
    const sql = `SELECT COUNT(*) as count FROM ${tableName} WITH (NOLOCK)`;
    
    console.log(`\nTesting simple COUNT query on ${tableName}...`);
    const result = await connection.query(sql);
    
    if (result && result.length > 0) {
      console.log(`Table ${tableName} has ${result[0].count} rows.`);
      
      // If table has rows, get a sample
      if (result[0].count > 0) {
        const sampleSql = `SELECT TOP 1 * FROM ${tableName} WITH (NOLOCK)`;
        const sample = await connection.query(sampleSql);
        console.log('Sample row:');
        console.log(sample[0]);
      }
    } else {
      console.log(`Failed to get row count for ${tableName}.`);
    }
  } catch (error) {
    console.error(`Error testing simple query on ${tableName}:`, error.message);
  }
}

async function main() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return;
  }
  
  // Examine each table
  for (const tableName of tablesToExamine) {
    const columns = await getTableColumns(connection, tableName);
    if (columns) {
      await testSimpleQuery(connection, tableName);
    }
  }
  
  // Close connection
  await connection.close();
}

// Run the script
main();
