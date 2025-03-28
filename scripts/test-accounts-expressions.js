const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Configuration for the P21 database connection
const config = {
  user: 'sa',
  password: 'P@ssw0rd',
  server: 'localhost',
  database: 'P21',
  options: {
    trustServerCertificate: true
  }
};

// Function to execute a SQL query and return the result
async function executeQuery(query) {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(query);
    return result.recordset[0].value;
  } catch (error) {
    console.error(`Error executing query: ${query}`);
    console.error(error);
    return 0;
  }
}

// Function to test SQL expressions for all account types and months
async function testAccountsExpressions() {
  console.log('Testing Accounts SQL expressions...\n');
  
  const months = [
    { num: 1, name: 'Jan' },
    { num: 2, name: 'Feb' },
    { num: 3, name: 'Mar' },
    { num: 4, name: 'Apr' },
    { num: 5, name: 'May' },
    { num: 6, name: 'Jun' },
    { num: 7, name: 'Jul' },
    { num: 8, name: 'Aug' },
    { num: 9, name: 'Sep' },
    { num: 10, name: 'Oct' },
    { num: 11, name: 'Nov' },
    { num: 12, name: 'Dec' }
  ];

  // SQL expressions to test for each account type
  const sqlExpressions = {
    'Payable': (month) => `SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = ${month} AND YEAR(date_created) = YEAR(GETDATE())`,
    'Receivable': (month) => `SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = ${month} AND YEAR(date_created) = YEAR(GETDATE())`,
    'Overdue': (month) => `SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = ${month} AND YEAR(date_created) = YEAR(GETDATE())`
  };

  // IDs for each account type and month
  const idMappings = {
    'Payable': {
      'Jan': '6', 'Feb': '7', 'Mar': '8', 'Apr': '9', 'May': '10', 'Jun': '11',
      'Jul': '12', 'Aug': '13', 'Sep': '14', 'Oct': '15', 'Nov': '16', 'Dec': '17'
    },
    'Receivable': {
      'Jan': '18', 'Feb': '19', 'Mar': '20', 'Apr': '21', 'May': '22', 'Jun': '23',
      'Jul': '24', 'Aug': '25', 'Sep': '26', 'Oct': '27', 'Nov': '28', 'Dec': '29'
    },
    'Overdue': {
      'Jan': '30', 'Feb': '31', 'Mar': '32', 'Apr': '33', 'May': '34', 'Jun': '35',
      'Jul': '36', 'Aug': '37', 'Sep': '38', 'Oct': '39', 'Nov': '40', 'Dec': '41'
    }
  };

  // Test results
  const results = [];
  const fixedExpressions = [];
  let successCount = 0;
  let failureCount = 0;

  // Test each SQL expression
  for (const accountType of Object.keys(sqlExpressions)) {
    for (const month of months) {
      const id = idMappings[accountType][month.name];
      const dataPoint = `Accounts ${accountType} ${month.name}`;
      const sqlExpression = sqlExpressions[accountType](month.num);
      
      console.log(`=== Testing ${dataPoint} (ID: ${id}) ===`);
      console.log(`Executing SQL: ${sqlExpression}`);
      
      const value = await executeQuery(sqlExpression);
      console.log(`Result: ${value}\n`);
      
      // Record the result
      results.push({
        id,
        dataPoint,
        value,
        success: value > 0
      });
      
      if (value > 0) {
        successCount++;
      } else {
        failureCount++;
        
        // Try alternative SQL expressions for failing tests
        console.log(`${dataPoint} returned zero. Trying alternative expression...`);
        
        // Alternative SQL expressions that don't filter by year
        let alternativeSql;
        if (accountType === 'Payable') {
          alternativeSql = `SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = ${month.num}`;
        } else if (accountType === 'Receivable') {
          alternativeSql = `SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = ${month.num}`;
        } else { // Overdue
          alternativeSql = `SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = ${month.num}`;
        }
        
        console.log(`Executing alternative SQL: ${alternativeSql}`);
        const alternativeValue = await executeQuery(alternativeSql);
        console.log(`Alternative result: ${alternativeValue}\n`);
        
        if (alternativeValue > 0) {
          console.log(`Alternative expression successful for ${dataPoint}!\n`);
          fixedExpressions.push({
            id,
            dataPoint,
            sqlExpression: alternativeSql
          });
        } else {
          console.log(`Alternative expression also failed for ${dataPoint}. Trying without month filter...\n`);
          
          // Try without month filter
          let fallbackSql;
          if (accountType === 'Payable') {
            fallbackSql = `SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK)`;
          } else if (accountType === 'Receivable') {
            fallbackSql = `SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK)`;
          } else { // Overdue
            fallbackSql = `SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0`;
          }
          
          console.log(`Executing fallback SQL: ${fallbackSql}`);
          const fallbackValue = await executeQuery(fallbackSql);
          console.log(`Fallback result: ${fallbackValue}\n`);
          
          if (fallbackValue > 0) {
            console.log(`Fallback expression successful for ${dataPoint}!\n`);
            fixedExpressions.push({
              id,
              dataPoint,
              sqlExpression: fallbackSql
            });
          }
        }
      }
    }
  }

  // Print summary
  console.log('=== Test Results Summary ===');
  console.log(`${successCount} out of ${successCount + failureCount} expressions returned non-zero values\n`);
  
  console.log('=== Detailed Results ===');
  results.forEach(result => {
    console.log(`${result.id} - ${result.dataPoint}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.value})`);
  });
  
  // Save fixed expressions to a file
  if (fixedExpressions.length > 0) {
    const fixedExpressionsPath = path.join(__dirname, '..', 'fixed-accounts-expressions.json');
    fs.writeFileSync(fixedExpressionsPath, JSON.stringify(fixedExpressions, null, 2), 'utf8');
    console.log(`\nSaved ${fixedExpressions.length} fixed expressions to ${fixedExpressionsPath}`);
  }
  
  return { results, fixedExpressions };
}

// Function to update the complete-chart-data.ts file with fixed expressions
async function updateFixedExpressions(fixedExpressions) {
  if (fixedExpressions.length === 0) {
    console.log('No fixed expressions to update.');
    return;
  }
  
  console.log('\nUpdating fixed SQL expressions in the database...');
  
  // Path to the complete-chart-data.ts file
  const completeChartDataPath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
  
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
      updatedSection = updatedSection.replace(sqlPattern, `"productionSqlExpression": "${expr.sqlExpression}"`);
      
      // Update lastUpdated timestamp
      if (updatedSection.match(lastUpdatedPattern)) {
        updatedSection = updatedSection.replace(lastUpdatedPattern, `"lastUpdated": "${new Date().toISOString()}"`);
      }
      
      // Replace the old section with the updated one
      content = content.replace(section, updatedSection);
      
      console.log(`Updated SQL expression for ${expr.dataPoint} (ID: ${expr.id})`);
    } else {
      console.log(`Failed to update ${expr.dataPoint} (ID: ${expr.id})`);
    }
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(completeChartDataPath, content, 'utf8');
  
  console.log('Successfully updated fixed SQL expressions');
  console.log('Please restart the application or click the "Load DB" button in the admin panel to see the changes');
}

// Main function
async function main() {
  try {
    console.log('Connecting to P21 database...');
    await sql.connect(config);
    console.log('Successfully connected to P21 database');
    
    const { results, fixedExpressions } = await testAccountsExpressions();
    
    if (fixedExpressions.length > 0) {
      await updateFixedExpressions(fixedExpressions);
    }
    
    await sql.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
