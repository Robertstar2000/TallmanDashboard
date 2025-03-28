// Initialize the system using the API endpoint
const http = require('http');

// Options for the HTTP request
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/system/initialize',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('Initializing system via API endpoint...');

// Create the request
const req = http.request(options, (res) => {
  let data = '';

  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Response status:', res.statusCode);
      console.log('Response data:', parsedData);
      
      if (res.statusCode === 200) {
        console.log('System initialized successfully');
      } else {
        console.error('Error initializing system');
      }
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      console.log('Raw response:', data);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Error sending request:', error);
});

// End the request
req.end();
