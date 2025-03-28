/**
 * Script to explore POR database tables and their structure
 * Uses only supported commands: SHOW TABLES, DESCRIBE, and SELECT
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Tables of interest to explore
const tablesToExplore = [
  'PurchaseOrder',
  'PurchaseOrderDetail',
  'Transactions',
  'TransactionItems',
  'CustomerFile_Tr_Bak',
  'ItemFile'
];

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  allTables: [],
  tableDetails: {}
};

/**
 * Execute a query against the POR database using the API endpoint
 */
async function executeQuery(query) {
  return new Promise((resolve, reject) => {
    // Prepare the request data
    const data = JSON.stringify({
      server: 'POR',
      query: query
    });
    
    // Prepare the request options
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/executeQuery',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    // Send the request
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    // Write the data and end the request
    req.write(data);
    req.end();
  });
}

/**
 * Get all table names from the POR database
 */
async function getAllTableNames() {
  console.log('Getting all table names from POR database...');
  
  try {
    // Use SHOW TABLES query
    const response = await executeQuery('SHOW TABLES');
    
    if (response.success && response.data && response.data.length > 0) {
      const tableNames = response.data.map(row => row.TableName);
      console.log(`Found ${tableNames.length} tables in the database`);
      results.allTables = tableNames;
      return tableNames;
    } else {
      console.log('No tables found or error in response:', response.message || 'Unknown error');
      results.allTables = [];
      return [];
    }
  } catch (error) {
    console.error(`Error getting table names: ${error.message}`);
    results.allTables = [];
    return [];
  }
}

/**
 * Get table structure using DESCRIBE
 */
async function getTableStructure(tableName) {
  console.log(`Getting structure for table: ${tableName}`);
  
  try {
    // Use DESCRIBE query
    const response = await executeQuery(`DESCRIBE ${tableName}`);
    
    if (response.success && response.data && response.data.length > 0) {
      console.log(`Table ${tableName} has ${response.data.length} columns`);
      return response.data;
    } else {
      console.log(`Error or no columns found for table ${tableName}:`, response.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error(`Error getting structure for table ${tableName}: ${error.message}`);
    return null;
  }
}

/**
 * Get sample data from a table
 */
async function getSampleData(tableName, limit = 5) {
  console.log(`Getting sample data from table: ${tableName}`);
  
  try {
    // Use SELECT query with LIMIT
    const response = await executeQuery(`SELECT * FROM ${tableName}`);
    
    if (response.success && response.data && response.data.length > 0) {
      // Limit the number of rows returned
      const limitedData = response.data.slice(0, limit);
      console.log(`Retrieved ${limitedData.length} sample rows from table ${tableName}`);
      return limitedData;
    } else {
      console.log(`Error or no data found in table ${tableName}:`, response.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error(`Error getting sample data from table ${tableName}: ${error.message}`);
    return null;
  }
}

/**
 * Explore a table's structure and sample data
 */
async function exploreTable(tableName) {
  console.log(`\nExploring table: ${tableName}`);
  
  // Initialize table details
  results.tableDetails[tableName] = {
    structure: null,
    sampleData: null
  };
  
  // Get table structure
  const structure = await getTableStructure(tableName);
  results.tableDetails[tableName].structure = structure;
  
  // Get sample data
  if (structure) {
    const sampleData = await getSampleData(tableName);
    results.tableDetails[tableName].sampleData = sampleData;
  }
}

/**
 * Find tables matching a pattern
 */
async function findTablesMatchingPattern(pattern) {
  console.log(`\nFinding tables matching pattern: ${pattern}`);
  
  try {
    // Use MSysObjects query with LIKE
    const response = await executeQuery(`
      SELECT * FROM MSysObjects 
      WHERE Name LIKE '%${pattern}%' AND Type=1 AND Flags=0
    `);
    
    if (response.success && response.data && response.data.length > 0) {
      const matchingTables = response.data.map(row => row.Name);
      console.log(`Found ${matchingTables.length} tables matching pattern '${pattern}'`);
      return matchingTables;
    } else {
      console.log(`No tables found matching pattern '${pattern}' or error:`, response.message || 'Unknown error');
      return [];
    }
  } catch (error) {
    console.error(`Error finding tables matching pattern '${pattern}': ${error.message}`);
    return [];
  }
}

/**
 * Generate a report file
 */
function generateReport() {
  // Save JSON report
  const jsonReportPath = path.join(__dirname, 'por-database-report.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2));
  console.log(`\nJSON report saved to: ${jsonReportPath}`);
  
  // Generate a more readable markdown report
  let markdownReport = `# POR Database Exploration Report\n\n`;
  markdownReport += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  // Add table count
  markdownReport += `## Database Summary\n\n`;
  markdownReport += `Total tables: ${results.allTables.length}\n\n`;
  
  // Add explored tables
  markdownReport += `## Explored Tables\n\n`;
  
  for (const tableName in results.tableDetails) {
    markdownReport += `### ${tableName}\n\n`;
    
    // Add table structure
    const structure = results.tableDetails[tableName].structure;
    if (structure) {
      markdownReport += `#### Structure\n\n`;
      markdownReport += `| Field | Type | Null |\n`;
      markdownReport += `|-------|------|------|\n`;
      
      structure.forEach(column => {
        markdownReport += `| ${column.Field} | ${column.Type} | ${column.Null} |\n`;
      });
      
      markdownReport += `\n`;
    } else {
      markdownReport += `Structure: Not available\n\n`;
    }
    
    // Add sample data
    const sampleData = results.tableDetails[tableName].sampleData;
    if (sampleData && sampleData.length > 0) {
      markdownReport += `#### Sample Data\n\n`;
      
      // Create header row with column names
      const columns = Object.keys(sampleData[0]);
      markdownReport += `| ${columns.join(' | ')} |\n`;
      markdownReport += `| ${columns.map(() => '---').join(' | ')} |\n`;
      
      // Add data rows (limit to 5 rows)
      const limitedData = sampleData.slice(0, 5);
      limitedData.forEach(row => {
        markdownReport += `| ${columns.map(col => row[col] !== null && row[col] !== undefined ? String(row[col]).substring(0, 30) : '').join(' | ')} |\n`;
      });
      
      markdownReport += `\n`;
    } else {
      markdownReport += `Sample Data: Not available\n\n`;
    }
  }
  
  // Save markdown report
  const mdReportPath = path.join(__dirname, 'por-database-report.md');
  fs.writeFileSync(mdReportPath, markdownReport);
  console.log(`Markdown report saved to: ${mdReportPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('=== POR Database Exploration ===');
  
  // Get all table names
  const allTables = await getAllTableNames();
  
  if (allTables.length === 0) {
    console.log('No tables found in the database or connection error');
    return;
  }
  
  // Find tables related to purchase orders
  const purchaseOrderTables = await findTablesMatchingPattern('Purchase');
  console.log('Purchase Order related tables:', purchaseOrderTables);
  
  // Find tables related to transactions
  const transactionTables = await findTablesMatchingPattern('Transaction');
  console.log('Transaction related tables:', transactionTables);
  
  // Find tables related to customers
  const customerTables = await findTablesMatchingPattern('Customer');
  console.log('Customer related tables:', customerTables);
  
  // Explore tables of interest
  for (const tableName of tablesToExplore) {
    await exploreTable(tableName);
  }
  
  // Generate report
  generateReport();
  
  console.log('\n=== Exploration completed ===');
}

// Run the script
main()
  .then(() => {
    console.log('Script completed successfully');
  })
  .catch(error => {
    console.error('Script failed:', error);
  });
