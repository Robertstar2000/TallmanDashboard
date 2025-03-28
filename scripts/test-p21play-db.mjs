// Script to explore only the P21Play database and test queries
import odbc from 'odbc';

async function exploreP21PlayDatabase() {
  let connection;
  try {
    console.log('Connecting to P21Play database...');
    connection = await odbc.connect('DSN=P21Play;Trusted_Connection=Yes;');
    console.log('Connection established successfully');
    
    // Get current database name
    const dbResult = await connection.query('SELECT DB_NAME() as database_name');
    console.log(`\nCurrent database: ${dbResult[0].database_name}`);
    
    // Switch to P21Play database
    console.log('\nSwitching to P21Play database...');
    await connection.query('USE P21Play');
    
    // Verify current database
    const currentDbResult = await connection.query('SELECT DB_NAME() as database_name');
    console.log(`Current database after switch: ${currentDbResult[0].database_name}`);
    
    // List schemas in P21Play
    console.log('\nListing schemas in P21Play:');
    const schemaResult = await connection.query('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA ORDER BY SCHEMA_NAME');
    schemaResult.forEach(row => {
      console.log(`- ${row.SCHEMA_NAME}`);
    });
    
    // Look for order-related tables
    console.log('\nLooking for order-related tables:');
    const orderTablesResult = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE '%order%' OR TABLE_NAME LIKE '%oe%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    if (orderTablesResult.length > 0) {
      orderTablesResult.forEach(row => {
        console.log(`- ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
      });
    } else {
      console.log('No order-related tables found.');
    }
    
    // Look for inventory-related tables
    console.log('\nLooking for inventory-related tables:');
    const invTablesResult = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE '%inv%' OR TABLE_NAME LIKE '%item%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    if (invTablesResult.length > 0) {
      invTablesResult.forEach(row => {
        console.log(`- ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
      });
    } else {
      console.log('No inventory-related tables found.');
    }
    
    // Get the top tables by row count
    console.log('\nTop tables by row count:');
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
        AND p.rows > 0
      ORDER BY 
        p.rows DESC
      OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
    `;
    
    const topTablesResult = await connection.query(topTablesQuery);
    if (topTablesResult.length > 0) {
      topTablesResult.forEach(row => {
        console.log(`- ${row.schema_name}.${row.table_name} (${row.row_count} rows)`);
      });
      
      // Test queries on the top tables
      console.log('\nTesting queries on top tables:');
      for (const table of topTablesResult) {
        const tableName = `${table.schema_name}.${table.table_name}`;
        console.log(`\nTesting query on ${tableName}:`);
        
        try {
          // Test a simple count query
          const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
          console.log(`Query: ${countQuery}`);
          const countResult = await connection.query(countQuery);
          console.log(`Result: ${countResult[0].count}`);
          
          // Get column information
          const columnsQuery = `
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${table.schema_name}' 
            AND TABLE_NAME = '${table.table_name}'
          `;
          
          const columnsResult = await connection.query(columnsQuery);
          
          // Look for numeric columns that might be useful for aggregation
          const numericColumns = columnsResult.filter(col => 
            ['int', 'decimal', 'numeric', 'float', 'money'].includes(col.DATA_TYPE.toLowerCase())
          );
          
          if (numericColumns.length > 0) {
            console.log(`\nTesting aggregation on numeric columns in ${tableName}:`);
            
            for (const col of numericColumns.slice(0, 3)) { // Test up to 3 numeric columns
              const aggQuery = `SELECT AVG(${col.COLUMN_NAME}) as avg_value FROM ${tableName}`;
              console.log(`Query: ${aggQuery}`);
              
              try {
                const aggResult = await connection.query(aggQuery);
                console.log(`Result: ${aggResult[0].avg_value}`);
              } catch (aggError) {
                console.log(`Error executing aggregation query: ${aggError.message}`);
              }
            }
          }
        } catch (tableError) {
          console.log(`Error testing queries on ${tableName}: ${tableError.message}`);
        }
      }
    } else {
      console.log('No tables with data found.');
    }
    
    // Test some specific queries that might be useful for the admin spreadsheet
    console.log('\nTesting specific queries for admin spreadsheet:');
    
    const testQueries = [
      {
        name: 'Total Order Count',
        query: 'SELECT COUNT(*) as count FROM dbo.oe_hdr'
      },
      {
        name: 'Average Order Amount',
        query: 'SELECT AVG(order_tot) as avg_amount FROM dbo.oe_hdr'
      },
      {
        name: 'Inventory Item Count',
        query: 'SELECT COUNT(*) as count FROM dbo.inv_mast'
      },
      {
        name: 'Customer Count',
        query: 'SELECT COUNT(*) as count FROM dbo.customer'
      }
    ];
    
    for (const test of testQueries) {
      console.log(`\nTesting: ${test.name}`);
      console.log(`Query: ${test.query}`);
      
      try {
        const result = await connection.query(test.query);
        console.log(`Result: ${Object.values(result[0])[0]}`);
      } catch (queryError) {
        console.log(`Error executing query: ${queryError.message}`);
        
        // If the query failed, try to find the correct table
        if (queryError.message.includes('Invalid object name')) {
          const tableName = test.query.split('FROM ')[1].split(' ')[0];
          console.log(`Table ${tableName} not found. Searching for similar tables...`);
          
          const similarTableQuery = `
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%${tableName.replace(/dbo\.|\./, '')}%'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
          `;
          
          try {
            const similarTables = await connection.query(similarTableQuery);
            
            if (similarTables.length > 0) {
              console.log('Found similar tables:');
              similarTables.forEach(row => {
                console.log(`- ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
              });
              
              // Try the query with the first similar table
              const firstSimilarTable = `${similarTables[0].TABLE_SCHEMA}.${similarTables[0].TABLE_NAME}`;
              const modifiedQuery = test.query.replace(tableName, firstSimilarTable);
              
              console.log(`\nTrying modified query: ${modifiedQuery}`);
              
              try {
                const modifiedResult = await connection.query(modifiedQuery);
                console.log(`Result: ${Object.values(modifiedResult[0])[0]}`);
              } catch (modifiedError) {
                console.log(`Error executing modified query: ${modifiedError.message}`);
              }
            } else {
              console.log('No similar tables found.');
            }
          } catch (searchError) {
            console.log(`Error searching for similar tables: ${searchError.message}`);
          }
        }
      }
    }
    
    console.log('\nExploration completed successfully');
  } catch (error) {
    console.error('Error exploring P21Play database:', error);
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
exploreP21PlayDatabase().catch(error => {
  console.error('Unhandled error during database exploration:', error);
  process.exit(1);
});
