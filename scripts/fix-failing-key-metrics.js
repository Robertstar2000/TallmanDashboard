// Script to fix failing Key Metrics SQL expressions
const odbc = require('odbc');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Original and fixed Key Metrics SQL expressions
const keyMetrics = [
  {
    id: "117",
    name: "Total Orders",
    original: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))",
    fixed: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND order_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)"
  },
  {
    id: "118",
    name: "Open Orders (/day)",
    original: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND CONVERT(date, order_date) = CONVERT(date, GETDATE())",
    fixed: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND CAST(order_date AS DATE) = CAST(GETDATE() AS DATE)"
  },
  {
    id: "119",
    name: "All Open Orders",
    original: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'",
    fixed: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    id: "120",
    name: "Daily Revenue",
    original: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))",
    fixed: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CAST(h.order_date AS DATE) = CAST(DATEADD(day, -1, GETDATE()) AS DATE)"
  },
  {
    id: "121",
    name: "Open Invoices",
    original: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())",
    fixed: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  }
];

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

// Execute SQL query with proper error handling
async function executeQuery(connection, sql) {
  try {
    console.log('Executing SQL:', sql);
    const result = await connection.query(sql);
    return { error: null, result };
  } catch (error) {
    console.error('Error executing query:', error.message);
    return { error: error.message, result: null };
  }
}

// Test both original and fixed SQL expressions
async function testExpressions() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return null;
  }
  
  const results = [];
  
  // Test each expression
  for (const metric of keyMetrics) {
    console.log(`\n=== Testing ${metric.name} (ID: ${metric.id}) ===`);
    
    // Test original expression
    console.log('\nOriginal SQL:');
    const originalResult = await executeQuery(connection, metric.original);
    
    if (originalResult.error) {
      console.log(`Original SQL failed: ${originalResult.error}`);
    } else if (originalResult.result && originalResult.result.length > 0) {
      console.log(`Original SQL result: ${originalResult.result[0].value}`);
    } else {
      console.log('Original SQL returned no results');
    }
    
    // Test fixed expression
    console.log('\nFixed SQL:');
    const fixedResult = await executeQuery(connection, metric.fixed);
    
    if (fixedResult.error) {
      console.log(`Fixed SQL failed: ${fixedResult.error}`);
    } else if (fixedResult.result && fixedResult.result.length > 0) {
      console.log(`Fixed SQL result: ${fixedResult.result[0].value}`);
    } else {
      console.log('Fixed SQL returned no results');
    }
    
    // Determine which version to use
    let finalSql;
    let status;
    
    if (!originalResult.error && originalResult.result && originalResult.result.length > 0) {
      finalSql = metric.original;
      status = 'ORIGINAL';
    } else if (!fixedResult.error && fixedResult.result && fixedResult.result.length > 0) {
      finalSql = metric.fixed;
      status = 'FIXED';
    } else {
      finalSql = metric.original;
      status = 'FAILED';
    }
    
    results.push({
      id: metric.id,
      name: metric.name,
      sql: finalSql,
      status
    });
  }
  
  // Close connection
  await connection.close();
  
  return results;
}

// Update SQL expressions in the database
async function updateDatabase(results) {
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('\nConnected to the SQLite database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each Key Metric
    for (const result of results) {
      if (result.status === 'FIXED') {
        await db.run(`
          UPDATE chart_data 
          SET production_sql_expression = ? 
          WHERE id = ?
        `, [result.sql, result.id]);
        
        console.log(`Updated SQL expression for ${result.name} (ID: ${result.id})`);
      }
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Close the database connection
    await db.close();
    
    console.log('\nSuccessfully updated Key Metrics SQL expressions in the database');
  } catch (error) {
    console.error('Error updating database:', error);
  }
}

// Main function
async function main() {
  console.log('Testing and fixing Key Metrics SQL expressions...');
  
  // Test expressions
  const results = await testExpressions();
  
  if (!results) {
    console.error('Failed to test expressions. Exiting...');
    return;
  }
  
  // Print summary
  console.log('\n=== SUMMARY ===');
  
  for (const result of results) {
    console.log(`- ${result.name} (ID: ${result.id}): ${result.status}`);
  }
  
  // Update database
  console.log('\nUpdating database with fixed expressions...');
  await updateDatabase(results);
  
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Restart the application or click the "Load DB" button in the admin panel to see the changes');
}

// Run the main function
main();
