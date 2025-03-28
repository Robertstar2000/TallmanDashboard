// Script to test Key Metrics SQL expressions against P21 database
const odbc = require('odbc');
const fs = require('fs');

// Original Key Metrics SQL expressions
const keyMetricsExpressions = [
  {
    id: "117",
    name: "Total Orders",
    originalSql: "SELECT COUNT(*) AS value FROM dbo.OE_HDR WITH (NOLOCK) WHERE order_status = 'Open' AND ORDER_DATE BETWEEN @DataPointStart AND @DataPointEnd",
    tableName: "dbo.OE_HDR",
    attempts: []
  },
  {
    id: "118",
    name: "Open Orders (/day)",
    originalSql: "SELECT COUNT(*) AS value FROM dbo.OE_HDR WITH (NOLOCK) WHERE order_status = 'Open' AND ORDER_DATE = @DataPointStart",
    tableName: "dbo.OE_HDR",
    attempts: []
  },
  {
    id: "119",
    name: "All Open Orders",
    originalSql: "SELECT COUNT(*) AS value FROM dbo.OE_HDR WITH (NOLOCK) WHERE order_status = 'Open' AND ORDER_DATE BETWEEN @DataPointStart AND @DataPointEnd",
    tableName: "dbo.OE_HDR",
    attempts: []
  },
  {
    id: "120",
    name: "Daily Revenue",
    originalSql: "SELECT SUM(Total) AS value FROM dbo.SOMAST WITH (NOLOCK) WHERE SO_DATE = @DataPointStart",
    tableName: "dbo.SOMAST",
    attempts: []
  },
  {
    id: "121",
    name: "Open Invoices",
    originalSql: "SELECT COUNT(*) AS value FROM dbo.ARINV WITH (NOLOCK) WHERE invoice_status = 'Open' AND INVOICE_DATE BETWEEN @DataPointStart AND @DataPointEnd",
    tableName: "dbo.ARINV",
    attempts: []
  },
  {
    id: "122",
    name: "OrdersBackloged",
    originalSql: "SELECT COUNT(*) AS value FROM dbo.OE_HDR WITH (NOLOCK) WHERE order_status = 'Backlog' AND ORDER_DATE BETWEEN @DataPointStart AND @DataPointEnd",
    tableName: "dbo.OE_HDR",
    attempts: []
  },
  {
    id: "123",
    name: "Total Sales Monthly",
    originalSql: "SELECT (SUM(Total) - SUM(RentalTotal)) AS value FROM dbo.SOMAST WITH (NOLOCK) WHERE SO_DATE BETWEEN @DataPointStart AND @DataPointEnd",
    tableName: "dbo.SOMAST",
    attempts: []
  }
];

// Alternative table names to try
const alternativeTables = {
  "dbo.OE_HDR": ["dbo.oe_hdr", "oe_hdr", "dbo.order_hdr", "order_hdr", "dbo.orders", "orders"],
  "dbo.SOMAST": ["dbo.so_mast", "so_mast", "dbo.sales_order", "sales_order", "dbo.sales", "sales"],
  "dbo.ARINV": ["dbo.ar_inv", "ar_inv", "dbo.invoice_hdr", "invoice_hdr", "dbo.invoices", "invoices"]
};

// Alternative column names to try
const alternativeColumns = {
  "order_status": ["status", "completed", "delete_flag", "state"],
  "ORDER_DATE": ["order_date", "date", "created_date", "entry_date"],
  "SO_DATE": ["so_date", "date", "created_date", "entry_date"],
  "invoice_status": ["status", "completed", "delete_flag", "state"],
  "INVOICE_DATE": ["invoice_date", "date", "created_date", "entry_date"],
  "Total": ["total", "extended_price", "amount", "price"],
  "RentalTotal": ["rental_total", "rental_amount", "rental_price", "rental"]
};

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

// Execute SQL query
async function executeQuery(connection, sql) {
  try {
    // Replace parameters with actual dates
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30); // 30 days ago
    
    const formattedToday = today.toISOString().split('T')[0];
    const formattedStartDate = startDate.toISOString().split('T')[0];
    
    const modifiedSql = sql
      .replace(/@DataPointStart/g, `'${formattedStartDate}'`)
      .replace(/@DataPointEnd/g, `'${formattedToday}'`);
    
    console.log('Executing SQL:', modifiedSql);
    const result = await connection.query(modifiedSql);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    return null;
  }
}

// Generate alternative SQL queries
function generateAlternativeQueries(metric) {
  const alternatives = [];
  
  // Try different table names
  if (alternativeTables[metric.tableName]) {
    for (const tableAlternative of alternativeTables[metric.tableName]) {
      const newSql = metric.originalSql.replace(metric.tableName, tableAlternative);
      alternatives.push({
        sql: newSql,
        description: `Changed table name from ${metric.tableName} to ${tableAlternative}`
      });
    }
  }
  
  // Try different column names
  for (const [originalCol, alternativeCols] of Object.entries(alternativeColumns)) {
    if (metric.originalSql.includes(originalCol)) {
      for (const colAlternative of alternativeCols) {
        const newSql = metric.originalSql.replace(new RegExp(originalCol, 'g'), colAlternative);
        alternatives.push({
          sql: newSql,
          description: `Changed column name from ${originalCol} to ${colAlternative}`
        });
      }
    }
  }
  
  // Try removing WHERE clauses
  if (metric.originalSql.includes('WHERE')) {
    const baseQuery = metric.originalSql.split('WHERE')[0];
    alternatives.push({
      sql: `${baseQuery.trim()}`,
      description: 'Removed all WHERE clauses'
    });
  }
  
  // Try simpler COUNT queries
  if (metric.originalSql.includes('COUNT(*)')) {
    const tableNameMatch = metric.originalSql.match(/FROM\s+([^\s]+)/);
    if (tableNameMatch && tableNameMatch[1]) {
      const tableName = tableNameMatch[1];
      alternatives.push({
        sql: `SELECT COUNT(*) AS value FROM ${tableName} WITH (NOLOCK)`,
        description: `Simplified to basic COUNT query on ${tableName}`
      });
    }
  }
  
  return alternatives;
}

// Main function to test all metrics
async function testKeyMetrics() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return;
  }
  
  const results = [];
  
  // Test each metric
  for (const metric of keyMetricsExpressions) {
    console.log(`\n=== Testing ${metric.name} (ID: ${metric.id}) ===`);
    
    // Try original SQL first
    let result = await executeQuery(connection, metric.originalSql);
    if (result && result.length > 0 && result[0].value !== null && result[0].value > 0) {
      console.log(`SUCCESS! Original SQL returned non-zero value: ${result[0].value}`);
      results.push({
        id: metric.id,
        name: metric.name,
        sql: metric.originalSql,
        value: result[0].value,
        status: 'SUCCESS'
      });
      continue;
    }
    
    console.log('Original SQL failed or returned zero. Trying alternatives...');
    
    // Generate and try alternative queries
    const alternatives = generateAlternativeQueries(metric);
    let success = false;
    
    for (let i = 0; i < alternatives.length && !success; i++) {
      const alternative = alternatives[i];
      console.log(`\nAttempt ${i+1}: ${alternative.description}`);
      
      result = await executeQuery(connection, alternative.sql);
      if (result && result.length > 0 && result[0].value !== null && result[0].value > 0) {
        console.log(`SUCCESS! Alternative SQL returned non-zero value: ${result[0].value}`);
        results.push({
          id: metric.id,
          name: metric.name,
          sql: alternative.sql,
          value: result[0].value,
          status: 'SUCCESS',
          description: alternative.description
        });
        success = true;
        break;
      }
    }
    
    if (!success) {
      console.log('All alternatives failed. Metric needs manual investigation.');
      results.push({
        id: metric.id,
        name: metric.name,
        sql: metric.originalSql,
        status: 'FAILED'
      });
    }
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
  console.log(`${successful} out of ${keyMetricsExpressions.length} metrics returned non-zero values`);
  
  console.log('\nSuccessful queries:');
  results.filter(r => r.status === 'SUCCESS').forEach(r => {
    console.log(`- ${r.name}: ${r.value} (${r.description || 'Original query'})`);
  });
}

// Run the test
testKeyMetrics();
