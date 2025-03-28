// Script to find the correct P21 database and explore its schema
import odbc from 'odbc';

async function findP21Database() {
  let connection;
  try {
    console.log('Connecting to SQL Server via P21Play DSN...');
    connection = await odbc.connect('DSN=P21Play;Trusted_Connection=Yes;');
    console.log('Connection established successfully');
    
    // Get current database name
    const dbResult = await connection.query('SELECT DB_NAME() as database_name');
    console.log(`\nCurrent database: ${dbResult[0].database_name}`);
    
    // List all databases on the server
    console.log('\nListing all databases on the server:');
    const databasesResult = await connection.query(`
      SELECT name, database_id, create_date 
      FROM sys.databases 
      WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
      ORDER BY name
    `);
    
    if (databasesResult.length === 0) {
      console.log('No user databases found on the server.');
    } else {
      databasesResult.forEach(row => {
        console.log(`- ${row.name} (ID: ${row.database_id}, Created: ${row.create_date})`);
      });
      
      // For each database, try to find P21-related tables
      for (const db of databasesResult) {
        console.log(`\n--- Exploring database: ${db.name} ---`);
        
        try {
          // Switch to the database
          await connection.query(`USE [${db.name}]`);
          
          // Check for common P21 tables
          const p21TablesQuery = `
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME IN (
              'order_header', 'order_line', 'inv_mast', 'customer', 'vendor',
              'po_header', 'po_line', 'ap_hdr', 'ap_dist', 'ar_open_item',
              'oe_hdr', 'oe_line', 'im_itemwhse', 'im_item'
            )
            ORDER BY TABLE_SCHEMA, TABLE_NAME
          `;
          
          const p21TablesResult = await connection.query(p21TablesQuery);
          
          if (p21TablesResult.length > 0) {
            console.log(`Found ${p21TablesResult.length} potential P21 tables in database ${db.name}:`);
            p21TablesResult.forEach(row => {
              console.log(`- ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
            });
            
            // This is likely a P21 database, so let's explore it further
            console.log(`\n${db.name} appears to be a P21 database. Exploring schema...`);
            
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
              
              // For the first order table, check if it has data
              const firstOrderTable = `${orderTablesResult[0].TABLE_SCHEMA}.${orderTablesResult[0].TABLE_NAME}`;
              try {
                const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${firstOrderTable}`);
                console.log(`\nCount of rows in ${firstOrderTable}: ${countResult[0].count}`);
                
                if (countResult[0].count > 0) {
                  // Try to get column information
                  const columnsResult = await connection.query(`
                    SELECT COLUMN_NAME, DATA_TYPE 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = '${orderTablesResult[0].TABLE_SCHEMA}' 
                    AND TABLE_NAME = '${orderTablesResult[0].TABLE_NAME}'
                  `);
                  
                  console.log(`\nColumns in ${firstOrderTable}:`);
                  columnsResult.forEach(col => {
                    console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
                  });
                  
                  // Try to find amount columns
                  const amountColumns = columnsResult.filter(col => 
                    col.COLUMN_NAME.toLowerCase().includes('amount') || 
                    col.COLUMN_NAME.toLowerCase().includes('amt') ||
                    col.COLUMN_NAME.toLowerCase().includes('total') ||
                    col.COLUMN_NAME.toLowerCase().includes('price')
                  );
                  
                  if (amountColumns.length > 0) {
                    console.log(`\nPotential amount columns in ${firstOrderTable}:`);
                    amountColumns.forEach(col => {
                      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
                    });
                    
                    // Test a query with the first amount column
                    const testColumn = amountColumns[0].COLUMN_NAME;
                    const testQuery = `SELECT AVG(${testColumn}) as avg_value FROM ${firstOrderTable}`;
                    console.log(`\nTesting query: ${testQuery}`);
                    
                    const testResult = await connection.query(testQuery);
                    console.log(`Result: ${testResult[0].avg_value}`);
                  }
                }
              } catch (tableError) {
                console.log(`Error querying ${firstOrderTable}: ${tableError.message}`);
              }
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
              
              // For the first inventory table, check if it has data
              const firstInvTable = `${invTablesResult[0].TABLE_SCHEMA}.${invTablesResult[0].TABLE_NAME}`;
              try {
                const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${firstInvTable}`);
                console.log(`\nCount of rows in ${firstInvTable}: ${countResult[0].count}`);
              } catch (tableError) {
                console.log(`Error querying ${firstInvTable}: ${tableError.message}`);
              }
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
              ORDER BY 
                p.rows DESC
              OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
            `;
            
            const topTablesResult = await connection.query(topTablesQuery);
            topTablesResult.forEach(row => {
              console.log(`- ${row.schema_name}.${row.table_name} (${row.row_count} rows)`);
            });
          } else {
            console.log(`No P21-related tables found in database ${db.name}.`);
          }
        } catch (dbError) {
          console.log(`Error exploring database ${db.name}: ${dbError.message}`);
        }
      }
    }
    
    console.log('\nExploration completed successfully');
  } catch (error) {
    console.error('Error finding P21 database:', error);
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
findP21Database().catch(error => {
  console.error('Unhandled error during database exploration:', error);
  process.exit(1);
});
