/**
 * Check Database Tables
 * This script checks which tables are available in the P21 and POR databases
 * to help fix SQL expressions that reference non-existent tables.
 */

const fetch = require('node-fetch');

// Base URL for API calls
const BASE_URL = 'http://localhost:3000';

// Function to check tables in P21 database
async function checkP21Tables() {
  console.log('Checking tables in P21 database...');
  
  try {
    // Query to get all table names in the P21 database
    const sql = `
      SELECT 
        t.name AS table_name,
        s.name AS schema_name
      FROM 
        sys.tables t
      INNER JOIN 
        sys.schemas s ON t.schema_id = s.schema_id
      ORDER BY 
        s.name, t.name
    `;
    
    const response = await fetch(`${BASE_URL}/api/executeQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql,
        server: 'P21'
      })
    });
    
    if (!response.ok) {
      console.log(`❌ Failed to get P21 tables: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.log(`❌ Failed to get P21 tables: ${result.message}`);
      return [];
    }
    
    console.log(`✅ Found ${result.data.length} tables in P21 database`);
    
    // Return the table names
    return result.data.map(row => ({
      schema: row.schema_name,
      table: row.table_name
    }));
    
  } catch (error) {
    console.log(`❌ Error checking P21 tables: ${error.message}`);
    return [];
  }
}

// Function to check tables in POR database
async function checkPORTables() {
  console.log('Checking tables in POR database...');
  
  try {
    // Query to get all table names in the POR database (MS Access)
    const sql = `
      SELECT 
        Name AS table_name,
        'dbo' AS schema_name
      FROM 
        MSysObjects
      WHERE 
        Type = 1 AND Flags = 0
      ORDER BY 
        Name
    `;
    
    const response = await fetch(`${BASE_URL}/api/executeQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql,
        server: 'POR',
        filePath: process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB'
      })
    });
    
    if (!response.ok) {
      console.log(`❌ Failed to get POR tables: ${response.status} ${response.statusText}`);
      
      // Try alternative approach for MS Access
      return await checkPORTablesAlternative();
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.log(`❌ Failed to get POR tables: ${result.message}`);
      
      // Try alternative approach for MS Access
      return await checkPORTablesAlternative();
    }
    
    console.log(`✅ Found ${result.data.length} tables in POR database`);
    
    // Return the table names
    return result.data.map(row => ({
      schema: '',  // MS Access doesn't use schemas
      table: row.table_name
    }));
    
  } catch (error) {
    console.log(`❌ Error checking POR tables: ${error.message}`);
    
    // Try alternative approach for MS Access
    return await checkPORTablesAlternative();
  }
}

// Alternative function to check tables in POR database
async function checkPORTablesAlternative() {
  console.log('Trying alternative method to check POR tables...');
  
  try {
    // Try to query a known system table in MS Access
    const sql = `
      SELECT 
        MSysObjects.Name AS table_name
      FROM 
        MSysObjects
      WHERE 
        MSysObjects.Type = 1 AND MSysObjects.Flags = 0
      ORDER BY 
        MSysObjects.Name
    `;
    
    const response = await fetch(`${BASE_URL}/api/executeQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql,
        server: 'POR',
        filePath: process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB'
      })
    });
    
    if (!response.ok) {
      console.log(`❌ Failed to get POR tables (alternative): ${response.status} ${response.statusText}`);
      
      // Try a simple query to get a list of tables
      return await checkPORTablesSimple();
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.log(`❌ Failed to get POR tables (alternative): ${result.message}`);
      
      // Try a simple query to get a list of tables
      return await checkPORTablesSimple();
    }
    
    console.log(`✅ Found ${result.data.length} tables in POR database (alternative)`);
    
    // Return the table names
    return result.data.map(row => ({
      schema: '',  // MS Access doesn't use schemas
      table: row.table_name
    }));
    
  } catch (error) {
    console.log(`❌ Error checking POR tables (alternative): ${error.message}`);
    
    // Try a simple query to get a list of tables
    return await checkPORTablesSimple();
  }
}

// Simple function to check tables in POR database by trying to query specific tables
async function checkPORTablesSimple() {
  console.log('Trying simple method to check POR tables...');
  
  // List of common tables to check in POR database
  const tablesToCheck = [
    'Rentals', 'Customers', 'Products', 'Orders', 'Invoices', 
    'Employees', 'Inventory', 'Payments', 'RentalItems', 'Locations'
  ];
  
  const tables = [];
  
  for (const table of tablesToCheck) {
    try {
      const sql = `SELECT COUNT(*) as value FROM ${table}`;
      
      const response = await fetch(`${BASE_URL}/api/executeQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sql,
          server: 'POR',
          filePath: process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Table ${table} exists in POR database`);
          tables.push({
            schema: '',
            table: table
          });
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  console.log(`✅ Found ${tables.length} tables in POR database (simple)`);
  
  return tables;
}

// Function to check columns in a specific table
async function checkTableColumns(server, tableName, schemaName = '') {
  console.log(`Checking columns in ${server} table: ${schemaName ? schemaName + '.' : ''}${tableName}...`);
  
  try {
    let sql;
    
    if (server === 'P21') {
      // SQL Server query to get column information
      sql = `
        SELECT 
          c.name AS column_name,
          t.name AS data_type,
          c.max_length,
          c.is_nullable
        FROM 
          sys.columns c
        INNER JOIN 
          sys.types t ON c.user_type_id = t.user_type_id
        INNER JOIN 
          sys.tables tbl ON c.object_id = tbl.object_id
        INNER JOIN 
          sys.schemas s ON tbl.schema_id = s.schema_id
        WHERE 
          tbl.name = '${tableName}'
          AND s.name = '${schemaName || 'dbo'}'
        ORDER BY 
          c.column_id
      `;
    } else {
      // MS Access query to get column information
      sql = `
        SELECT TOP 1 * FROM ${tableName}
      `;
    }
    
    const requestBody = {
      query: sql,
      server: server
    };
    
    // Add filePath for POR queries
    if (server === 'POR') {
      requestBody.filePath = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';
    }
    
    const response = await fetch(`${BASE_URL}/api/executeQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.log(`❌ Failed to get columns for ${server} table ${tableName}: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.log(`❌ Failed to get columns for ${server} table ${tableName}: ${result.message}`);
      return [];
    }
    
    if (server === 'P21') {
      console.log(`✅ Found ${result.data.length} columns in ${server} table ${tableName}`);
      
      // Return the column names
      return result.data.map(row => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 1
      }));
    } else {
      // For POR, we get a sample row, so extract the column names from the first row
      if (result.data && result.data.length > 0) {
        const columns = Object.keys(result.data[0]).map(key => ({
          name: key,
          type: typeof result.data[0][key],
          nullable: true  // Assume nullable for simplicity
        }));
        
        console.log(`✅ Found ${columns.length} columns in ${server} table ${tableName}`);
        return columns;
      } else {
        console.log(`⚠️ No data returned for ${server} table ${tableName}`);
        return [];
      }
    }
    
  } catch (error) {
    console.log(`❌ Error checking columns for ${server} table ${tableName}: ${error.message}`);
    return [];
  }
}

// Main function
async function main() {
  console.log('Checking database tables...');
  
  // Check if the server is running
  console.log('\nChecking if server is running...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      console.log('❌ Server is not running. Please start the server with "npm run dev" and try again.');
      return;
    }
    console.log('✅ Server is running.');
  } catch (error) {
    console.log(`❌ Error checking server status: ${error.message}`);
    console.log('Please make sure the server is running with "npm run dev" and try again.');
    return;
  }
  
  // Check P21 tables
  const p21Tables = await checkP21Tables();
  console.log('\nP21 Tables:');
  p21Tables.forEach(table => {
    console.log(`- ${table.schema}.${table.table}`);
  });
  
  // Check POR tables
  const porTables = await checkPORTables();
  console.log('\nPOR Tables:');
  porTables.forEach(table => {
    console.log(`- ${table.table}`);
  });
  
  // Check columns for a few important tables
  if (p21Tables.length > 0) {
    console.log('\nChecking columns for important P21 tables:');
    
    // Find the oe_hdr table
    const oeHdrTable = p21Tables.find(t => t.table.toLowerCase() === 'oe_hdr');
    if (oeHdrTable) {
      const columns = await checkTableColumns('P21', oeHdrTable.table, oeHdrTable.schema);
      console.log(`\nColumns in ${oeHdrTable.schema}.${oeHdrTable.table}:`);
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type}${col.nullable ? ', nullable' : ''})`);
      });
    }
    
    // Find the ar_open_items table
    const arOpenItemsTable = p21Tables.find(t => t.table.toLowerCase() === 'ar_open_items');
    if (arOpenItemsTable) {
      const columns = await checkTableColumns('P21', arOpenItemsTable.table, arOpenItemsTable.schema);
      console.log(`\nColumns in ${arOpenItemsTable.schema}.${arOpenItemsTable.table}:`);
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type}${col.nullable ? ', nullable' : ''})`);
      });
    }
  }
  
  if (porTables.length > 0) {
    console.log('\nChecking columns for important POR tables:');
    
    // Find the Rentals table
    const rentalsTable = porTables.find(t => t.table.toLowerCase() === 'rentals');
    if (rentalsTable) {
      const columns = await checkTableColumns('POR', rentalsTable.table);
      console.log(`\nColumns in ${rentalsTable.table}:`);
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type}${col.nullable ? ', nullable' : ''})`);
      });
    }
  }
  
  console.log('\nDatabase table check complete.');
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:', error);
});
