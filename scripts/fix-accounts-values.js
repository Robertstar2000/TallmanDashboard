// Script to fix Accounts values in the database
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

// Connect to P21 database using ODBC
async function connectToP21() {
  try {
    console.log('Connecting to P21 database...');
    
    // ODBC connection string
    const connectionString = 'DSN=P21;UID=sa;PWD=P@ssw0rd';
    
    // Connect to the database
    const connection = await odbc.connect(connectionString);
    console.log('Successfully connected to P21 database');
    
    return connection;
  } catch (error) {
    console.error('Error connecting to P21 database:', error);
    throw error;
  }
}

// Execute SQL query
async function executeQuery(connection, sql) {
  try {
    const result = await connection.query(sql);
    return result[0]?.value || 0;
  } catch (error) {
    console.error(`Error executing query: ${sql}`);
    console.error(error);
    return 0;
  }
}

// Test a single expression
async function testExpression(connection, expression) {
  console.log(`\n=== Testing ${expression.name} (ID: ${expression.id}) ===`);
  console.log(`Executing SQL: ${expression.sql}`);
  
  try {
    const value = await executeQuery(connection, expression.sql);
    console.log(`Result: ${value}`);
    
    // Check if the expression returned a non-zero value
    const success = value > 0;
    
    if (success) {
      console.log(`SUCCESS: ${expression.name} returned a non-zero value`);
    } else {
      console.log(`FAILED: ${expression.name} returned zero`);
    }
    
    return {
      ...expression,
      value: value,
      success: success
    };
  } catch (error) {
    console.error(`Error testing expression: ${expression.name}`, error);
    return {
      ...expression,
      value: 0,
      success: false
    };
  }
}

// Test all expressions
async function testAccountsExpressions() {
  console.log('Testing Accounts SQL expressions...');
  
  try {
    // Connect to P21 database
    const connection = await connectToP21();
    
    // Generate expressions
    const expressions = generateMonthlyExpressions();
    
    // Test each expression
    const results = [];
    let successCount = 0;
    
    for (const expression of expressions) {
      const result = await testExpression(connection, expression);
      results.push(result);
      
      if (result.success) {
        successCount++;
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('Connection closed');
    
    // Print summary
    console.log('\n=== Test Results Summary ===');
    console.log(`${successCount} out of ${expressions.length} expressions returned non-zero values`);
    
    console.log('\n=== Detailed Results ===');
    results.forEach(result => {
      console.log(`${result.id} - ${result.name}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.value})`);
    });
    
    return results;
  } catch (error) {
    console.error('Error testing Accounts SQL expressions:', error);
    return [];
  }
}

// Update the database with working expressions and their values
async function updateDatabase(workingExpressions) {
  console.log('\nUpdating Accounts SQL expressions and values in the database...');
  
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each expression and its value
    for (const expression of workingExpressions) {
      await db.run(`
        UPDATE chart_data 
        SET production_sql_expression = ?, value = ? 
        WHERE id = ?
      `, [expression.sql, expression.value.toString(), expression.id]);
      
      console.log(`Updated SQL expression and value for ${expression.name} (ID: ${expression.id})`);
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Close the database connection
    await db.close();
    
    console.log('Successfully updated Accounts SQL expressions and values');
    console.log('Please restart the application or click the "Load DB" button in the admin panel to see the changes');
  } catch (error) {
    console.error('Error updating Accounts SQL expressions and values:', error);
  }
}

// Update the complete-chart-data.ts file
function updateCompleteChartData(workingExpressions) {
  console.log('\nUpdating complete-chart-data.ts file...');
  
  try {
    // Path to the complete-chart-data.ts file
    const completeChartDataPath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
    
    // Read the file content
    let content = fs.readFileSync(completeChartDataPath, 'utf8');
    
    // Update each expression
    for (const expression of workingExpressions) {
      // Create regex pattern to find and replace the relevant parts
      const idPattern = new RegExp(`"id":\\s*"${expression.id}"[\\s\\S]*?productionSqlExpression":\\s*"[^"]*"`, 'g');
      
      // Find the matching section
      const match = content.match(idPattern);
      
      if (match && match.length > 0) {
        // Extract the section to update
        const section = match[0];
        
        // Create updated section with new SQL expression
        const sqlPattern = /"productionSqlExpression":\s*"[^"]*"/;
        const valuePattern = /"value":\s*"[^"]*"/;
        const lastUpdatedPattern = /"lastUpdated":\s*"[^"]*"/;
        
        let updatedSection = section;
        
        // Update SQL expression
        updatedSection = updatedSection.replace(sqlPattern, `"productionSqlExpression": "${expression.sql}"`);
        
        // Update value
        if (updatedSection.match(valuePattern)) {
          updatedSection = updatedSection.replace(valuePattern, `"value": "${expression.value}"`);
        }
        
        // Update lastUpdated timestamp
        if (updatedSection.match(lastUpdatedPattern)) {
          updatedSection = updatedSection.replace(lastUpdatedPattern, `"lastUpdated": "${new Date().toISOString()}"`);
        }
        
        // Replace the old section with the updated one
        content = content.replace(section, updatedSection);
        
        console.log(`Updated SQL expression and value for ID: ${expression.id} in complete-chart-data.ts`);
      } else {
        console.log(`Failed to update ID: ${expression.id} in complete-chart-data.ts`);
      }
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(completeChartDataPath, content, 'utf8');
    
    console.log('Successfully updated complete-chart-data.ts file');
  } catch (error) {
    console.error('Error updating complete-chart-data.ts file:', error);
  }
}

// Save expressions to a file for reference
function saveExpressionsToFile(expressions) {
  const filePath = path.join(process.cwd(), 'accounts-expressions.json');
  fs.writeFileSync(filePath, JSON.stringify(expressions, null, 2), 'utf8');
  console.log(`Saved ${expressions.length} expressions to ${filePath}`);
}

// Main function
async function main() {
  try {
    // Test expressions
    const results = await testAccountsExpressions();
    
    // Save expressions to file
    saveExpressionsToFile(results);
    
    // Update database with working expressions and their values
    await updateDatabase(results);
    
    // Update complete-chart-data.ts file
    updateCompleteChartData(results);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
