/**
 * Fix Specific SQL Expressions Script
 * This script fixes the specific SQL expressions that were identified as problematic
 */

const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// List of problematic expressions to fix
const problemExpressions = [
  {
    name: "Orders - New - Month 1",
    pattern: /name:\s+"Orders - New - Month 1"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE()) AND completed = 'N'"
  },
  {
    name: "Orders - Completed - Month 1",
    pattern: /name:\s+"Orders - Completed - Month 1"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE()) AND completed = 'Y'"
  },
  {
    name: "Orders - Cancelled - Month 1",
    pattern: /name:\s+"Orders - Cancelled - Month 1"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE()) AND delete_flag = 'Y'"
  },
  {
    name: "Orders - New - Month 2",
    pattern: /name:\s+"Orders - New - Month 2"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(DATEADD(month, -1, GETDATE())) AND MONTH(order_date) = MONTH(DATEADD(month, -1, GETDATE())) AND completed = 'N'"
  },
  {
    name: "Orders - Completed - Month 2",
    pattern: /name:\s+"Orders - Completed - Month 2"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(DATEADD(month, -1, GETDATE())) AND MONTH(order_date) = MONTH(DATEADD(month, -1, GETDATE())) AND completed = 'Y'"
  },
  {
    name: "Orders - Cancelled - Month 2",
    pattern: /name:\s+"Orders - Cancelled - Month 2"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(DATEADD(month, -1, GETDATE())) AND MONTH(order_date) = MONTH(DATEADD(month, -1, GETDATE())) AND delete_flag = 'Y'"
  },
  {
    name: "Inventory - Total Items",
    pattern: /name:\s+"Inventory - Total Items"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK)"
  },
  {
    name: "Inventory - Active Items",
    pattern: /name:\s+"Inventory - Active Items"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE delete_flag <> 'Y'"
  },
  {
    name: "Inventory - Inactive Items",
    pattern: /name:\s+"Inventory - Inactive Items"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE delete_flag = 'Y'"
  },
  {
    name: "Customers - Total",
    pattern: /name:\s+"Customers - Total"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK)"
  },
  {
    name: "Customers - Active",
    pattern: /name:\s+"Customers - Active"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE inactive <> 'Y'"
  },
  {
    name: "Customers - Inactive",
    pattern: /name:\s+"Customers - Inactive"[\s\S]+?sqlExpression:\s+"([^"]+)"/,
    fix: "SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE inactive = 'Y'"
  }
];

// Main function to fix specific SQL expressions
async function fixSpecificSqlExpressions() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Connect to P21 database
    const dsn = process.env.P21_DSN || 'P21Play';
    const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Create results object
    const results = {
      timestamp: new Date().toISOString(),
      totalExpressions: problemExpressions.length,
      fixedExpressions: 0,
      errors: [],
      fixes: []
    };
    
    // Process each problematic expression
    for (const expr of problemExpressions) {
      console.log(`\nProcessing: ${expr.name}`);
      
      // Find the current SQL expression
      const match = fileContent.match(expr.pattern);
      
      if (!match) {
        console.log(`  ⚠️ Could not find expression for ${expr.name}`);
        results.errors.push({
          name: expr.name,
          error: 'Expression not found in file'
        });
        continue;
      }
      
      const currentSql = match[1];
      console.log(`  Current SQL: ${currentSql}`);
      console.log(`  Fixed SQL: ${expr.fix}`);
      
      // Test the current SQL
      try {
        const result = await connection.query(currentSql);
        console.log(`  ✅ Current SQL works: ${result[0]?.value || 'NULL'}`);
        continue; // If it works, no need to fix
      } catch (error) {
        console.log(`  ❌ Current SQL error: ${error.message}`);
      }
      
      // Test the fixed SQL
      try {
        const result = await connection.query(expr.fix);
        console.log(`  ✅ Fixed SQL works: ${result[0]?.value || 'NULL'}`);
        
        // Update the file content with the fixed SQL
        const escapedSql = currentSql.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const sqlRegex = new RegExp(`(sqlExpression:\\s*")${escapedSql}(")`, 'g');
        fileContent = fileContent.replace(sqlRegex, `$1${expr.fix}$2`);
        
        results.fixedExpressions++;
        results.fixes.push({
          name: expr.name,
          originalSql: currentSql,
          fixedSql: expr.fix,
          value: result[0]?.value || 'NULL'
        });
      } catch (error) {
        console.log(`  ❌ Fixed SQL error: ${error.message}`);
        results.errors.push({
          name: expr.name,
          error: error.message
        });
      }
    }
    
    // Close the database connection
    await connection.close();
    console.log('\nDatabase connection closed');
    
    // Write the updated file content
    fs.writeFileSync(initialDataPath, fileContent);
    console.log('✅ Updated initial-data.ts file with fixed SQL expressions');
    
    // Save results to JSON file
    const jsonFile = path.join(process.cwd(), 'specific-sql-fixes-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${jsonFile}`);
    
    console.log(`\nSummary:`);
    console.log(`- Total expressions: ${results.totalExpressions}`);
    console.log(`- Fixed expressions: ${results.fixedExpressions}`);
    
    if (results.fixes.length > 0) {
      console.log('\nSuccessful fixes:');
      results.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.name}: Value = ${fix.value}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\nRemaining errors:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.name}: ${error.error}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Save error to file
    const jsonFile = path.join(process.cwd(), 'specific-sql-fixes-error.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${jsonFile}`);
  }
}

// Run the fix
fixSpecificSqlExpressions().catch(error => {
  console.error('Unhandled error:', error);
});

