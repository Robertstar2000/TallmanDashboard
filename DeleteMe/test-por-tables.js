/**
 * Test script for exploring Point of Rental database tables
 * This script connects to the POR database and lists available tables
 */

const axios = require('axios');

// Configuration
const POR_DB_PATH = 'C:\\Users\\BobM\\Desktop\\POR.mdb';

// Function to test the connection to the MS Access database
async function testConnection() {
  try {
    console.log('Testing connection to POR database...');
    
    const response = await axios.post('/api/connection/test', {
      type: 'POR',
      filePath: POR_DB_PATH
    });
    
    if (response.data.success) {
      console.log('✅ Connection successful:', response.data.message);
      return true;
    } else {
      console.error('❌ Connection failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing connection:', error.response?.data?.error || error.message);
    return false;
  }
}

// Function to execute a query against the MS Access database
async function executeQuery(sql) {
  try {
    console.log(`Executing query: ${sql}`);
    
    const response = await axios.post('/api/admin/test-query', {
      type: 'POR',
      filePath: POR_DB_PATH,
      query: sql
    });
    
    return response.data;
  } catch (error) {
    console.error('Query execution failed:', error.response?.data || error.message);
    
    // If we have table information in the error, return it
    if (error.response?.data?.availableTables) {
      console.log('Available tables found in error response:', error.response.data.availableTables);
      return { availableTables: error.response.data.availableTables };
    }
    
    throw error;
  }
}

// Function to list all tables in the database
async function listTables() {
  try {
    // Try different approaches to list tables
    const approaches = [
      // Approach 1: Using MSysObjects (standard way)
      `SELECT MSysObjects.Name AS TableName
       FROM MSysObjects
       WHERE (((MSysObjects.Type) In (1,4,6)) AND ((MSysObjects.Flags)=0))
       ORDER BY MSysObjects.Name`,
      
      // Approach 2: Alternative using schema information
      `SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0`,
      
      // Approach 3: Using schema rowset (might work in some Access versions)
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='TABLE'`
    ];
    
    let tables = [];
    let succeeded = false;
    
    // Try each approach until one works
    for (const query of approaches) {
      try {
        console.log(`Trying to list tables with query: ${query}`);
        const result = await executeQuery(query);
        
        if (Array.isArray(result) && result.length > 0) {
          tables = result.map(row => row.TableName || row.Name || row.TABLE_NAME);
          console.log(`✅ Found ${tables.length} tables using query: ${query}`);
          succeeded = true;
          break;
        }
      } catch (error) {
        console.log(`Approach failed: ${error.message}`);
      }
    }
    
    // If none of the approaches worked, check if we got tables from an error response
    if (!succeeded && tables.length === 0) {
      try {
        // Try a query that will likely fail but might return table information
        const result = await executeQuery('SELECT * FROM NonExistentTable');
        
        if (result.availableTables && Array.isArray(result.availableTables)) {
          tables = result.availableTables;
          console.log(`✅ Found ${tables.length} tables from error response`);
        }
      } catch (error) {
        // Ignore this error
      }
    }
    
    // If we still don't have tables, try checking for common rental tables directly
    if (tables.length === 0) {
      const commonTables = [
        'Contracts', 'Invoices', 'WorkOrders', 'Customers', 'Items', 
        'Inventory', 'Rentals', 'Transactions', 'Payments', 'Employees', 
        'Vendors', 'PurchaseOrders', 'PurchaseOrderDetails'
      ];
      
      console.log('Trying common rental tables directly...');
      
      for (const table of commonTables) {
        try {
          // Try to get the count from each table
          const countQuery = `SELECT COUNT(*) AS Count FROM [${table}]`;
          const result = await executeQuery(countQuery);
          
          if (result && (Array.isArray(result) || result.Count !== undefined)) {
            tables.push(table);
            console.log(`✅ Table exists: ${table}`);
          }
        } catch (error) {
          // Table doesn't exist, skip it
          console.log(`❌ Table doesn't exist: ${table}`);
        }
      }
    }
    
    return tables;
  } catch (error) {
    console.error('Failed to list tables:', error);
    return [];
  }
}

// Function to explore a table's structure
async function exploreTable(tableName) {
  try {
    console.log(`\nExploring table: ${tableName}`);
    
    // Get the first row to understand the structure
    const query = `SELECT TOP 1 * FROM [${tableName}]`;
    const result = await executeQuery(query);
    
    if (Array.isArray(result) && result.length > 0) {
      const columns = Object.keys(result[0]);
      console.log(`Table ${tableName} has ${columns.length} columns:`);
      columns.forEach(column => {
        const value = result[0][column];
        const type = typeof value;
        console.log(`  - ${column} (${type}): ${value}`);
      });
      
      // Get row count
      const countQuery = `SELECT COUNT(*) AS Count FROM [${tableName}]`;
      const countResult = await executeQuery(countQuery);
      const count = Array.isArray(countResult) ? countResult[0].Count : countResult;
      console.log(`Total rows in ${tableName}: ${count}`);
      
      return { columns, rowCount: count };
    } else {
      console.log(`Table ${tableName} appears to be empty`);
      return { columns: [], rowCount: 0 };
    }
  } catch (error) {
    console.error(`Error exploring table ${tableName}:`, error.message);
    return { columns: [], rowCount: 0 };
  }
}

// Function to find purchase order related tables
async function findPurchaseOrderTables(allTables) {
  console.log('\nSearching for purchase order related tables...');
  
  // Keywords that might indicate purchase order related tables
  const poKeywords = ['purchase', 'order', 'po', 'vendor', 'supplier', 'buy'];
  
  // Filter tables that might be related to purchase orders
  const potentialTables = allTables.filter(table => {
    const tableLower = table.toLowerCase();
    return poKeywords.some(keyword => tableLower.includes(keyword.toLowerCase()));
  });
  
  console.log('Potential purchase order tables:');
  potentialTables.forEach(table => console.log(`  - ${table}`));
  
  // Also check common PO table names
  const commonPoTables = ['PurchaseOrders', 'PurchaseOrderDetails', 'POHeader', 'PODetail', 'Vendors'];
  
  for (const table of commonPoTables) {
    if (!potentialTables.includes(table) && allTables.includes(table)) {
      console.log(`Found additional PO-related table: ${table}`);
      potentialTables.push(table);
    }
  }
  
  return potentialTables;
}

// Main function to run the tests
async function main() {
  try {
    console.log('=== Point of Rental Database Explorer ===');
    
    // Test the connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Cannot proceed without a valid connection');
      return;
    }
    
    // List all tables
    console.log('\nListing all tables in the database...');
    const tables = await listTables();
    
    if (tables.length === 0) {
      console.log('No tables found in the database');
      return;
    }
    
    console.log(`\nFound ${tables.length} tables:`);
    tables.forEach(table => console.log(`  - ${table}`));
    
    // Find purchase order related tables
    const poTables = await findPurchaseOrderTables(tables);
    
    // Explore each potential purchase order table
    for (const table of poTables) {
      await exploreTable(table);
    }
    
    console.log('\n=== Database exploration complete ===');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main();
