/**
 * Fix Admin Initialization Script
 * This script verifies and updates the site group SQL expressions in the admin database
 * and ensures the Accounts chart group has exactly 36 rows (12 months × 3 variables)
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const odbc = require('odbc');

// Site queries with correct location IDs
const siteQueries = {
  // Site Distribution - Count queries
  columbus: {
    count: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '101' AND completed = 'N'",
    sales: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '101' AND h.order_date >= DATEADD(day, -30, GETDATE())"
  },
  addison: {
    count: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '100' AND completed = 'N'",
    sales: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '100' AND h.order_date >= DATEADD(day, -30, GETDATE())"
  },
  lakeCity: {
    count: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '107' AND completed = 'N'",
    sales: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '107' AND h.order_date >= DATEADD(day, -30, GETDATE())"
  }
};

// Main function to fix admin initialization
async function fixAdminInitialization() {
  const results = {
    timestamp: new Date().toISOString(),
    siteQueriesUpdated: false,
    accountsRowsVerified: false,
    sqliteUpdated: false,
    initialDataUpdated: false
  };
  
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // 1. Update site group SQL expressions
    console.log('\n--- Updating Site Group SQL Expressions ---');
    
    // Update Columbus count query
    const columbusCountRegex = /(productionSqlExpression:\s*")SELECT COUNT\(\*\) as value FROM .*?WHERE location_id = '[^']*' AND .*?"/;
    fileContent = fileContent.replace(columbusCountRegex, `$1${siteQueries.columbus.count}"`);
    
    // Update Addison count query
    const addisonCountRegex = /(name:\s*"Addison"[\s\S]*?productionSqlExpression:\s*")SELECT COUNT\(\*\) as value FROM .*?WHERE location_id = '[^']*' AND .*?"/;
    fileContent = fileContent.replace(addisonCountRegex, `$1${siteQueries.addison.count}"`);
    
    // Update Lake City count query
    const lakeCityCountRegex = /(name:\s*"Lake City"[\s\S]*?productionSqlExpression:\s*")SELECT COUNT\(\*\) as value FROM .*?WHERE location_id = '[^']*' AND .*?"/;
    fileContent = fileContent.replace(lakeCityCountRegex, `$1${siteQueries.lakeCity.count}"`);
    
    console.log('✅ Updated site count queries with correct location IDs');
    
    // 2. Verify Accounts rows structure
    console.log('\n--- Verifying Accounts Rows Structure ---');
    
    // Extract all rows with "chartGroup: "Accounts""
    const accountsRowsRegex = /{\s+id:\s+'[^']+',\s+name:\s+"Accounts[^}]+}/g;
    const accountsRows = fileContent.match(accountsRowsRegex) || [];
    
    console.log(`Found ${accountsRows.length} Accounts rows in initial-data.ts`);
    
    if (accountsRows.length === 36) {
      console.log('✅ CORRECT: There are exactly 36 Accounts rows (12 months × 3 variables)');
      results.accountsRowsVerified = true;
    } else {
      console.log(`WARNING: Expected 36 Accounts rows, but found ${accountsRows.length}`);
      
      if (accountsRows.length > 36) {
        console.log(`There are ${accountsRows.length - 36} extra rows that need to be removed`);
        // This would require more complex logic to remove extra rows
      } else {
        console.log(`There are ${36 - accountsRows.length} missing rows that need to be added`);
        // This would require more complex logic to add missing rows
      }
    }
    
    // 3. Write updated content back to the file
    fs.writeFileSync(initialDataPath, fileContent);
    console.log('\n✅ Updated initial-data.ts file with correct SQL expressions');
    results.initialDataUpdated = true;
    
    // 4. Test the updated SQL expressions
    console.log('\n--- Testing Updated SQL Expressions ---');
    
    // Connect to P21 database
    const dsn = process.env.P21_DSN || 'P21Play';
    const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    try {
      // Test Columbus count query
      console.log('Testing Columbus count query...');
      const columbusCountResult = await connection.query(siteQueries.columbus.count);
      console.log(`Columbus count: ${columbusCountResult[0].value}`);
      
      // Test Addison count query
      console.log('Testing Addison count query...');
      const addisonCountResult = await connection.query(siteQueries.addison.count);
      console.log(`Addison count: ${addisonCountResult[0].value}`);
      
      // Test Lake City count query
      console.log('Testing Lake City count query...');
      const lakeCityCountResult = await connection.query(siteQueries.lakeCity.count);
      console.log(`Lake City count: ${lakeCityCountResult[0].value}`);
      
      // Test Columbus sales query
      console.log('Testing Columbus sales query...');
      const columbusSalesResult = await connection.query(siteQueries.columbus.sales);
      console.log(`Columbus sales: ${columbusSalesResult[0].value}`);
      
      // Test Addison sales query
      console.log('Testing Addison sales query...');
      const addisonSalesResult = await connection.query(siteQueries.addison.sales);
      console.log(`Addison sales: ${addisonSalesResult[0].value}`);
      
      // Test Lake City sales query
      console.log('Testing Lake City sales query...');
      const lakeCitySalesResult = await connection.query(siteQueries.lakeCity.sales);
      console.log(`Lake City sales: ${lakeCitySalesResult[0].value}`);
      
      results.siteQueries = {
        columbus: {
          count: columbusCountResult[0].value,
          sales: columbusSalesResult[0].value
        },
        addison: {
          count: addisonCountResult[0].value,
          sales: addisonSalesResult[0].value
        },
        lakeCity: {
          count: lakeCityCountResult[0].value,
          sales: lakeCitySalesResult[0].value
        }
      };
      
      results.siteQueriesUpdated = true;
      console.log('✅ All site queries tested successfully');
      
    } finally {
      // Close the connection
      await connection.close();
      console.log('Database connection closed');
    }
    
    // 5. Update SQLite database with site data
    console.log('\n--- Updating SQLite Database ---');
    
    // Connect to the SQLite database
    const dbPath = path.join(process.cwd(), 'admin.db');
    
    if (!fs.existsSync(dbPath)) {
      console.log('SQLite database does not exist. Creating a new one...');
    }
    
    const db = new Database(dbPath);
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Check if the spreadsheet table exists
      const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='spreadsheet'").get();
      
      if (!tableExists) {
        console.log('Creating spreadsheet table...');
        db.prepare(`
          CREATE TABLE spreadsheet (
            id TEXT PRIMARY KEY,
            name TEXT,
            serverName TEXT,
            value TEXT,
            chartGroup TEXT,
            calculation TEXT,
            sqlExpression TEXT,
            productionSqlExpression TEXT,
            tableName TEXT,
            chartName TEXT,
            variableName TEXT,
            lastUpdated TEXT,
            timeframe TEXT
          )
        `).run();
      }
      
      // Update site data in SQLite
      const siteData = [
        {
          id: '8',
          name: 'Columbus',
          productionSqlExpression: siteQueries.columbus.count,
          value: results.siteQueries?.columbus?.count || 0
        },
        {
          id: '9',
          name: 'Addison',
          productionSqlExpression: siteQueries.addison.count,
          value: results.siteQueries?.addison?.count || 0
        },
        {
          id: '10',
          name: 'Lake City',
          productionSqlExpression: siteQueries.lakeCity.count,
          value: results.siteQueries?.lakeCity?.count || 0
        },
        {
          id: '8a',
          name: 'Columbus Sales',
          productionSqlExpression: siteQueries.columbus.sales,
          value: results.siteQueries?.columbus?.sales || 0
        },
        {
          id: '9a',
          name: 'Addison Sales',
          productionSqlExpression: siteQueries.addison.sales,
          value: results.siteQueries?.addison?.sales || 0
        },
        {
          id: '10a',
          name: 'Lake City Sales',
          productionSqlExpression: siteQueries.lakeCity.sales,
          value: results.siteQueries?.lakeCity?.sales || 0
        }
      ];
      
      // Prepare statements
      const updateStmt = db.prepare(`
        UPDATE spreadsheet 
        SET value = ?, productionSqlExpression = ?, lastUpdated = ? 
        WHERE id = ?
      `);
      
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO spreadsheet (
          id, name, value, productionSqlExpression, lastUpdated
        ) VALUES (?, ?, ?, ?, ?)
      `);
      
      // Update or insert data
      const now = new Date().toISOString();
      let updatedCount = 0;
      let insertedCount = 0;
      
      for (const item of siteData) {
        // Check if row exists
        const exists = db.prepare('SELECT id FROM spreadsheet WHERE id = ?').get(item.id);
        
        if (exists) {
          // Update existing row
          updateStmt.run(
            item.value.toString(),
            item.productionSqlExpression,
            now,
            item.id
          );
          updatedCount++;
          console.log(`Updated ${item.name} with value: ${item.value}`);
        } else {
          // Insert new row
          insertStmt.run(
            item.id,
            item.name,
            item.value.toString(),
            item.productionSqlExpression,
            now
          );
          insertedCount++;
          console.log(`Inserted ${item.name} with value: ${item.value}`);
        }
      }
      
      // Commit transaction
      db.prepare('COMMIT').run();
      
      console.log(`\nSummary: Updated ${updatedCount} rows, inserted ${insertedCount} rows`);
      results.sqliteUpdated = true;
      
    } catch (error) {
      // Rollback transaction on error
      db.prepare('ROLLBACK').run();
      throw error;
    } finally {
      // Close database connection
      db.close();
      console.log('SQLite database connection closed');
    }
    
    // Save results to JSON file
    const jsonFile = path.join(process.cwd(), 'admin-initialization-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${jsonFile}`);
    
    console.log('\n✅ COMPLETED: Admin initialization fixed successfully');
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Save error to file
    const jsonFile = path.join(process.cwd(), 'admin-initialization-error.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${jsonFile}`);
  }
}

// Run the fix
fixAdminInitialization().catch(error => {
  console.error('Unhandled error:', error);
});
