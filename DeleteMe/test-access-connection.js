// Script to test MS Access connection and query execution
const fetch = require('node-fetch');

async function testAccessConnection() {
  try {
    console.log('Testing MS Access connection...');
    
    // Replace with your actual MS Access file path
    const filePath = 'C:\\path\\to\\your\\access\\database.accdb';
    
    // Test connection
    console.log(`Testing connection to: ${filePath}`);
    const connectionResponse = await fetch('http://localhost:3000/api/connection/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          type: 'POR',
          filePath: filePath
        }
      }),
    });
    
    const connectionResult = await connectionResponse.json();
    console.log('Connection test result:', connectionResult);
    
    if (!connectionResult.success) {
      console.error('Connection test failed:', connectionResult.message);
      return;
    }
    
    // Test query execution
    console.log('Testing query execution...');
    const queryResponse = await fetch('http://localhost:3000/api/executeQuery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        server: 'POR',
        sql: 'SELECT TOP 10 * FROM YourTableName'
      }),
    });
    
    const queryResult = await queryResponse.json();
    console.log('Query result:', queryResult);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAccessConnection();
