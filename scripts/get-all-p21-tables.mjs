// Script to get all table names from the P21Play database
import odbc from 'odbc';
import fs from 'fs';
import path from 'path';

async function getAllP21Tables() {
  let connection;
  try {
    console.log('Connecting to P21Play database...');
    connection = await odbc.connect('DSN=P21Play;Trusted_Connection=Yes;');
    console.log('Connection established successfully');
    
    // Switch to P21Play database
    await connection.query('USE P21Play');
    
    // Get all tables in the database
    const tablesQuery = `
      SELECT 
        t.name AS TableName,
        s.name AS SchemaName,
        p.rows AS RowCount,
        ISNULL(ep.value, '') AS TableDescription
      FROM 
        sys.tables t
      INNER JOIN 
        sys.schemas s ON t.schema_id = s.schema_id
      INNER JOIN 
        sys.dm_db_partition_stats p ON t.object_id = p.object_id
      LEFT JOIN 
        sys.extended_properties ep ON t.object_id = ep.major_id 
        AND ep.minor_id = 0 
        AND ep.name = 'MS_Description'
      WHERE 
        p.index_id IN (0, 1)
      GROUP BY 
        t.name, s.name, p.rows, ep.value
      ORDER BY 
        p.rows DESC, s.name, t.name
    `;
    
    const tablesResult = await connection.query(tablesQuery);
    console.log(`Found ${tablesResult.length} tables in P21Play database`);
    
    // Create a markdown file with the table information
    let markdownContent = '# P21 Database Tables\n\n';
    markdownContent += 'This document lists all tables found in the P21Play database.\n\n';
    markdownContent += '## Tables by Row Count\n\n';
    markdownContent += '| Schema | Table Name | Row Count | Description |\n';
    markdownContent += '|--------|------------|-----------|-------------|\n';
    
    tablesResult.forEach(table => {
      markdownContent += `| ${table.SchemaName} | ${table.TableName} | ${table.RowCount} | ${table.TableDescription} |\n`;
    });
    
    // Add sections for common table categories
    markdownContent += '\n## Common Table Categories\n\n';
    
    // Order-related tables
    const orderTables = tablesResult.filter(t => 
      t.TableName.toLowerCase().includes('order') || 
      t.TableName.toLowerCase().includes('oe_')
    );
    
    markdownContent += '\n### Order-related Tables\n\n';
    markdownContent += '| Schema | Table Name | Row Count |\n';
    markdownContent += '|--------|------------|----------|\n';
    orderTables.forEach(table => {
      markdownContent += `| ${table.SchemaName} | ${table.TableName} | ${table.RowCount} |\n`;
    });
    
    // Inventory-related tables
    const inventoryTables = tablesResult.filter(t => 
      t.TableName.toLowerCase().includes('inv') || 
      t.TableName.toLowerCase().includes('item') ||
      t.TableName.toLowerCase().includes('product')
    );
    
    markdownContent += '\n### Inventory-related Tables\n\n';
    markdownContent += '| Schema | Table Name | Row Count |\n';
    markdownContent += '|--------|------------|----------|\n';
    inventoryTables.forEach(table => {
      markdownContent += `| ${table.SchemaName} | ${table.TableName} | ${table.RowCount} |\n`;
    });
    
    // Customer-related tables
    const customerTables = tablesResult.filter(t => 
      t.TableName.toLowerCase().includes('customer') || 
      t.TableName.toLowerCase().includes('cust_')
    );
    
    markdownContent += '\n### Customer-related Tables\n\n';
    markdownContent += '| Schema | Table Name | Row Count |\n';
    markdownContent += '|--------|------------|----------|\n';
    customerTables.forEach(table => {
      markdownContent += `| ${table.SchemaName} | ${table.TableName} | ${table.RowCount} |\n`;
    });
    
    // Invoice-related tables
    const invoiceTables = tablesResult.filter(t => 
      t.TableName.toLowerCase().includes('invoice') || 
      t.TableName.toLowerCase().includes('inv_')
    );
    
    markdownContent += '\n### Invoice-related Tables\n\n';
    markdownContent += '| Schema | Table Name | Row Count |\n';
    markdownContent += '|--------|------------|----------|\n';
    invoiceTables.forEach(table => {
      markdownContent += `| ${table.SchemaName} | ${table.TableName} | ${table.RowCount} |\n`;
    });
    
    // Write the markdown file
    fs.writeFileSync(path.join(process.cwd(), 'P21Tables.md'), markdownContent);
    console.log('P21Tables.md file created successfully');
    
    // Return the table data for further processing
    return tablesResult;
  } catch (error) {
    console.error('Error getting P21 tables:', error);
    return [];
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

// Run the function
getAllP21Tables().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
