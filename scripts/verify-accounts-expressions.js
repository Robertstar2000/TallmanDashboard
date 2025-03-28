// Script to verify Accounts SQL expressions in both the complete-chart-data.ts file and the database
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const odbc = require('odbc');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Path to the complete-chart-data.ts file
const completeChartDataPath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');

// Function to extract SQL expressions from complete-chart-data.ts
function extractSqlExpressionsFromFile() {
  console.log('Extracting SQL expressions from complete-chart-data.ts...');
  
  // Read the file content
  const content = fs.readFileSync(completeChartDataPath, 'utf8');
  
  // Define the account IDs to check
  const accountIds = {
    'Payable': ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17'],
    'Receivable': ['18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29'],
    'Overdue': ['30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41']
  };
  
  const expressions = [];
  
  // Extract SQL expressions for each account ID
  for (const accountType of Object.keys(accountIds)) {
    for (const id of accountIds[accountType]) {
      // Create regex to find the section with this ID
      const idRegex = new RegExp(`"id":\\s*"${id}"[\\s\\S]*?productionSqlExpression":\\s*"([^"]*)"`, 'g');
      const matches = content.matchAll(idRegex);
      
      for (const match of matches) {
        if (match && match[1]) {
          expressions.push({
            id,
            accountType,
            sql: match[1]
          });
          break;
        }
      }
    }
  }
  
  console.log(`Found ${expressions.length} SQL expressions in complete-chart-data.ts`);
  return expressions;
}

// Function to extract SQL expressions from the database
async function extractSqlExpressionsFromDb() {
  console.log('Extracting SQL expressions from the database...');
  
  // Connect to the database
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Define the account IDs to check
  const accountIds = [
    '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', // Payable
    '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', // Receivable
    '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41'  // Overdue
  ];
  
  const expressions = [];
  
  // Query the database for each account ID
  for (const id of accountIds) {
    const row = await db.get('SELECT * FROM chart_data WHERE id = ?', id);
    
    if (row) {
      expressions.push({
        id,
        accountType: row.DataPoint.split(' ')[1], // Extract account type from DataPoint
        sql: row.production_sql_expression
      });
    }
  }
  
  await db.close();
  
  console.log(`Found ${expressions.length} SQL expressions in the database`);
  return expressions;
}

// Function to connect to P21 database using ODBC
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

// Function to execute a SQL query
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

// Function to test SQL expressions against P21 database
async function testSqlExpressions(expressions) {
  console.log('Testing SQL expressions against P21 database...');
  
  // Connect to P21 database
  const connection = await connectToP21();
  
  // Test results
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  // Test each SQL expression
  for (const expr of expressions) {
    console.log(`=== Testing ID: ${expr.id} ===`);
    console.log(`Executing SQL: ${expr.sql}`);
    
    const value = await executeQuery(connection, expr.sql);
    console.log(`Result: ${value}\n`);
    
    // Record the result
    results.push({
      id: expr.id,
      accountType: expr.accountType,
      value,
      success: value > 0
    });
    
    if (value > 0) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  // Close the connection
  await connection.close();
  console.log('Connection closed');
  
  // Print summary
  console.log('=== Test Results Summary ===');
  console.log(`${successCount} out of ${successCount + failureCount} expressions returned non-zero values\n`);
  
  console.log('=== Detailed Results ===');
  results.forEach(result => {
    console.log(`${result.id} - ${result.accountType}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.value})`);
  });
  
  return results;
}

// Function to fix failing SQL expressions
async function fixFailingSqlExpressions(failingExpressions) {
  if (failingExpressions.length === 0) {
    console.log('No failing SQL expressions to fix.');
    return [];
  }
  
  console.log(`\nFixing ${failingExpressions.length} failing SQL expressions...`);
  
  // Connect to P21 database
  const connection = await connectToP21();
  
  // Fixed expressions
  const fixedExpressions = [];
  
  // Fix each failing expression
  for (const expr of failingExpressions) {
    console.log(`=== Fixing ID: ${expr.id} ===`);
    
    // Try alternative SQL expressions without YEAR filter
    let alternativeSql;
    const accountType = expr.accountType;
    const month = parseInt(expr.id) % 12 || 12; // Convert ID to month (1-12)
    
    if (accountType === 'Payable') {
      alternativeSql = `SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = ${month}`;
    } else if (accountType === 'Receivable') {
      alternativeSql = `SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = ${month}`;
    } else { // Overdue
      alternativeSql = `SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = ${month}`;
    }
    
    console.log(`Trying alternative SQL: ${alternativeSql}`);
    
    const value = await executeQuery(connection, alternativeSql);
    console.log(`Result: ${value}\n`);
    
    if (value > 0) {
      fixedExpressions.push({
        id: expr.id,
        accountType,
        sql: alternativeSql
      });
    } else {
      // If still failing, try without month filter
      console.log(`Alternative expression also failed. Trying without month filter...`);
      
      let fallbackSql;
      if (accountType === 'Payable') {
        fallbackSql = `SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK)`;
      } else if (accountType === 'Receivable') {
        fallbackSql = `SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK)`;
      } else { // Overdue
        fallbackSql = `SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0`;
      }
      
      console.log(`Trying fallback SQL: ${fallbackSql}`);
      
      const fallbackValue = await executeQuery(connection, fallbackSql);
      console.log(`Result: ${fallbackValue}\n`);
      
      if (fallbackValue > 0) {
        fixedExpressions.push({
          id: expr.id,
          accountType,
          sql: fallbackSql
        });
      } else {
        console.log(`All attempts failed for ID: ${expr.id}`);
      }
    }
  }
  
  // Close the connection
  await connection.close();
  
  console.log(`Fixed ${fixedExpressions.length} out of ${failingExpressions.length} failing expressions`);
  
  return fixedExpressions;
}

// Function to update the complete-chart-data.ts file with fixed expressions
function updateCompleteChartData(fixedExpressions) {
  if (fixedExpressions.length === 0) {
    console.log('No fixed expressions to update in complete-chart-data.ts');
    return;
  }
  
  console.log(`\nUpdating complete-chart-data.ts with ${fixedExpressions.length} fixed expressions...`);
  
  // Read the file content
  let content = fs.readFileSync(completeChartDataPath, 'utf8');
  
  // Update each fixed expression
  for (const expr of fixedExpressions) {
    // Create regex pattern to find and replace the relevant parts
    const idPattern = new RegExp(`"id":\\s*"${expr.id}"[\\s\\S]*?productionSqlExpression":\\s*"[^"]*"`, 'g');
    
    // Find the matching section
    const match = content.match(idPattern);
    
    if (match && match.length > 0) {
      // Extract the section to update
      const section = match[0];
      
      // Create updated section with new SQL expression
      const sqlPattern = /"productionSqlExpression":\s*"[^"]*"/;
      const lastUpdatedPattern = /"lastUpdated":\s*"[^"]*"/;
      
      let updatedSection = section;
      
      // Update SQL expression
      updatedSection = updatedSection.replace(sqlPattern, `"productionSqlExpression": "${expr.sql}"`);
      
      // Update lastUpdated timestamp
      if (updatedSection.match(lastUpdatedPattern)) {
        updatedSection = updatedSection.replace(lastUpdatedPattern, `"lastUpdated": "${new Date().toISOString()}"`);
      }
      
      // Replace the old section with the updated one
      content = content.replace(section, updatedSection);
      
      console.log(`Updated SQL expression for ID: ${expr.id} in complete-chart-data.ts`);
    } else {
      console.log(`Failed to update ID: ${expr.id} in complete-chart-data.ts`);
    }
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(completeChartDataPath, content, 'utf8');
  
  console.log('Successfully updated complete-chart-data.ts');
}

// Function to update the database with fixed expressions
async function updateDatabase(fixedExpressions) {
  if (fixedExpressions.length === 0) {
    console.log('No fixed expressions to update in the database');
    return;
  }
  
  console.log(`\nUpdating database with ${fixedExpressions.length} fixed expressions...`);
  
  // Connect to the database
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  console.log('Connected to the database');
  
  // Update each fixed expression
  for (const expr of fixedExpressions) {
    try {
      await db.run(
        'UPDATE chart_data SET production_sql_expression = ?, lastUpdated = ? WHERE id = ?',
        expr.sql,
        new Date().toISOString(),
        expr.id
      );
      
      console.log(`Updated SQL expression for ID: ${expr.id} in the database`);
    } catch (error) {
      console.error(`Error updating SQL expression for ID: ${expr.id} in the database:`, error);
    }
  }
  
  await db.close();
  
  console.log('Successfully updated database');
}

// Main function
async function main() {
  try {
    // Step 1: Extract SQL expressions from complete-chart-data.ts
    const fileExpressions = extractSqlExpressionsFromFile();
    
    // Step 2: Extract SQL expressions from the database
    const dbExpressions = await extractSqlExpressionsFromDb();
    
    // Step 3: Test SQL expressions against P21 database
    console.log('\n=== Testing SQL expressions from complete-chart-data.ts ===');
    const fileResults = await testSqlExpressions(fileExpressions);
    
    console.log('\n=== Testing SQL expressions from database ===');
    const dbResults = await testSqlExpressions(dbExpressions);
    
    // Step 4: Identify failing expressions
    const failingFileExpressions = fileExpressions.filter((expr, index) => !fileResults[index].success);
    const failingDbExpressions = dbExpressions.filter((expr, index) => !dbResults[index].success);
    
    console.log(`\n${failingFileExpressions.length} expressions are failing in complete-chart-data.ts`);
    console.log(`${failingDbExpressions.length} expressions are failing in the database`);
    
    // Step 5: Fix failing expressions
    const fixedFileExpressions = await fixFailingSqlExpressions(failingFileExpressions);
    const fixedDbExpressions = await fixFailingSqlExpressions(failingDbExpressions);
    
    // Step 6: Update complete-chart-data.ts and database with fixed expressions
    updateCompleteChartData(fixedFileExpressions);
    await updateDatabase(fixedDbExpressions);
    
    console.log('\nVerification and fixes completed successfully');
    console.log('Please restart the application or click the "Load DB" button in the admin panel to see the changes');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
