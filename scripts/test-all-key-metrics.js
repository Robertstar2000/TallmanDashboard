// Script to test all Key Metrics SQL expressions
const odbc = require('odbc');
const fs = require('fs');

// Connect to P21 database using ODBC
async function connectToP21() {
  try {
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    const connection = await odbc.connect(connectionString);
    console.log('Successfully connected to P21 database');
    return connection;
  } catch (error) {
    console.error('Error connecting to P21 database:', error);
    return null;
  }
}

// Read the complete-chart-data.ts file to extract Key Metrics SQL expressions
async function extractKeyMetricsSQL() {
  try {
    const filePath = require('path').join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract all Key Metrics entries
    const keyMetricsRegex = /"id":\s*"(1[1-2][7-9]|12[0-3])"[\s\S]*?"chartGroup":\s*"Key Metrics"[\s\S]*?"productionSqlExpression":\s*"([^"]*)"/g;
    
    const keyMetrics = [];
    let match;
    while ((match = keyMetricsRegex.exec(fileContent)) !== null) {
      const id = match[1];
      const sql = match[2];
      
      // Extract the variable name for this metric
      const variableNameRegex = new RegExp(`"id":\\s*"${id}"[\\s\\S]*?"variableName":\\s*"([^"]*)"`, 'g');
      const nameMatch = variableNameRegex.exec(fileContent);
      const name = nameMatch ? nameMatch[1] : `Metric ${id}`;
      
      keyMetrics.push({ id, name, sql });
    }
    
    return keyMetrics;
  } catch (error) {
    console.error('Error extracting SQL expressions:', error);
    return [];
  }
}

// Execute SQL query
async function executeQuery(connection, sql) {
  try {
    console.log('Executing SQL:', sql);
    const result = await connection.query(sql);
    return result;
  } catch (error) {
    console.error('Error executing query:', error.message);
    return null;
  }
}

// Test a single metric
async function testMetric(connection, metric) {
  console.log(`\n=== Testing ${metric.name} (ID: ${metric.id}) ===`);
  
  // Try the SQL
  const result = await executeQuery(connection, metric.sql);
  if (result && result.length > 0 && result[0].value !== null) {
    console.log(`Result: ${result[0].value}`);
    return {
      id: metric.id,
      name: metric.name,
      sql: metric.sql,
      value: result[0].value,
      status: result[0].value > 0 ? 'SUCCESS' : 'ZERO'
    };
  } else {
    console.log('Query failed or returned null');
    return {
      id: metric.id,
      name: metric.name,
      sql: metric.sql,
      status: 'FAILED'
    };
  }
}

// Main function to test all metrics
async function testKeyMetrics() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return;
  }
  
  const keyMetrics = await extractKeyMetricsSQL();
  if (keyMetrics.length === 0) {
    console.error('No Key Metrics SQL expressions found. Exiting...');
    await connection.close();
    return;
  }
  
  console.log(`Found ${keyMetrics.length} Key Metrics SQL expressions to test.`);
  
  const results = [];
  
  // Test each metric
  for (const metric of keyMetrics) {
    const result = await testMetric(connection, metric);
    results.push(result);
  }
  
  // Close connection
  await connection.close();
  
  // Save results to file
  fs.writeFileSync('key-metrics-results.json', JSON.stringify(results, null, 2));
  console.log('\n=== Testing completed ===');
  console.log('Results saved to key-metrics-results.json');
  
  // Print summary
  console.log('\n=== SUMMARY ===');
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const zero = results.filter(r => r.status === 'ZERO').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(`${successful} metrics returned non-zero values`);
  console.log(`${zero} metrics returned zero values`);
  console.log(`${failed} metrics failed to execute`);
  
  console.log('\nResults:');
  results.forEach(r => {
    console.log(`- ${r.name}: ${r.status === 'FAILED' ? 'FAILED' : r.value} (${r.status})`);
  });
}

// Run the test
testKeyMetrics();
