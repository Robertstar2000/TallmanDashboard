const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const POR_DB_PATH = "C:\\Users\\BobM\\Desktop\\POR.MDB";
const REPORT_DIR = path.join(__dirname, '..', '..', 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Define SQL expressions to test
const sqlExpressions = [
  {
    id: "74",
    name: "Historical Data - January - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 1 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "78",
    name: "Historical Data - February - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 2 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "82",
    name: "Historical Data - March - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 3 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "86",
    name: "Historical Data - April - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 4 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "90",
    name: "Historical Data - May - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 5 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "94",
    name: "Historical Data - June - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 6 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "98",
    name: "Historical Data - July - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 7 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "102",
    name: "Historical Data - August - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 8 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "106",
    name: "Historical Data - September - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 9 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "110",
    name: "Historical Data - October - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 10 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "114",
    name: "Historical Data - November - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 11 AND Year([ContractDate]) = Year(Date())"
  },
  {
    id: "118",
    name: "Historical Data - December - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 12 AND Year([ContractDate]) = Year(Date())"
  }
];

// Function to create and run VBScript to test SQL expressions
function testSqlExpressions(expressions) {
  console.log('Testing SQL expressions against POR database...');
  
  if (!fs.existsSync(POR_DB_PATH)) {
    console.error(`POR database file not found: ${POR_DB_PATH}`);
    return;
  }
  
  // Create a temporary VBScript file to test the SQL expressions
  const vbsPath = path.join(__dirname, 'temp-sql-test.vbs');
  
  let vbsContent = `
Option Explicit

Dim conn, rs, fso, outputFile
Dim dbPath, sql, success, errorMsg, result

' Database path
dbPath = "${POR_DB_PATH.replace(/\\/g, '\\\\')}"

' Create FileSystemObject
Set fso = CreateObject("Scripting.FileSystemObject")

' Create output file
Set outputFile = fso.CreateTextFile("${path.join(REPORT_DIR, 'por-sql-test-results.csv').replace(/\\/g, '\\\\')}", True)

' Write header
outputFile.WriteLine "ID,Name,SQL Expression,Result,Success,Error"

' Create connection
Set conn = CreateObject("ADODB.Connection")
conn.Open "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" & dbPath

' Test each SQL expression
`;

  // Add code to test each expression
  expressions.forEach(expr => {
    const escapedSql = expr.sqlExpression.replace(/"/g, '""');
    
    vbsContent += `
' Test expression: ${expr.name}
sql = "${escapedSql}"
success = True
errorMsg = ""
result = ""

On Error Resume Next
Set rs = conn.Execute(sql)
If Err.Number <> 0 Then
    success = False
    errorMsg = Err.Description
    Err.Clear
Else
    If Not rs.EOF Then
        result = rs.Fields(0).Value
    Else
        result = "No results"
    End If
    rs.Close
End If
On Error GoTo 0

outputFile.WriteLine "${expr.id},""${expr.name.replace(/"/g, '""')}"",""${escapedSql}"",""" & result & """,""" & success & """,""" & errorMsg & """"
`;
  });

  // Add code to test alternative table names
  const alternativeTables = ['Rentals', 'Transactions', 'Orders', 'Invoices', 'Contracts'];
  const monthsToTest = [1, 6, 12]; // Test January, June, and December
  
  vbsContent += `
' Test alternative table names
`;

  alternativeTables.forEach(table => {
    monthsToTest.forEach(month => {
      const altSql = `SELECT Count(*) as value FROM ${table} WHERE Month([ContractDate]) = ${month} AND Year([ContractDate]) = Year(Date())`;
      const escapedSql = altSql.replace(/"/g, '""');
      
      vbsContent += `
' Test alternative table: ${table} for month ${month}
sql = "${escapedSql}"
success = True
errorMsg = ""
result = ""

On Error Resume Next
Set rs = conn.Execute(sql)
If Err.Number <> 0 Then
    success = False
    errorMsg = Err.Description
    Err.Clear
Else
    If Not rs.EOF Then
        result = rs.Fields(0).Value
    Else
        result = "No results"
    End If
    rs.Close
End If
On Error GoTo 0

outputFile.WriteLine "ALT-${table}-${month},""Alternative ${table} Month ${month}"",""${escapedSql}"",""" & result & """,""" & success & """,""" & errorMsg & """"
`;
    });
  });

  // Test alternative date column names
  const dateColumns = ['ContractDate', 'Date', 'TransactionDate', 'InvoiceDate', 'RentalDate', 'OrderDate'];
  
  vbsContent += `
' Test alternative date column names
`;

  const tableToTest = 'Contracts'; // Use the default table name
  
  dateColumns.forEach(column => {
    const altSql = `SELECT Count(*) as value FROM ${tableToTest} WHERE Month([${column}]) = 1 AND Year([${column}]) = Year(Date())`;
    const escapedSql = altSql.replace(/"/g, '""');
    
    vbsContent += `
' Test alternative date column: ${column}
sql = "${escapedSql}"
success = True
errorMsg = ""
result = ""

On Error Resume Next
Set rs = conn.Execute(sql)
If Err.Number <> 0 Then
    success = False
    errorMsg = Err.Description
    Err.Clear
Else
    If Not rs.EOF Then
        result = rs.Fields(0).Value
    Else
        result = "No results"
    End If
    rs.Close
End If
On Error GoTo 0

outputFile.WriteLine "ALT-COL-${column},""Alternative Column ${column}"",""${escapedSql}"",""" & result & """,""" & success & """,""" & errorMsg & """"
`;
  });

  // Close resources
  vbsContent += `
' Close resources
conn.Close
outputFile.Close

' Output completion message
WScript.Echo "SQL testing completed. Results saved to por-sql-test-results.csv"
`;

  // Write VBScript file
  fs.writeFileSync(vbsPath, vbsContent);
  
  // Execute VBScript
  console.log('Running VBScript to test SQL expressions...');
  exec(`cscript //nologo "${vbsPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing VBScript: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`VBScript stderr: ${stderr}`);
    }
    
    console.log(stdout);
    
    // Clean up temporary file
    try {
      fs.unlinkSync(vbsPath);
    } catch (err) {
      console.warn(`Failed to delete temporary VBScript file: ${err.message}`);
    }
    
    // Parse and display results
    displayResults();
  });
}

// Function to display test results
function displayResults() {
  const resultsPath = path.join(REPORT_DIR, 'por-sql-test-results.csv');
  
  if (!fs.existsSync(resultsPath)) {
    console.error('Results file not found');
    return;
  }
  
  const resultsContent = fs.readFileSync(resultsPath, 'utf8');
  const lines = resultsContent.split('\n');
  
  // Skip header
  const results = lines.slice(1).filter(line => line.trim()).map(line => {
    const [id, name, sql, result, success, error] = line.split(',').map(field => {
      // Remove quotes if present
      if (field.startsWith('"') && field.endsWith('"')) {
        return field.substring(1, field.length - 1).replace(/""/g, '"');
      }
      return field;
    });
    
    return { id, name, sql, result, success: success === 'True', error };
  });
  
  // Count successful and failed tests
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\nTest Results Summary:`);
  console.log(`Total tests: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.name} (ID: ${r.id})`);
      console.log(`  SQL: ${r.sql}`);
      console.log(`  Error: ${r.error}`);
      console.log();
    });
  }
  
  // Find successful alternative tests
  const alternativeTests = results.filter(r => r.id.startsWith('ALT-') && r.success);
  
  if (alternativeTests.length > 0) {
    console.log('\nSuccessful Alternative Tests:');
    alternativeTests.forEach(r => {
      console.log(`- ${r.name}`);
      console.log(`  SQL: ${r.sql}`);
      console.log(`  Result: ${r.result}`);
      console.log();
    });
    
    // Generate updated SQL expressions based on successful alternatives
    generateUpdatedSql(results, alternativeTests);
  }
}

// Function to generate updated SQL expressions based on successful alternatives
function generateUpdatedSql(allResults, successfulAlternatives) {
  console.log('Generating updated SQL expressions based on successful alternatives...');
  
  // Find the best alternative table
  const tableCounts = {};
  
  successfulAlternatives
    .filter(alt => alt.id.startsWith('ALT-') && !alt.id.startsWith('ALT-COL-'))
    .forEach(alt => {
      const table = alt.id.split('-')[1];
      tableCounts[table] = (tableCounts[table] || 0) + 1;
    });
  
  const bestTable = Object.entries(tableCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])[0] || 'Contracts';
  
  console.log(`Best alternative table: ${bestTable}`);
  
  // Find the best alternative date column
  const columnCounts = {};
  
  successfulAlternatives
    .filter(alt => alt.id.startsWith('ALT-COL-'))
    .forEach(alt => {
      const column = alt.id.split('-')[2];
      columnCounts[column] = (columnCounts[column] || 0) + 1;
    });
  
  const bestColumn = Object.entries(columnCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])[0] || 'ContractDate';
  
  console.log(`Best alternative date column: ${bestColumn}`);
  
  // Generate updated SQL expressions
  const updatedExpressions = sqlExpressions.map(expr => {
    // Replace table and column names
    const updatedSql = expr.sqlExpression
      .replace(/FROM\s+Contracts/i, `FROM ${bestTable}`)
      .replace(/\[ContractDate\]/g, `[${bestColumn}]`);
    
    return {
      ...expr,
      originalSql: expr.sqlExpression,
      updatedSql: updatedSql
    };
  });
  
  // Save updated SQL expressions to file
  const updatedSqlPath = path.join(REPORT_DIR, 'por-updated-sql.json');
  fs.writeFileSync(updatedSqlPath, JSON.stringify(updatedExpressions, null, 2));
  
  console.log(`Updated SQL expressions saved to: ${updatedSqlPath}`);
  
  // Generate a script to update the complete-chart-data.ts file
  const updateScriptPath = path.join(__dirname, 'update-chart-data.js');
  
  const updateScriptContent = `
const fs = require('fs');
const path = require('path');

// Load updated SQL expressions
const updatedExpressions = require('${path.join(REPORT_DIR, 'por-updated-sql.json').replace(/\\/g, '\\\\')}');

// Load complete-chart-data.ts
const chartDataPath = path.join(__dirname, '..', '..', 'lib', 'db', 'complete-chart-data.ts');
let chartDataContent = fs.readFileSync(chartDataPath, 'utf8');

// Update each SQL expression
updatedExpressions.forEach(expr => {
  const id = expr.id;
  const updatedSql = expr.updatedSql;
  
  // Create a regex pattern to find the SQL expression for this ID
  const pattern = new RegExp(\`"id":\\s*"\${id}"[\\s\\S]*?("sqlExpression":\\s*")[^"]*(",[\\s\\S]*?"productionSqlExpression":\\s*")[^"]*(")\`);
  
  // Replace the SQL expressions
  chartDataContent = chartDataContent.replace(pattern, \`"id": "\${id}"$1\${updatedSql}$2\${updatedSql}$3\`);
});

// Write the updated content back to the file
fs.writeFileSync(chartDataPath, chartDataContent);

console.log('Updated complete-chart-data.ts with new SQL expressions');
`;
  
  fs.writeFileSync(updateScriptPath, updateScriptContent);
  
  console.log(`Update script created: ${updateScriptPath}`);
  console.log('Run this script to update the complete-chart-data.ts file with the successful SQL expressions');
}

// Main execution
try {
  testSqlExpressions(sqlExpressions);
} catch (error) {
  console.error('Error:', error);
}
