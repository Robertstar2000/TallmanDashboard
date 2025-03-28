/**
 * Simple script to list all tables in the POR database and save to a file
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

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
 * Main function
 */
async function main() {
  console.log('Getting all tables from POR database...');
  
  try {
    // Use SHOW TABLES query
    const response = await executeQuery('SHOW TABLES');
    
    if (response.success && response.data && response.data.length > 0) {
      const tableNames = response.data.map(row => row.TableName);
      console.log(`Found ${tableNames.length} tables in the database`);
      
      // Save to text file
      const outputPath = path.join(__dirname, 'por-tables-list.txt');
      fs.writeFileSync(outputPath, tableNames.join('\n'));
      console.log(`Table list saved to: ${outputPath}`);
      
      // Save to JSON file for easier processing
      const jsonPath = path.join(__dirname, 'por-tables-list.json');
      fs.writeFileSync(jsonPath, JSON.stringify(tableNames, null, 2));
      console.log(`Table list saved to: ${jsonPath}`);
      
      return tableNames;
    } else {
      console.log('No tables found or error in response:', response.message || 'Unknown error');
      return [];
    }
  } catch (error) {
    console.error(`Error getting table names: ${error.message}`);
    return [];
  }
}

// Run the script
main()
  .then(() => {
    console.log('Script completed successfully');
  })
  .catch(error => {
    console.error('Script failed:', error);
  });
