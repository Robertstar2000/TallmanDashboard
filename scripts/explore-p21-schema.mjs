// Script to explore the P21 database schema and find the correct table names
import odbc from 'odbc';

async function exploreP21Schema() {
  let connection;
  try {
    console.log('Connecting to P21 database...');
    connection = await odbc.connect('DSN=P21Play;Trusted_Connection=Yes;');
    console.log('Connection established successfully');
    
    // Get database name
    const dbResult = await connection.query('SELECT DB_NAME() as database_name');
    console.log(`\nCurrent database: ${dbResult[0].database_name}`);
    
    // List all schemas
    console.log('\nListing schemas:');
    const schemaResult = await connection.query('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA ORDER BY SCHEMA_NAME');
    schemaResult.forEach(row => {
      console.log(`- ${row.SCHEMA_NAME}`);
    });
    
    // List tables that might be related to orders
    console.log('\nLooking for order-related tables:');
    const orderTablesResult = await connection.query("SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%order%' ORDER BY TABLE_SCHEMA, TABLE_NAME");
    orderTablesResult.forEach(row => {
      console.log(`- ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    });
    
    // List tables that might be related to inventory
    console.log('\nLooking for inventory-related tables:');
    const invTablesResult = await connection.query("SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%inv%' ORDER BY TABLE_SCHEMA, TABLE_NAME");
    invTablesResult.forEach(row => {
      console.log(`- ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    });
    
    // List tables that might be related to customers
    console.log('\nLooking for customer-related tables:');
    const custTablesResult = await connection.query("SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%cust%' ORDER BY TABLE_SCHEMA, TABLE_NAME");
    custTablesResult.forEach(row => {
      console.log(`- ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    });
    
    // List tables that might be related to products
    console.log('\nLooking for product-related tables:');
    const prodTablesResult = await connection.query("SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%prod%' ORDER BY TABLE_SCHEMA, TABLE_NAME");
    prodTablesResult.forEach(row => {
      console.log(`- ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    });
    
    // List the most commonly used tables (based on row count)
    console.log('\nMost commonly used tables (top 20 by row count):');
    const topTablesQuery = `
      SELECT 
        SCHEMA_NAME(schema_id) as schema_name,
        t.name as table_name,
        p.rows as row_count
      FROM 
        sys.tables t
      INNER JOIN 
        sys.partitions p ON t.object_id = p.object_id
      WHERE 
        p.index_id IN (0, 1)
      ORDER BY 
        p.rows DESC
      OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
    `;
    const topTablesResult = await connection.query(topTablesQuery);
    topTablesResult.forEach(row => {
      console.log(`- ${row.schema_name}.${row.table_name} (${row.row_count} rows)`);
    });
    
    // Test some queries with the discovered tables
    console.log('\nTesting queries with discovered tables:');
    
    // Find the first order table with data
    for (const row of orderTablesResult) {
      const tableName = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
      console.log(`\nTesting query on ${tableName}:`);
      try {
        const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = countResult[0].count;
        console.log(`- COUNT(*): ${count}`);
        
        if (count > 0) {
          // Try to find some common columns
          try {
            const columnsResult = await connection.query(`
              SELECT COLUMN_NAME 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = '${row.TABLE_SCHEMA}' 
              AND TABLE_NAME = '${row.TABLE_NAME}'
              AND (COLUMN_NAME LIKE '%amount%' OR COLUMN_NAME LIKE '%amt%' OR COLUMN_NAME LIKE '%total%' OR COLUMN_NAME LIKE '%price%')
            `);
            
            if (columnsResult.length > 0) {
              console.log(`- Found potential amount columns:`);
              columnsResult.forEach(colRow => {
                console.log(`  * ${colRow.COLUMN_NAME}`);
              });
              
              // Test a query with the first amount column
              const amountColumn = columnsResult[0].COLUMN_NAME;
              const avgResult = await connection.query(`SELECT AVG(${amountColumn}) as avg_amount FROM ${tableName}`);
              console.log(`- AVG(${amountColumn}): ${avgResult[0].avg_amount}`);
            }
          } catch (columnError) {
            console.log(`- Error getting columns: ${columnError.message}`);
          }
        }
      } catch (queryError) {
        console.log(`- Error executing query: ${queryError.message}`);
      }
    }
    
    console.log('\nExploration completed successfully');
  } catch (error) {
    console.error('Error exploring P21 schema:', error);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}

// Run the exploration
exploreP21Schema().catch(error => {
  console.error('Unhandled error during schema exploration:', error);
  process.exit(1);
});
