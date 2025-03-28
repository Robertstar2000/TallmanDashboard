// Test script to verify our ConnectionManager implementation
// This script tests the direct SQL Server connection to P21

// Import the ConnectionManager class
const { ConnectionManager } = require('../dist/lib/db/connection-manager');

// Test SQL query
const TEST_SQL = "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)";

// Function to test P21 connection
async function testP21Connection() {
  console.log('Testing P21 connection...');
  
  try {
    // Create a P21 configuration
    const config = {
      type: 'P21'
    };
    
    // Test the connection
    const result = await ConnectionManager.testP21Connection(config);
    console.log('Connection test result:', result);
    
    if (result.success) {
      console.log('Connection successful! Testing query execution...');
      
      try {
        // Execute a test query
        const queryResult = await ConnectionManager.executeP21Query(TEST_SQL);
        console.log('Query result:', queryResult);
        
        // Close all connections
        await ConnectionManager.closeAllConnections();
        console.log('All connections closed successfully.');
      } catch (error) {
        console.error('Error executing query:', error.message);
      }
    } else {
      console.error('Connection test failed:', result.message);
    }
  } catch (error) {
    console.error('Error testing connection:', error.message);
  }
}

// Run the test
testP21Connection().catch(error => {
  console.error('Unhandled error:', error);
});
