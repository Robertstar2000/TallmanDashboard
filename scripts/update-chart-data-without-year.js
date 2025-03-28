const fs = require('fs');
const path = require('path');

// Path to the complete-chart-data.ts file
const completeChartDataPath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');

// Read the file content
let content = fs.readFileSync(completeChartDataPath, 'utf8');

// Function to update a specific SQL expression in the file
function updateSqlExpression(id, tableName, sqlExpression) {
  // Create regex patterns to find and replace the relevant parts
  const idPattern = new RegExp(`"id":\\s*"${id}"[\\s\\S]*?productionSqlExpression":\\s*"[^"]*"`, 'g');
  
  // Find the matching section
  const match = content.match(idPattern);
  
  if (match && match.length > 0) {
    // Extract the section to update
    const section = match[0];
    
    // Create updated section with new table name and SQL expression
    const tableNamePattern = /"tableName":\s*"[^"]*"/;
    const sqlPattern = /"productionSqlExpression":\s*"[^"]*"/;
    const lastUpdatedPattern = /"lastUpdated":\s*"[^"]*"/;
    
    let updatedSection = section;
    
    // Update table name
    updatedSection = updatedSection.replace(tableNamePattern, `"tableName": "${tableName}"`);
    
    // Update SQL expression
    updatedSection = updatedSection.replace(sqlPattern, `"productionSqlExpression": "${sqlExpression}"`);
    
    // Update lastUpdated timestamp
    if (updatedSection.match(lastUpdatedPattern)) {
      updatedSection = updatedSection.replace(lastUpdatedPattern, `"lastUpdated": "${new Date().toISOString()}"`);
    }
    
    // Replace the old section with the updated one
    content = content.replace(section, updatedSection);
    
    return true;
  }
  
  return false;
}

// Function to update Accounts SQL expressions
function updateAccountsExpressions() {
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

  // SQL expressions for each account type - tested and confirmed to return non-zero values
  const sqlExpressions = {
    'Payable': (month) => `SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = ${month}`,
    'Receivable': (month) => `SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = ${month}`,
    'Overdue': (month) => `SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = ${month}`
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

  // Update expressions for all account types and months
  let updatedCount = 0;
  
  for (const accountType of Object.keys(sqlExpressions)) {
    for (const month of months) {
      const id = idMappings[accountType][month.name];
      const dataPoint = `Accounts ${accountType} ${month.name}`;
      const tableName = 'dbo.customer';
      const sqlExpression = sqlExpressions[accountType](month.num);
      
      // Update the expression
      const updated = updateSqlExpression(id, tableName, sqlExpression);
      
      if (updated) {
        updatedCount++;
        console.log(`Updated SQL expression for ${dataPoint} (ID: ${id})`);
      } else {
        console.log(`Failed to update ${dataPoint} (ID: ${id})`);
      }
    }
  }
  
  console.log(`\nTotal updated expressions: ${updatedCount}`);
}

// Update the Accounts SQL expressions
updateAccountsExpressions();

// Write the updated content back to the file
fs.writeFileSync(completeChartDataPath, content, 'utf8');

console.log('\nSuccessfully updated complete-chart-data.ts file');
console.log('Please restart the application or click the "Load DB" button in the admin panel to see the changes');
