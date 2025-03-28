/**
 * Test script for the ConnectionManager
 * 
 * This script tests the connection to P21 and POR databases
 * using the ConnectionManager class.
 */

import { ConnectionManager } from '../lib/db/connection-manager';

async function testConnections() {
  console.log('Testing P21 connection...');
  
  // Test P21 connection
  try {
    const p21Config = {
      type: 'P21'
    };
    
    const p21Result = await ConnectionManager.testP21Connection(p21Config);
    console.log('P21 Connection Test Result:', p21Result);
    
    if (p21Result.success) {
      // Test executing a query
      console.log('Testing P21 query execution...');
      try {
        const queryResult = await ConnectionManager.executeP21Query('SELECT TOP 5 * FROM Company');
        console.log('P21 Query Result (first 5 companies):');
        console.log(queryResult);
      } catch (error) {
        console.error('Error executing P21 query:', error.message);
      }
    }
  } catch (error) {
    console.error('Error testing P21 connection:', error.message);
  }
  
  // Close all connections
  console.log('Closing all connections...');
  await ConnectionManager.closeAllConnections();
  
  console.log('Connection tests completed.');
}

// Run the tests
testConnections().catch(error => {
  console.error('Error in test script:', error);
});
