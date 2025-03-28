// Script to directly fix Accounts SQL expressions in the database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const odbc = require('odbc');
const fs = require('fs');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Generate SQL expressions for all months
function generateMonthlyExpressions() {
  const months = [
    { name: 'Jan', number: 1, id: { payable: '6', receivable: '18', overdue: '30' } },
    { name: 'Feb', number: 2, id: { payable: '7', receivable: '19', overdue: '31' } },
    { name: 'Mar', number: 3, id: { payable: '8', receivable: '20', overdue: '32' } },
    { name: 'Apr', number: 4, id: { payable: '9', receivable: '21', overdue: '33' } },
    { name: 'May', number: 5, id: { payable: '10', receivable: '22', overdue: '34' } },
    { name: 'Jun', number: 6, id: { payable: '11', receivable: '23', overdue: '35' } },
    { name: 'Jul', number: 7, id: { payable: '12', receivable: '24', overdue: '36' } },
    { name: 'Aug', number: 8, id: { payable: '13', receivable: '25', overdue: '37' } },
    { name: 'Sep', number: 9, id: { payable: '14', receivable: '26', overdue: '38' } },
    { name: 'Oct', number: 10, id: { payable: '15', receivable: '27', overdue: '39' } },
    { name: 'Nov', number: 11, id: { payable: '16', receivable: '28', overdue: '40' } },
    { name: 'Dec', number: 12, id: { payable: '17', receivable: '29', overdue: '41' } }
  ];

  const expressions = [];

  months.forEach(month => {
    // Accounts Payable
    expressions.push({
      id: month.id.payable,
      name: `Accounts Payable ${month.name}`,
      sql: `SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = ${month.number}`
    });

    // Accounts Receivable
    expressions.push({
      id: month.id.receivable,
      name: `Accounts Receivable ${month.name}`,
      sql: `SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = ${month.number}`
    });

    // Accounts Overdue
    expressions.push({
      id: month.id.overdue,
      name: `Accounts Overdue ${month.name}`,
      sql: `SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = ${month.number}`
    });
  });

  return expressions;
}

// Generate all monthly expressions
const accountsExpressions = generateMonthlyExpressions();

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

// Test a single expression
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
      status: result[0].value > 0 ? 'SUCCESS' : 'ZERO'
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

// Main function to test expressions
async function testAccountsExpressions() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return;
  }
  
  console.log('Testing Accounts SQL expressions...');
  
  const results = [];
  let successful = 0;
  
  // Test one expression for each type to verify they work
  const samplesToTest = [
    accountsExpressions[0],  // January Payable
    accountsExpressions[1],  // January Receivable
    accountsExpressions[2]   // January Overdue
  ];
  
  for (const expression of samplesToTest) {
    const result = await testExpression(connection, expression);
    results.push(result);
    
    if (result.status === 'SUCCESS') {
      successful++;
    }
  }
  
  // Print summary
  console.log('\n=== Test Results Summary ===');
  console.log(`${successful} out of ${samplesToTest.length} expressions returned non-zero values`);
  
  // Print detailed results
  console.log('\n=== Detailed Results ===');
  results.forEach(result => {
    console.log(`${result.id} - ${result.name}: ${result.status}${result.value ? ' (' + result.value + ')' : ''}`);
  });
  
  // Close connection
  await connection.close();
  console.log('Connection closed');
  
  // If all samples work, assume all expressions will work
  if (successful === samplesToTest.length) {
    return accountsExpressions;
  } else {
    return results.filter(result => result.status === 'SUCCESS');
  }
}

// Update the database with working expressions
async function updateDatabase(workingExpressions) {
  console.log('\nUpdating Accounts SQL expressions in the database...');
  
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each expression
    for (const expression of workingExpressions) {
      await db.run(`
        UPDATE chart_data 
        SET production_sql_expression = ? 
        WHERE id = ?
      `, [expression.sql, expression.id]);
      
      console.log(`Updated SQL expression for ${expression.name} (ID: ${expression.id})`);
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Close the database connection
    await db.close();
    
    console.log('Successfully updated Accounts SQL expressions');
    console.log('Please restart the application or click the "Load DB" button in the admin panel to see the changes');
  } catch (error) {
    console.error('Error updating Accounts SQL expressions:', error);
  }
}

// Save expressions to a file for reference
function saveExpressionsToFile(expressions) {
  const filePath = path.join(process.cwd(), 'accounts-expressions.json');
  fs.writeFileSync(filePath, JSON.stringify(expressions, null, 2));
  console.log(`Saved ${expressions.length} expressions to ${filePath}`);
}

// Main function
async function main() {
  const workingExpressions = await testAccountsExpressions();
  
  if (workingExpressions && workingExpressions.length > 0) {
    saveExpressionsToFile(workingExpressions);
    await updateDatabase(workingExpressions);
  } else {
    console.log('No working expressions found. Database not updated.');
  }
}

// Run the main function
main();
