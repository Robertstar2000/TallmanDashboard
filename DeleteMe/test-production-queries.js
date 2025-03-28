const odbc = require('odbc');
const fs = require('fs');
const path = require('path');

// Extract the production SQL expressions from initial-data.ts
const keyMetrics = [
  {
    id: '1',
    name: "Total Orders",
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())`
  },
  {
    id: '2',
    name: "Open Orders",
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N'`
  },
  {
    id: '3',
    name: "Open Orders 2",
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'`
  },
  {
    id: '4',
    name: "Daily Revenue",
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`
  },
  {
    id: '5',
    name: "Open Invoices",
    sql: `SELECT COUNT(*) as value FROM invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())`
  },
  {
    id: '6',
    name: "Orders Backlogged",
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())`
  },
  {
    id: '7',
    name: "Total Monthly Sales",
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())`
  }
];

// Function to test the execution of a query
async function testQuery(connection, query) {
  console.log(`\n=== Testing ${query.name} ===`);
  console.log(query.sql);
  
  try {
    // First, check if the query syntax is valid by preparing it
    console.log('Preparing query...');
    const stmt = await connection.createStatement();
    await stmt.prepare(query.sql);
    console.log('✅ Query syntax is valid');
    await stmt.close();
    
    // Then execute the query
    console.log('Executing query...');
    const result = await connection.query(query.sql);
    const value = result[0]?.value;
    console.log(`✅ Query executed successfully!`);
    console.log(`Result: ${value}`);
    console.log(`Non-zero? ${value > 0 ? 'YES' : 'NO'}`);
    return { success: true, value };
  } catch (error) {
    console.error(`❌ Query failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to check database schema
async function checkSchema(connection) {
  console.log('\n=== Checking Database Schema ===');
  
  // Tables to check
  const tables = [
    { name: 'oe_hdr', columns: ['order_no', 'order_date', 'completed'] },
    { name: 'oe_line', columns: ['order_no', 'extended_price'] },
    { name: 'invoice_hdr', columns: ['invoice_date'] }
  ];
  
  for (const table of tables) {
    console.log(`\nChecking table: ${table.name}`);
    
    try {
      // Check if table exists by trying to select from it
      const tableQuery = `SELECT TOP 1 * FROM ${table.name} WITH (NOLOCK)`;
      try {
        const tableResult = await connection.query(tableQuery);
        console.log(`✅ Table ${table.name} exists`);
        
        // Check column names
        const columns = Object.keys(tableResult[0] || {});
        console.log(`Columns found: ${columns.join(', ')}`);
        
        // Check if required columns exist
        for (const column of table.columns) {
          if (columns.includes(column)) {
            console.log(`✅ Column ${column} exists`);
          } else {
            console.log(`❌ Column ${column} NOT found`);
          }
        }
      } catch (error) {
        console.error(`❌ Table ${table.name} check failed: ${error.message}`);
      }
      
      // Check row count
      const countQuery = `SELECT COUNT(*) as count FROM ${table.name} WITH (NOLOCK)`;
      try {
        const countResult = await connection.query(countQuery);
        const count = countResult[0]?.count;
        console.log(`Row count: ${count}`);
      } catch (error) {
        console.error(`❌ Row count check failed: ${error.message}`);
      }
    } catch (error) {
      console.error(`❌ Schema check failed for ${table.name}: ${error.message}`);
    }
  }
}

// Function to check the actual SQL being executed in the dashboard
async function checkAdminImplementation() {
  console.log('\n=== Checking Admin Implementation ===');
  
  // Look for the file that handles SQL execution in the dashboard
  const files = [
    'lib/db/ConnectionManager.ts',
    'lib/db/ConnectionManager.js',
    'pages/api/executeQuery.ts',
    'pages/api/executeQuery.js',
    'app/api/executeQuery/route.ts',
    'app/api/executeQuery/route.js'
  ];
  
  let implementationFound = false;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`Found implementation file: ${file}`);
      implementationFound = true;
      
      // Read the file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for potential issues
      const issues = [];
      
      if (content.includes('P21.dbo.')) {
        issues.push('SQL queries include schema prefix "P21.dbo." which might not match our direct queries');
      }
      
      if (content.includes('generateProductionSql')) {
        issues.push('SQL transformation is happening at runtime, which might modify our queries');
      }
      
      if (issues.length > 0) {
        console.log('Potential issues found:');
        issues.forEach(issue => console.log(`- ${issue}`));
      } else {
        console.log('No obvious issues found in implementation');
      }
    }
  }
  
  if (!implementationFound) {
    console.log('❌ Could not find SQL execution implementation files');
  }
}

// Main function
async function main() {
  console.log('=== Testing Production SQL Queries ===');
  console.log('Starting at', new Date().toISOString());
  
  // Create output file
  const outputFilePath = path.join(__dirname, 'production-queries-results.txt');
  const outputStream = fs.createWriteStream(outputFilePath);
  
  outputStream.write('=== Testing Production SQL Queries ===\n');
  outputStream.write(`Starting at ${new Date().toISOString()}\n`);
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    outputStream.write(`Connection string: ${connectionString}\n`);
    
    console.log('Connecting to ODBC data source...');
    outputStream.write('Connecting to ODBC data source...\n');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    outputStream.write('✅ CONNECTED SUCCESSFULLY to ODBC data source!\n');
    
    // Check database schema
    await checkSchema(connection);
    
    // Test each query
    const results = [];
    
    for (const query of keyMetrics) {
      const result = await testQuery(connection, query);
      
      // Also write to file
      outputStream.write(`\n=== Testing ${query.name} ===\n`);
      outputStream.write(`${query.sql}\n`);
      
      if (result.success) {
        outputStream.write(`✅ Query executed successfully!\n`);
        outputStream.write(`Result: ${result.value}\n`);
        outputStream.write(`Non-zero? ${result.value > 0 ? 'YES' : 'NO'}\n`);
        
        results.push({
          name: query.name,
          sql: query.sql,
          value: result.value,
          success: true
        });
      } else {
        outputStream.write(`❌ Query failed: ${result.error}\n`);
      }
    }
    
    // Check admin implementation
    await checkAdminImplementation();
    
    // Print summary of successful queries
    console.log('\n=== SUMMARY OF SUCCESSFUL QUERIES ===');
    outputStream.write('\n=== SUMMARY OF SUCCESSFUL QUERIES ===\n');
    
    const successfulQueries = results.filter(r => r.success && r.value > 0);
    
    if (successfulQueries.length > 0) {
      for (const query of successfulQueries) {
        console.log(`${query.name} (Value: ${query.value}):`);
        console.log(query.sql);
        
        outputStream.write(`${query.name} (Value: ${query.value}):\n`);
        outputStream.write(`${query.sql}\n\n`);
      }
    } else {
      console.log('No successful queries found.');
      outputStream.write('No successful queries found.\n');
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    outputStream.write('\n✅ Connection closed successfully\n');
    
    // Close the output stream
    outputStream.end();
    console.log(`Results written to ${outputFilePath}`);
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    outputStream.write(`\n❌ CRITICAL ERROR: ${error.message}\n`);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
      outputStream.write(`Stack trace: ${error.stack}\n`);
    }
    outputStream.end();
  }
  
  console.log('\n=== Completed at', new Date().toISOString(), '===');
}

// Run the script
main()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
