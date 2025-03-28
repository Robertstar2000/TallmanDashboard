/**
 * Test API Endpoint
 * 
 * This script tests the /api/test-sql endpoint to verify it's working correctly.
 */

import fetch from 'node-fetch';

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3003',
  API_ENDPOINT: '/api/test-sql'
};

async function main() {
  console.log('Testing API Endpoint');
  console.log('===================\n');
  
  try {
    // Test a simple SQL query against the POR database
    const sql = 'SELECT Count(*) AS value FROM PurchaseOrderDetail';
    console.log(`Testing SQL: ${sql}`);
    
    const response = await fetch(`${CONFIG.SERVER_URL}${CONFIG.API_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sqlExpression: sql, 
        serverType: 'POR' 
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`SQL error: ${data.error}`);
    } else {
      console.log('API endpoint is working!');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.error('Error testing API endpoint:', error.message);
  }
}

main().catch(console.error);
