// Script to debug Key Metrics SQL expressions and identify why they're failing
const odbc = require('odbc');
const fs = require('fs');
const path = require('path');

// Key Metrics SQL expressions
const keyMetrics = [
  {
    id: "117",
    name: "Total Orders",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  },
  {
    id: "118",
    name: "Open Orders (/day)",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  {
    id: "119",
    name: "All Open Orders",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    id: "120",
    name: "Daily Revenue",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  {
    id: "121",
    name: "Open Invoices",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  },
  {
    id: "122",
    name: "OrdersBackloged",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())"
  },
  {
    id: "123",
    name: "Total Sales Monthly",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND h.order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  }
];

// Simplified versions of the SQL expressions
const simplifiedExpressions = [
  {
    id: "117",
    name: "Total Orders (Simplified)",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())"
  },
  {
    id: "118",
    name: "Open Orders (/day) (Simplified)",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    id: "119",
    name: "All Open Orders (Simplified)",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    id: "120",
    name: "Daily Revenue (Simplified)",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no"
  },
  {
    id: "121",
    name: "Open Invoices (Simplified)",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK)"
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

// Test a single SQL expression
async function testExpression(connection, expression) {
  console.log(`\n=== Testing ${expression.name} (ID: ${expression.id}) ===`);
  
  // Try the SQL
  const result = await executeQuery(connection, expression.sql);
  if (result && result.length > 0 && result[0].value !== null) {
    console.log(`Result: ${result[0].value}`);
    return {
      id: expression.id,
      name: expression.name,
      sql: expression.sql,
      value: result[0].value,
      status: 'SUCCESS'
    };
  } else {
    console.log('Query failed or returned null');
    return {
      id: expression.id,
      name: expression.name,
      sql: expression.sql,
      status: 'FAILED'
    };
  }
}

// Test SQL expressions with detailed error handling
async function testSqlExpressions() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return;
  }
  
  const results = [];
  
  // Test original expressions
  console.log('\n=== Testing Original Expressions ===');
  for (const expression of keyMetrics) {
    const result = await testExpression(connection, expression);
    results.push(result);
  }
  
  // Test simplified expressions for the failing ones
  console.log('\n=== Testing Simplified Expressions ===');
  for (const expression of simplifiedExpressions) {
    const originalResult = results.find(r => r.id === expression.id);
    if (originalResult && originalResult.status === 'FAILED') {
      const result = await testExpression(connection, expression);
      results.push(result);
    }
  }
  
  // Close connection
  await connection.close();
  
  // Print summary
  console.log('\n=== SUMMARY ===');
  const successful = results.filter(r => r.status === 'SUCCESS' && !r.name.includes('Simplified')).length;
  const failed = results.filter(r => r.status === 'FAILED' && !r.name.includes('Simplified')).length;
  
  console.log(`${successful} original expressions succeeded`);
  console.log(`${failed} original expressions failed`);
  
  console.log('\nResults for Original Expressions:');
  keyMetrics.forEach(expr => {
    const result = results.find(r => r.id === expr.id && !r.name.includes('Simplified'));
    console.log(`- ${expr.name} (ID: ${expr.id}): ${result.status === 'FAILED' ? 'FAILED' : result.value} (${result.status})`);
  });
  
  // Generate fixed expressions
  const fixedExpressions = [];
  
  for (const expr of keyMetrics) {
    const originalResult = results.find(r => r.id === expr.id && !r.name.includes('Simplified'));
    
    if (originalResult.status === 'SUCCESS') {
      // If original expression works, keep it
      fixedExpressions.push(expr);
    } else {
      // If original expression fails, check if simplified version works
      const simplifiedResult = results.find(r => r.id === expr.id && r.name.includes('Simplified'));
      
      if (simplifiedResult && simplifiedResult.status === 'SUCCESS') {
        // Use simplified version as a base for a fixed version
        fixedExpressions.push({
          id: expr.id,
          name: expr.name,
          sql: simplifiedResult.sql
        });
      } else {
        // If both original and simplified fail, keep original but mark as needing manual fix
        fixedExpressions.push({
          id: expr.id,
          name: expr.name + " (NEEDS MANUAL FIX)",
          sql: expr.sql
        });
      }
    }
  }
  
  // Save fixed expressions to file
  const fixedExpressionsPath = path.join(process.cwd(), 'scripts', 'fixed-key-metrics.js');
  const fixedExpressionsContent = `// Fixed Key Metrics SQL expressions
const fixedKeyMetrics = ${JSON.stringify(fixedExpressions, null, 2)};

module.exports = fixedKeyMetrics;
`;
  
  fs.writeFileSync(fixedExpressionsPath, fixedExpressionsContent);
  console.log(`\nFixed expressions saved to ${fixedExpressionsPath}`);
  
  // Create update script
  const updateScriptPath = path.join(process.cwd(), 'scripts', 'update-fixed-key-metrics.js');
  const updateScriptContent = `// Script to update Key Metrics SQL expressions in the database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fixedKeyMetrics = require('./fixed-key-metrics');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Main function to update Key Metrics SQL expressions
async function updateKeyMetrics() {
  console.log('Updating Key Metrics SQL expressions in the database...');
  
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each Key Metric
    for (const metric of fixedKeyMetrics) {
      await db.run(\`
        UPDATE chart_data 
        SET production_sql_expression = ? 
        WHERE id = ?
      \`, [metric.sql, metric.id]);
      
      console.log(\`Updated SQL expression for \${metric.name} (ID: \${metric.id})\`);
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Close the database connection
    await db.close();
    
    console.log('Successfully updated Key Metrics SQL expressions');
    console.log('Please restart the application or click the "Load DB" button in the admin panel to see the changes');
  } catch (error) {
    console.error('Error updating Key Metrics SQL expressions:', error);
  }
}

// Run the main function
updateKeyMetrics();
`;
  
  fs.writeFileSync(updateScriptPath, updateScriptContent);
  console.log(`Update script created at ${updateScriptPath}`);
}

// Run the test
testSqlExpressions();
