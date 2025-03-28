/**
 * Script to call the API endpoint to save the database to the single source data file
 */

const http = require('http');

// Options for the HTTP request
const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/admin/saveToInitFile',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Calling API to save database to single source data file...');

// Make the HTTP request
const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Response:', response);
      
      if (response.success) {
        console.log('Database saved to single source data file successfully');
      } else {
        console.error('Error saving database to single source data file:', response.message);
      }
    } catch (error) {
      console.error('Error parsing response:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('Error making request:', error);
});

// End the request
req.end();
