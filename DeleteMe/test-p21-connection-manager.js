// Test script for P21 connection using ConnectionManager
// We need to use dynamic import since this is an ES module
async function testP21ConnectionManager() {
  console.log('Testing P21 connection using ConnectionManager...');
  
  try {
    // Dynamically import the ConnectionManager
    const { ConnectionManager } = await import('../lib/db/connection-manager.ts');
    
    // Create P21 configuration
    const config = {
      type: 'P21',
      server: '10.10.20.28',
      database: 'P21Play'
    };
    
    console.log('Testing connection to P21...');
    
    // Test the connection
    const result = await ConnectionManager.testConnection(config);
    
    console.log('Connection test result:', result);
    
    if (result.success) {
      console.log('Connection test successful!');
      
      // Try executing a query
      console.log('\nExecuting test query...');
      
      try {
        const queryResult = await ConnectionManager.executeQuery(config, 'SELECT TOP 5 * FROM inv_mast');
        
        console.log('Query result:');
        console.log(queryResult);
        
        return true;
      } catch (queryError) {
        console.error('Error executing query:', queryError.message);
        return false;
      }
    } else {
      console.error('Connection test failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('P21 connection test failed:');
    console.error(error.message);
    return false;
  }
}

// Run the test
testP21ConnectionManager()
  .then(success => {
    if (success) {
      console.log('P21 ConnectionManager test completed successfully');
    } else {
      console.log('P21 ConnectionManager test failed');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Unhandled error in test script:', err);
    process.exit(1);
  });
