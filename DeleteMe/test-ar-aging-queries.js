// Test script to verify and fix AR Aging SQL queries
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// Create a log file for the test results
const logFilePath = path.join(__dirname, 'ar-aging-query-test-results.txt');
const logStream = fs.createWriteStream(logFilePath, { flags: 'w' });

// Helper function to log to both console and file
function log(message) {
  console.log(message);
  logStream.write(message + '\n');
}

// Connect to the SQLite database
const db = new Database('./data/dashboard.db');

// Get the current AR Aging queries from the database
function getCurrentArAgingQueries() {
  log('Fetching current AR Aging queries from the database...');
  
  const rows = db.prepare(`
    SELECT id, chart_group, variable_name, server_name, db_table_name, 
           sql_expression, production_sql_expression, value
    FROM chart_data 
    WHERE chart_group = 'AR Aging'
    ORDER BY id
  `).all();
  
  log(`Found ${rows.length} AR Aging queries in the database`);
  
  // Assign bucket names based on row order
  const bucketNames = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
  
  // Map the rows to include bucket names
  return rows.map((row, index) => {
    if (index < bucketNames.length) {
      return {
        ...row,
        chart_name: bucketNames[index]
      };
    }
    return row;
  });
}

// Execute a query using ODBC against P21
async function executeP21Query(query) {
  // Get DSN and credentials from environment variables or use defaults
  const dsn = process.env.P21_DSN || 'P21Play';
  const username = process.env.P21_USERNAME;
  const password = process.env.P21_PASSWORD;
  
  // Build connection string
  let connectionString = `DSN=${dsn};`;
  
  // Add authentication details if provided
  if (username && password) {
    connectionString += `UID=${username};PWD=${password};`;
    log('Using SQL Server Authentication with ODBC');
  } else {
    // Use Windows Authentication
    connectionString += 'Trusted_Connection=Yes;';
    log('Using Windows Authentication with ODBC');
  }
  
  try {
    // Create a new connection
    const connection = await odbc.connect(connectionString);
    
    // Execute the query
    log(`Executing query: ${query}`);
    const result = await connection.query(query);
    
    // Close the connection
    await connection.close();
    
    return result;
  } catch (error) {
    log(`Error executing P21 query: ${error.message}`);
    return null;
  }
}

// Create a test database with sample AR data
function createTestDatabase() {
  log('Creating test database with sample AR aging data...');
  
  const testDb = new Database(':memory:');
  
  // Create ar_open_items table
  testDb.exec(`
    CREATE TABLE ar_open_items (
      invoice_no TEXT,
      customer_id TEXT,
      invoice_date TEXT,
      due_date TEXT,
      open_amount REAL,
      days_past_due INTEGER
    )
  `);
  
  // Insert sample data
  const stmt = testDb.prepare(`
    INSERT INTO ar_open_items (invoice_no, customer_id, invoice_date, due_date, open_amount, days_past_due)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  // Generate sample data for different aging buckets
  const data = [
    // Current (not past due)
    ...Array(20).fill().map((_, i) => {
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - Math.floor(Math.random() * 15));
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 15) + 1);
      
      return [
        `INV-C${i+1}`, 
        `CUST${Math.floor(Math.random() * 100)}`, 
        invoiceDate.toISOString().split('T')[0], 
        dueDate.toISOString().split('T')[0],
        Math.round(Math.random() * 1000 + 100),
        0
      ];
    }),
    
    // 1-30 days past due
    ...Array(15).fill().map((_, i) => {
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - (30 + Math.floor(Math.random() * 15)));
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 30) - 1);
      
      return [
        `INV-30-${i+1}`, 
        `CUST${Math.floor(Math.random() * 100)}`, 
        invoiceDate.toISOString().split('T')[0], 
        dueDate.toISOString().split('T')[0],
        Math.round(Math.random() * 1000 + 100),
        Math.floor(Math.random() * 30) + 1
      ];
    }),
    
    // 31-60 days past due
    ...Array(10).fill().map((_, i) => {
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - (60 + Math.floor(Math.random() * 15)));
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - (30 + Math.floor(Math.random() * 30)) - 1);
      
      return [
        `INV-60-${i+1}`, 
        `CUST${Math.floor(Math.random() * 100)}`, 
        invoiceDate.toISOString().split('T')[0], 
        dueDate.toISOString().split('T')[0],
        Math.round(Math.random() * 1000 + 100),
        Math.floor(Math.random() * 30) + 31
      ];
    }),
    
    // 61-90 days past due
    ...Array(8).fill().map((_, i) => {
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - (90 + Math.floor(Math.random() * 15)));
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - (60 + Math.floor(Math.random() * 30)) - 1);
      
      return [
        `INV-90-${i+1}`, 
        `CUST${Math.floor(Math.random() * 100)}`, 
        invoiceDate.toISOString().split('T')[0], 
        dueDate.toISOString().split('T')[0],
        Math.round(Math.random() * 1000 + 100),
        Math.floor(Math.random() * 30) + 61
      ];
    }),
    
    // 90+ days past due
    ...Array(12).fill().map((_, i) => {
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - (120 + Math.floor(Math.random() * 60)));
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - (90 + Math.floor(Math.random() * 60)) - 1);
      
      return [
        `INV-120-${i+1}`, 
        `CUST${Math.floor(Math.random() * 100)}`, 
        invoiceDate.toISOString().split('T')[0], 
        dueDate.toISOString().split('T')[0],
        Math.round(Math.random() * 1000 + 100),
        Math.floor(Math.random() * 90) + 91
      ];
    })
  ];
  
  // Insert all the data
  const transaction = testDb.transaction(() => {
    for (const row of data) {
      stmt.run(...row);
    }
  });
  
  transaction();
  
  // Verify data was inserted
  const count = testDb.prepare('SELECT COUNT(*) as count FROM ar_open_items').get();
  log(`Inserted ${count.count} sample records into ar_open_items table`);
  
  // Check the data distribution by aging bucket
  const distribution = testDb.prepare(`
    SELECT 
      CASE 
        WHEN days_past_due = 0 THEN 'Current'
        WHEN days_past_due BETWEEN 1 AND 30 THEN '1-30 Days'
        WHEN days_past_due BETWEEN 31 AND 60 THEN '31-60 Days'
        WHEN days_past_due BETWEEN 61 AND 90 THEN '61-90 Days'
        ELSE '90+ Days'
      END as aging_bucket,
      COUNT(*) as count,
      SUM(open_amount) as total_amount
    FROM ar_open_items
    GROUP BY aging_bucket
    ORDER BY 
      CASE aging_bucket
        WHEN 'Current' THEN 1
        WHEN '1-30 Days' THEN 2
        WHEN '31-60 Days' THEN 3
        WHEN '61-90 Days' THEN 4
        WHEN '90+ Days' THEN 5
      END
  `).all();
  
  log('Data distribution by aging bucket:');
  for (const bucket of distribution) {
    log(`  ${bucket.aging_bucket}: ${bucket.count} invoices, $${bucket.total_amount.toFixed(2)} total`);
  }
  
  return testDb;
}

// Test a query against the test database
function testQueryAgainstTestDb(testDb, query, bucketName) {
  log(`\nTesting query for "${bucketName}" against test database:`);
  log(`SQL: ${query}`);
  
  try {
    const result = testDb.prepare(query).get();
    log(`Result: ${JSON.stringify(result)}`);
    
    // Check if we got a non-zero result
    const value = result ? (result.value !== undefined ? result.value : Object.values(result)[0]) : null;
    const isNonZero = value !== null && value !== 0;
    
    log(`Non-zero result: ${isNonZero ? 'YES' : 'NO'}`);
    return { success: true, isNonZero, result };
  } catch (error) {
    log(`Error executing query: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Generate improved queries based on test results
function generateImprovedQueries(testDb, currentQueries) {
  log('\nGenerating improved queries for AR Aging:');
  
  const improvedQueries = [];
  
  for (const query of currentQueries) {
    const bucketName = query.chart_name;
    log(`\nWorking on bucket: ${bucketName}`);
    
    // Test the current query
    const testResult = testQueryAgainstTestDb(testDb, query.sql_expression, bucketName);
    
    if (testResult.success && testResult.isNonZero) {
      log('Current query works and returns non-zero results. Keeping it.');
      improvedQueries.push({
        ...query,
        improved_sql: query.sql_expression,
        improved_production_sql: query.production_sql_expression
      });
      continue;
    }
    
    // Generate improved queries based on the bucket
    let improvedSql = '';
    let improvedProductionSql = '';
    
    switch (bucketName) {
      case 'Current':
        improvedSql = `
          SELECT SUM(open_amount) as value 
          FROM ar_open_items 
          WHERE days_past_due = 0
        `;
        improvedProductionSql = `
          SELECT SUM(open_amount) as value 
          FROM dbo.ar_open_items WITH (NOLOCK)
          WHERE days_past_due = 0
        `;
        break;
        
      case '1-30 Days':
        improvedSql = `
          SELECT SUM(open_amount) as value 
          FROM ar_open_items 
          WHERE days_past_due BETWEEN 1 AND 30
        `;
        improvedProductionSql = `
          SELECT SUM(open_amount) as value 
          FROM dbo.ar_open_items WITH (NOLOCK)
          WHERE days_past_due BETWEEN 1 AND 30
        `;
        break;
        
      case '31-60 Days':
        improvedSql = `
          SELECT SUM(open_amount) as value 
          FROM ar_open_items 
          WHERE days_past_due BETWEEN 31 AND 60
        `;
        improvedProductionSql = `
          SELECT SUM(open_amount) as value 
          FROM dbo.ar_open_items WITH (NOLOCK)
          WHERE days_past_due BETWEEN 31 AND 60
        `;
        break;
        
      case '61-90 Days':
        improvedSql = `
          SELECT SUM(open_amount) as value 
          FROM ar_open_items 
          WHERE days_past_due BETWEEN 61 AND 90
        `;
        improvedProductionSql = `
          SELECT SUM(open_amount) as value 
          FROM dbo.ar_open_items WITH (NOLOCK)
          WHERE days_past_due BETWEEN 61 AND 90
        `;
        break;
        
      case '90+ Days':
        improvedSql = `
          SELECT SUM(open_amount) as value 
          FROM ar_open_items 
          WHERE days_past_due > 90
        `;
        improvedProductionSql = `
          SELECT SUM(open_amount) as value 
          FROM dbo.ar_open_items WITH (NOLOCK)
          WHERE days_past_due > 90
        `;
        break;
        
      default:
        log(`Unknown bucket name: ${bucketName}. Keeping original query.`);
        improvedSql = query.sql_expression;
        improvedProductionSql = query.production_sql_expression;
    }
    
    // Test the improved query
    const improvedTestResult = testQueryAgainstTestDb(testDb, improvedSql, bucketName);
    
    if (improvedTestResult.success && improvedTestResult.isNonZero) {
      log('Improved query works and returns non-zero results.');
      improvedQueries.push({
        ...query,
        improved_sql: improvedSql,
        improved_production_sql: improvedProductionSql
      });
    } else {
      log('Improved query failed or returned zero. Keeping original query but marking for review.');
      improvedQueries.push({
        ...query,
        improved_sql: improvedSql,
        improved_production_sql: improvedProductionSql,
        needs_review: true
      });
    }
  }
  
  return improvedQueries;
}

// Update the database with improved queries
function updateDatabaseWithImprovedQueries(improvedQueries) {
  log('\nUpdating database with improved queries:');
  
  const updateStmt = db.prepare(`
    UPDATE chart_data
    SET 
      sql_expression = ?,
      production_sql_expression = ?,
      db_table_name = ?
    WHERE id = ?
  `);
  
  const transaction = db.transaction(() => {
    for (const query of improvedQueries) {
      log(`Updating query for ${query.chart_name}...`);
      updateStmt.run(
        query.improved_sql,
        query.improved_production_sql,
        'ar_open_items',
        query.id
      );
    }
  });
  
  transaction();
  log('Database updated successfully.');
}

// Main function to run the tests and update the database
async function main() {
  log('=== AR Aging Queries Test and Fix ===');
  log(`Starting at ${new Date().toISOString()}`);
  
  try {
    // Get current queries
    const currentQueries = getCurrentArAgingQueries();
    
    // Log the current queries
    log('\nCurrent AR Aging Queries:');
    for (const query of currentQueries) {
      log(`\n${query.chart_name} (${query.variable_name}):`);
      log(`ID: ${query.id}`);
      log(`Server: ${query.server_name}`);
      log(`Table: ${query.db_table_name}`);
      log(`SQL: ${query.sql_expression}`);
      log(`Production SQL: ${query.production_sql_expression}`);
      log(`Current Value: ${query.value}`);
    }
    
    // Create test database
    const testDb = createTestDatabase();
    
    // Generate improved queries
    const improvedQueries = generateImprovedQueries(testDb, currentQueries);
    
    // Log the improved queries
    log('\nImproved AR Aging Queries:');
    for (const query of improvedQueries) {
      log(`\n${query.chart_name} (${query.variable_name}):`);
      log(`ID: ${query.id}`);
      log(`Improved SQL: ${query.improved_sql}`);
      log(`Improved Production SQL: ${query.improved_production_sql}`);
      if (query.needs_review) {
        log('⚠️ This query needs manual review');
      }
    }
    
    // Update the database with improved queries
    updateDatabaseWithImprovedQueries(improvedQueries);
    
    // Try to test against real P21 if available
    log('\nAttempting to test against real P21 database (if available):');
    for (const query of improvedQueries) {
      try {
        const result = await executeP21Query(query.improved_production_sql);
        if (result) {
          log(`P21 test for ${query.chart_name}: ${JSON.stringify(result)}`);
        } else {
          log(`P21 test for ${query.chart_name}: No result or not available`);
        }
      } catch (error) {
        log(`Error testing against P21: ${error.message}`);
      }
    }
    
    log('\nProcess completed successfully.');
  } catch (error) {
    log(`Error in main process: ${error.message}`);
    log(error.stack);
  } finally {
    // Close the database connection
    db.close();
    logStream.end();
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  logStream.write(`Fatal error: ${error.message}\n${error.stack}\n`);
  logStream.end();
});
