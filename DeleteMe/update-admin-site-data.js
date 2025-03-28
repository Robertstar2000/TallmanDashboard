/**
 * Update Admin Site Data
 * This script updates the admin database with site data from our queries
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Main function to update admin site data
async function updateAdminSiteData() {
  try {
    // Load the site query results
    const resultsFile = path.join(process.cwd(), 'admin-site-queries-results.json');
    if (!fs.existsSync(resultsFile)) {
      console.error('Results file not found. Please run test-admin-site-queries.js first.');
      return;
    }
    
    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    console.log('Loaded query results from:', resultsFile);
    
    // Connect to the SQLite database
    const dbPath = path.join(process.cwd(), 'admin.db');
    const db = new Database(dbPath);
    console.log('Connected to SQLite database:', dbPath);
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Update site distribution data
      const siteDistributionData = [
        {
          id: '8',
          name: 'Columbus',
          value: results.queries.find(q => q.name === 'Columbus - Count')?.value || 0
        },
        {
          id: '9',
          name: 'Addison',
          value: results.queries.find(q => q.name === 'Addison - Count')?.value || 0
        },
        {
          id: '10',
          name: 'Lake City',
          value: results.queries.find(q => q.name === 'Lake City - Count')?.value || 0
        }
      ];
      
      // Update site sales data
      const siteSalesData = [
        {
          id: '8a',
          name: 'Columbus Sales',
          value: results.queries.find(q => q.name === 'Columbus - Sales')?.value || 0
        },
        {
          id: '9a',
          name: 'Addison Sales',
          value: results.queries.find(q => q.name === 'Addison - Sales')?.value || 0
        },
        {
          id: '10a',
          name: 'Lake City Sales',
          value: results.queries.find(q => q.name === 'Lake City - Sales')?.value || 0
        }
      ];
      
      // Combine all data to update
      const allData = [...siteDistributionData, ...siteSalesData];
      
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
      
      // Prepare statements
      const updateStmt = db.prepare(`
        UPDATE spreadsheet 
        SET value = ?, lastUpdated = ? 
        WHERE id = ?
      `);
      
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO spreadsheet (
          id, name, value, lastUpdated
        ) VALUES (?, ?, ?, ?)
      `);
      
      // Update or insert data
      const now = new Date().toISOString();
      let updatedCount = 0;
      let insertedCount = 0;
      
      for (const item of allData) {
        // Check if row exists
        const exists = db.prepare('SELECT id FROM spreadsheet WHERE id = ?').get(item.id);
        
        if (exists) {
          // Update existing row
          updateStmt.run(item.value.toString(), now, item.id);
          updatedCount++;
          console.log(`Updated ${item.name} with value: ${item.value}`);
        } else {
          // Insert new row
          insertStmt.run(item.id, item.name, item.value.toString(), now);
          insertedCount++;
          console.log(`Inserted ${item.name} with value: ${item.value}`);
        }
      }
      
      // Commit transaction
      db.prepare('COMMIT').run();
      
      console.log(`\nSummary: Updated ${updatedCount} rows, inserted ${insertedCount} rows`);
      
      // Generate summary report
      const summary = {
        timestamp: new Date().toISOString(),
        updatedCount,
        insertedCount,
        siteDistribution: {
          total: results.orderCountSummary.totalCount,
          columbus: {
            count: results.orderCountSummary.columbusCount,
            percentage: results.orderCountSummary.columbusCountPercent
          },
          addison: {
            count: results.orderCountSummary.addisonCount,
            percentage: results.orderCountSummary.addisonCountPercent
          },
          lakeCity: {
            count: results.orderCountSummary.lakeCityCount,
            percentage: results.orderCountSummary.lakeCityCountPercent
          }
        },
        siteSales: {
          total: results.salesSummary.totalSales,
          columbus: {
            sales: results.salesSummary.columbusSales,
            percentage: results.salesSummary.columbusPercent
          },
          addison: {
            sales: results.salesSummary.addisonSales,
            percentage: results.salesSummary.addisonPercent
          },
          lakeCity: {
            sales: results.salesSummary.lakeCitySales,
            percentage: results.salesSummary.lakeCityPercent
          }
        }
      };
      
      // Save summary to file
      const summaryFile = path.join(process.cwd(), 'admin-site-update-summary.json');
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
      console.log(`\nSummary saved to: ${summaryFile}`);
      
    } catch (error) {
      // Rollback transaction on error
      db.prepare('ROLLBACK').run();
      throw error;
    } finally {
      // Close database connection
      db.close();
      console.log('Database connection closed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Save error to file
    const errorFile = path.join(process.cwd(), 'admin-site-update-error.json');
    fs.writeFileSync(errorFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${errorFile}`);
  }
}

// Run the update
updateAdminSiteData().catch(error => {
  console.error('Unhandled error:', error);
});
