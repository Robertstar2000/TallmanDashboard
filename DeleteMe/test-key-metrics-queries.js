// Script to test various SQL queries for Key Metrics
const { execSync } = require('child_process');

async function testQuery(sql, description) {
  console.log(`\n----- Testing: ${description} -----`);
  console.log(`SQL: ${sql}`);
  
  try {
    // Use curl to make the request since it's more reliable in this context
    const curlCommand = `curl -s -X POST "http://localhost:3000/api/executeQuery" -H "Content-Type: application/json" -d "{\\"server\\":\\"P21\\",\\"sql\\":\\"${sql.replace(/"/g, '\\\\"')}\\"}"`;
    
    console.log('Executing curl command:', curlCommand);
    const output = execSync(curlCommand).toString();
    console.log('Raw output from curl:', output);
    
    const result = JSON.parse(output);
    console.log('Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('===== TESTING KEY METRICS QUERIES =====');
  
  // Test different variations of order count queries
  await testQuery(
    "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK)",
    "Total Orders (All Time)"
  );
  
  await testQuery(
    "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE())",
    "Total Orders (Current Month)"
  );
  
  await testQuery(
    "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)",
    "Total Orders (Current Month - Alternative)"
  );
  
  await testQuery(
    "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())",
    "Total Orders (Last 30 Days)"
  );
  
  // Test table existence
  await testQuery(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'oe_hdr'",
    "Check if oe_hdr table exists"
  );
  
  // Test alternative table names
  await testQuery(
    "SELECT TOP 10 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%order%' OR TABLE_NAME LIKE '%oe%'",
    "Find order-related tables"
  );
  
  // Test column names
  await testQuery(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'oe_hdr'",
    "Get columns from oe_hdr table"
  );
}

runTests().catch(console.error);
