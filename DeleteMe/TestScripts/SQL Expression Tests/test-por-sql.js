const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const POR_DB_PATH = "C:\\Users\\BobM\\Desktop\\POR.MDB";
const REPORT_DIR = path.join(__dirname, '..', '..', 'reports');
const CHART_DATA_PATH = path.join(__dirname, '..', '..', 'lib', 'db', 'complete-chart-data.ts');

// Ensure reports directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Function to extract SQL expressions from complete-chart-data.ts
function extractSqlExpressions() {
  console.log('Extracting SQL expressions from complete-chart-data.ts...');
  
  const chartDataContent = fs.readFileSync(CHART_DATA_PATH, 'utf8');
  
  // Convert the content to a JavaScript object
  const chartDataStr = chartDataContent
    .replace(/import.*?;/g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/export const completeChartData: SpreadsheetRow\[\] = /g, '')
    .trim();
  
  // Extract the array part
  const arrayMatch = chartDataStr.match(/\[([\s\S]*)\]/);
  if (!arrayMatch) {
    console.error('Failed to extract chart data array');
    return [];
  }
  
  // Parse the array
  let chartData;
  try {
    // Add brackets back and evaluate
    chartData = eval(`[${arrayMatch[1]}]`);
  } catch (error) {
    console.error('Failed to parse chart data:', error);
    return [];
  }
  
  // Filter for POR SQL expressions
  const porExpressions = chartData.filter(item => 
    item.serverName === 'POR' && 
    item.sqlExpression && 
    item.sqlExpression !== 'SELECT 0 as value'
  );
  
  console.log(`Found ${porExpressions.length} POR SQL expressions`);
  return porExpressions;
}

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
  
  // Generate alternative SQL for failed tests
  if (failed > 0) {
    generateAlternativeSql(results.filter(r => !r.success));
  }
}

// Function to generate alternative SQL for failed tests
function generateAlternativeSql(failedTests) {
  console.log('Generating alternative SQL for failed tests...');
  
  const alternativeSql = failedTests.map(test => {
    // Common issues with Access SQL and their fixes
    let fixedSql = test.sql;
    
    // Fix 1: Replace square brackets with quotes for field names if that's the issue
    if (test.error.includes('no such field') || test.error.includes('syntax error')) {
      fixedSql = fixedSql.replace(/\[([^\]]+)\]/g, '"$1"');
    }
    
    // Fix 2: Try alternative date functions if Month/Year functions are the issue
    if (test.error.includes('no such function') && (test.sql.includes('Month(') || test.sql.includes('Year('))) {
      fixedSql = fixedSql
        .replace(/Month\(\[([^\]]+)\]\)/g, 'DatePart("m", [$1])')
        .replace(/Year\(\[([^\]]+)\]\)/g, 'DatePart("yyyy", [$1])')
        .replace(/Date\(\)/g, 'Now()');
    }
    
    // Fix 3: If Contracts table doesn't exist, try alternative tables
    if (test.error.includes('no such table') && test.sql.includes('Contracts')) {
      const alternativeTables = ['Rentals', 'Transactions', 'Orders', 'Invoices'];
      
      // Try each alternative table
      for (const table of alternativeTables) {
        const altSql = test.sql.replace(/Contracts/g, table);
        
        return {
          id: test.id,
          name: test.name,
          originalSql: test.sql,
          alternativeSql: [fixedSql, altSql]
        };
      }
    }
    
    return {
      id: test.id,
      name: test.name,
      originalSql: test.sql,
      alternativeSql: [fixedSql]
    };
  });
  
  // Save alternative SQL to file
  const alternativeSqlPath = path.join(REPORT_DIR, 'por-alternative-sql.json');
  fs.writeFileSync(alternativeSqlPath, JSON.stringify(alternativeSql, null, 2));
  
  console.log(`Alternative SQL saved to: ${alternativeSqlPath}`);
}

// Main execution
try {
  const expressions = extractSqlExpressions();
  
  if (expressions.length > 0) {
    testSqlExpressions(expressions);
  } else {
    console.log('No POR SQL expressions found to test');
  }
} catch (error) {
  console.error('Error:', error);
}
