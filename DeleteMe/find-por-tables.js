/**
 * Script to find actual table names in the POR database
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Search terms to look for in table names
const searchTerms = [
  'PO',
  'PURCHASE',
  'ORDER',
  'CUSTOMER',
  'INVOICE',
  'RENTAL',
  'CONTRACT',
  'EQUIPMENT',
  'INVENTORY'
];

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  allTables: [],
  matchingTables: {}
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
 * Find tables matching search terms
 */
function findMatchingTables(tables, terms) {
  console.log('\nSearching for tables matching search terms...');
  
  for (const term of terms) {
    const termUpper = term.toUpperCase();
    console.log(`\nSearching for tables containing "${termUpper}":`);
    
    const matching = tables.filter(table => 
      table.toUpperCase().includes(termUpper)
    );
    
    results.matchingTables[termUpper] = matching;
    
    if (matching.length > 0) {
      console.log(`Found ${matching.length} tables containing "${termUpper}":`);
      matching.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table}`);
      });
    } else {
      console.log(`No tables found containing "${termUpper}"`);
    }
  }
}

/**
 * Generate a report file
 */
function generateReport() {
  const reportPath = path.join(__dirname, 'por-tables-search-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('=== POR Database Table Search ===');
  
  // Get all table names
  const tables = await getAllTableNames();
  
  if (tables.length === 0) {
    console.log('No tables found in the database or connection error');
    return;
  }
  
  // Find tables matching search terms
  findMatchingTables(tables, searchTerms);
  
  // Generate report
  generateReport();
  
  console.log('\n=== Search completed ===');
}

// Run the script
main()
  .then(() => {
    console.log('Script completed successfully');
  })
  .catch(error => {
    console.error('Script failed:', error);
  });
