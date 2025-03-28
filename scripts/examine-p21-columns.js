// Script to examine columns in P21 database tables
const odbc = require('odbc');

// List of tables to examine
const tablesToExamine = [
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
    
    console.log(`\n=== Examining columns in table: ${tableName} ===`);
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

async function main() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return;
  }
  
  // Examine columns in each table
  for (const tableName of tablesToExamine) {
    await getTableColumns(connection, tableName);
  }
  
  // Close connection
  await connection.close();
}

// Run the script
main();
