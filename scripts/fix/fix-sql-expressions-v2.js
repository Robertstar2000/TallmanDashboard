/**
 * Fix SQL Expressions Script (Version 2)
 * This script checks all SQL expressions in the admin database and fixes any that are reporting execution errors.
 */

const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// Main function to check and fix SQL expressions
async function fixSqlExpressions() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Parse the file to extract all spreadsheet rows
    const spreadsheetDataRegex = /export const initialSpreadsheetData: SpreadsheetRow\[\] = \[([\s\S]+?)\];/;
    const spreadsheetDataMatch = fileContent.match(spreadsheetDataRegex);
    
    if (!spreadsheetDataMatch) {
      throw new Error('Could not find initialSpreadsheetData in the file');
    }
    
    const rowsContent = spreadsheetDataMatch[1];
    
    // Extract individual rows
    const rows = [];
    let currentRow = '';
    let braceCount = 0;
    let inRow = false;
    
    for (let i = 0; i < rowsContent.length; i++) {
      const char = rowsContent[i];
      
      if (char === '{') {
        braceCount++;
        if (braceCount === 1) {
          inRow = true;
          currentRow = '{';
          continue;
        }
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && inRow) {
          currentRow += '}';
          rows.push(currentRow);
          currentRow = '';
          inRow = false;
          continue;
        }
      }
      
      if (inRow) {
        currentRow += char;
      }
    }
    
    console.log(`Found ${rows.length} rows in initialSpreadsheetData`);
    
    // Connect to P21 database
    const dsn = process.env.P21_DSN || 'P21Live';
    const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Create results object
    const results = {
      timestamp: new Date().toISOString(),
      totalRows: rows.length,
      testedRows: 0,
      errorRows: 0,
      fixedRows: 0,
      errors: [],
      fixes: []
    };
    
    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Extract row information
      const idMatch = row.match(/id:\s+'([^']+)'/);
      const nameMatch = row.match(/name:\s+"([^"]+)"/);
      const serverNameMatch = row.match(/serverName:\s+'([^']+)'/);
      const sqlExpressionMatch = row.match(/sqlExpression:\s+"([^"]+)"/);
      const tableNameMatch = row.match(/tableName:\s+"([^"]+)"/);
      
      if (!idMatch || !nameMatch || !serverNameMatch || !sqlExpressionMatch) {
        console.log(`Skipping row ${i + 1} due to missing information`);
        continue;
      }
      
      const id = idMatch[1];
      const name = nameMatch[1];
      const serverName = serverNameMatch[1];
      const sqlExpression = sqlExpressionMatch[1];
      const tableName = tableNameMatch ? tableNameMatch[1] : '';
      
      console.log(`\n[${i + 1}/${rows.length}] Testing: ${name} (ID: ${id})`);
      
      // Skip POR queries for now (we're focusing on P21)
      if (serverName !== 'P21') {
        console.log(`  Skipping ${serverName} query`);
        continue;
      }
      
      results.testedRows++;
      
      // Test the SQL expression
      try {
        console.log(`  SQL: ${sqlExpression}`);
        const result = await connection.query(sqlExpression);
        console.log(`  ✅ SUCCESS: Returned value: ${result[0]?.value || 'NULL'}`);
      } catch (error) {
        results.errorRows++;
        console.log(`  ❌ ERROR: ${error.message}`);
        
        // Store error information
        results.errors.push({
          id,
          name,
          sqlExpression,
          error: error.message
        });
        
        // Fix the SQL expression
        let fixedSql = sqlExpression;
        let fixed = false;
        let fixDescription = [];
        
        // Common fixes based on error patterns
        
        // Fix 1: Missing schema (dbo)
        if (error.message.includes("Invalid object name") || error.message.includes("Invalid column name")) {
          const tableNames = ['oe_hdr', 'invoice_hdr', 'inv_mast', 'customer', 'ar_terms', 'ar_open_item'];
          
          for (const table of tableNames) {
            const regex = new RegExp(`FROM ${table}(?! WITH)`, 'g');
            if (fixedSql.match(regex)) {
              fixedSql = fixedSql.replace(regex, `FROM dbo.${table}`);
              fixDescription.push(`Added 'dbo.' schema to table ${table}`);
              fixed = true;
            }
          }
        }
        
        // Fix 2: Missing NOLOCK hint
        const tableWithoutNolock = fixedSql.match(/FROM dbo\.([^\s]+)(?! WITH \(NOLOCK\))/);
        if (tableWithoutNolock) {
          fixedSql = fixedSql.replace(
            `FROM dbo.${tableWithoutNolock[1]}`,
            `FROM dbo.${tableWithoutNolock[1]} WITH (NOLOCK)`
          );
          fixDescription.push(`Added WITH (NOLOCK) hint to table ${tableWithoutNolock[1]}`);
          fixed = true;
        }
        
        // Fix 3: JOIN without NOLOCK
        const joinWithoutNolock = fixedSql.match(/JOIN dbo\.([^\s]+)(?! WITH \(NOLOCK\))/);
        if (joinWithoutNolock) {
          fixedSql = fixedSql.replace(
            `JOIN dbo.${joinWithoutNolock[1]}`,
            `JOIN dbo.${joinWithoutNolock[1]} WITH (NOLOCK)`
          );
          fixDescription.push(`Added WITH (NOLOCK) hint to joined table ${joinWithoutNolock[1]}`);
          fixed = true;
        }
        
        // Fix 4: Date format issues
        if (error.message.includes("datetime") || error.message.includes("date") || error.message.includes("FORMAT")) {
          if (fixedSql.includes("FORMAT(")) {
            fixedSql = fixedSql
              .replace(/FORMAT\(([^,]+), 'yyyy-MM'\)/g, "CONVERT(varchar(7), $1, 120)")
              .replace(/FORMAT\(GETDATE\(\), 'yyyy-MM'\)/g, "CONVERT(varchar(7), GETDATE(), 120)");
            fixDescription.push("Replaced FORMAT() with CONVERT() for date formatting");
            fixed = true;
          }
          
          if (fixedSql.includes("strftime")) {
            fixedSql = fixedSql
              .replace(/strftime\('%Y-%m', date\)/g, "CONVERT(varchar(7), date, 120)")
              .replace(/strftime\('%Y-%m', 'now'\)/g, "CONVERT(varchar(7), GETDATE(), 120)");
            fixDescription.push("Replaced strftime() with CONVERT() for date formatting");
            fixed = true;
          }
        }
        
        // Fix 5: Column name issues
        if (error.message.includes("credit_limit_used")) {
          fixedSql = fixedSql.replace(/credit_limit_used/g, 'credit_limit');
          fixDescription.push("Replaced 'credit_limit_used' with 'credit_limit'");
          fixed = true;
        }
        
        // Fix 6: Invalid date comparison
        if (error.message.includes("Conversion failed") && fixedSql.includes("CONVERT(varchar(7)")) {
          fixedSql = fixedSql
            .replace(/CONVERT\(varchar\(7\), ([^,]+), 120\) = CONVERT\(varchar\(7\), GETDATE\(\), 120\)/g, 
                    "YEAR($1) = YEAR(GETDATE()) AND MONTH($1) = MONTH(GETDATE())");
          fixDescription.push("Fixed date comparison using YEAR() and MONTH() functions");
          fixed = true;
        }
        
        // Fix 7: Incorrect date range calculation
        if (error.message.includes("DATEDIFF") || error.message.includes("DATEADD")) {
          // Fix for first day of month calculation
          if (fixedSql.includes("DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)")) {
            fixDescription.push("Date range calculation is correct, issue might be elsewhere");
          }
        }
        
        // If we fixed the SQL, test it again
        if (fixed) {
          console.log(`  🔧 ATTEMPTING FIX: ${fixDescription.join(", ")}`);
          console.log(`  NEW SQL: ${fixedSql}`);
          
          try {
            const result = await connection.query(fixedSql);
            console.log(`  ✅ FIX SUCCESSFUL: Returned value: ${result[0]?.value || 'NULL'}`);
            
            // Update the file content with the fixed SQL
            const escapedSql = sqlExpression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const sqlRegex = new RegExp(`(sqlExpression:\\s*")${escapedSql}(")`, 'g');
            fileContent = fileContent.replace(sqlRegex, `$1${fixedSql}$2`);
            
            results.fixedRows++;
            results.fixes.push({
              id,
              name,
              originalSql: sqlExpression,
              fixedSql,
              fixes: fixDescription
            });
          } catch (fixError) {
            console.log(`  ❌ FIX FAILED: ${fixError.message}`);
          }
        } else {
          console.log(`  ⚠️ No automatic fix available for this error`);
        }
      }
    }
    
    // Close the database connection
    await connection.close();
    console.log('\nDatabase connection closed');
    
    // Write the updated file content
    fs.writeFileSync(initialDataPath, fileContent);
    console.log('✅ Updated initial-data.ts file with fixed SQL expressions');
    
    // Save results to JSON file
    const jsonFile = path.join(process.cwd(), 'sql-expressions-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${jsonFile}`);
    
    console.log(`\nSummary:`);
    console.log(`- Total rows: ${results.totalRows}`);
    console.log(`- Tested rows: ${results.testedRows}`);
    console.log(`- Error rows: ${results.errorRows}`);
    console.log(`- Fixed rows: ${results.fixedRows}`);
    
    if (results.fixes.length > 0) {
      console.log('\nSuccessful fixes:');
      results.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.name}: ${fix.fixes.join(', ')}`);
      });
    }
    
    if (results.errorRows > results.fixedRows) {
      console.log('\nRemaining errors:');
      results.errors
        .filter(error => !results.fixes.some(fix => fix.id === error.id))
        .forEach((error, index) => {
          console.log(`${index + 1}. ${error.name}: ${error.error}`);
        });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Save error to file
    const jsonFile = path.join(process.cwd(), 'sql-expressions-error.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${jsonFile}`);
  }
}

// Run the fix
fixSqlExpressions().catch(error => {
  console.error('Unhandled error:', error);
});

