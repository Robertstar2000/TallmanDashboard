/**
 * Script to find the chart_data table and update SQL expressions
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Helper function to open the database
function openDatabase(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Connected to database: ${dbPath}`);
        resolve(db);
      }
    });
  });
}

// Helper function to run a query
function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to run an update query
function runUpdate(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes, lastID: this.lastID });
      }
    });
  });
}

// Define the correct SQL expressions for each key metric
const correctSqlExpressions = {
  'Total Orders': {
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())`,
    tableName: 'oe_hdr'
  },
  'Open Orders': {
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N'`,
    tableName: 'oe_hdr'
  },
  'Open Orders 2': {
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'`,
    tableName: 'oe_hdr'
  },
  'Daily Revenue': {
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`,
    tableName: 'oe_hdr'
  },
  'Open Invoices': {
    sql: `SELECT COUNT(*) as value FROM invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())`,
    tableName: 'invoice_hdr'
  },
  'Orders Backlogged': {
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())`,
    tableName: 'oe_hdr'
  },
  'Total Monthly Sales': {
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())`,
    tableName: 'oe_hdr'
  }
};

// Main function
async function findAndUpdateChartData() {
  // Create output file
  const outputFile = path.join(process.cwd(), 'chart-data-results.txt');
  let output = '';
  
  // Helper function to append to output
  const log = (text) => {
    output += text + '\n';
    console.log(text);
  };
  
  log('=== CHART DATA SEARCH AND UPDATE ===');
  log(`Date: ${new Date().toISOString()}`);
  log('');
  
  // Try different possible database paths
  const possiblePaths = [
    './dashboard.db',
    './data/dashboard.db',
    './tallman.db',
    './data/tallman.db'
  ];
  
  let db = null;
  let dbPath = null;
  
  // Try to open each database until we find one that works
  for (const path of possiblePaths) {
    try {
      if (fs.existsSync(path)) {
        db = await openDatabase(path);
        dbPath = path;
        break;
      }
    } catch (error) {
      log(`Error opening database ${path}: ${error.message}`);
    }
  }
  
  if (!db) {
    log('Could not open any database. Exiting.');
    fs.writeFileSync(outputFile, output);
    return;
  }
  
  try {
    log(`Using database at ${dbPath}`);
    
    // Check if chart_data table exists
    const tables = await runQuery(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='chart_data'");
    
    if (tables.length === 0) {
      log('chart_data table not found. Creating it...');
      
      // Create the chart_data table
      await runUpdate(db, `
        CREATE TABLE IF NOT EXISTS chart_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chart_name TEXT,
          variable_name TEXT,
          server_name TEXT,
          db_table_name TEXT,
          sql_expression TEXT,
          production_sql_expression TEXT,
          value TEXT,
          transformer TEXT,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      log('chart_data table created successfully.');
      
      // Insert initial data for key metrics
      log('Inserting initial data for key metrics...');
      
      for (const [metricName, data] of Object.entries(correctSqlExpressions)) {
        await runUpdate(db, `
          INSERT INTO chart_data (
            chart_name,
            variable_name,
            server_name,
            db_table_name,
            sql_expression,
            production_sql_expression,
            value,
            transformer
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'Key Metrics',
          metricName,
          'P21',
          data.tableName,
          data.sql,
          data.sql,
          '0',
          ''
        ]);
        
        log(`Inserted data for ${metricName}`);
      }
    } else {
      log('chart_data table found. Checking for key metrics data...');
      
      // Check if key metrics data exists
      const keyMetrics = await runQuery(db, `
        SELECT * FROM chart_data 
        WHERE chart_name = 'Key Metrics' 
        OR variable_name IN (
          'Total Orders', 
          'Open Orders', 
          'Open Orders 2', 
          'Daily Revenue', 
          'Open Invoices', 
          'Orders Backlogged', 
          'Total Monthly Sales'
        )
      `);
      
      if (keyMetrics.length === 0) {
        log('No key metrics data found. Inserting initial data...');
        
        // Insert initial data for key metrics
        for (const [metricName, data] of Object.entries(correctSqlExpressions)) {
          await runUpdate(db, `
            INSERT INTO chart_data (
              chart_name,
              variable_name,
              server_name,
              db_table_name,
              sql_expression,
              production_sql_expression,
              value,
              transformer
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            'Key Metrics',
            metricName,
            'P21',
            data.tableName,
            data.sql,
            data.sql,
            '0',
            ''
          ]);
          
          log(`Inserted data for ${metricName}`);
        }
      } else {
        log(`Found ${keyMetrics.length} key metrics rows. Updating SQL expressions...`);
        
        // Update SQL expressions for key metrics
        for (const row of keyMetrics) {
          const metricName = row.variable_name;
          
          if (correctSqlExpressions[metricName]) {
            const data = correctSqlExpressions[metricName];
            
            await runUpdate(db, `
              UPDATE chart_data
              SET 
                sql_expression = ?,
                production_sql_expression = ?,
                db_table_name = ?
              WHERE id = ?
            `, [
              data.sql,
              data.sql,
              data.tableName,
              row.id
            ]);
            
            log(`Updated SQL expressions for ${metricName}`);
          }
        }
      }
    }
    
    // Verify the chart_data table
    log('\nVerifying chart_data table...');
    
    const chartData = await runQuery(db, 'SELECT * FROM chart_data');
    log(`Found ${chartData.length} rows in chart_data table.`);
    
    if (chartData.length > 0) {
      log('\nSample data:');
      
      for (let i = 0; i < Math.min(chartData.length, 7); i++) {
        const row = chartData[i];
        log(`\n--- Row ${i+1} ---`);
        log(`ID: ${row.id}`);
        log(`Chart Name: ${row.chart_name}`);
        log(`Variable Name: ${row.variable_name}`);
        log(`Server Name: ${row.server_name}`);
        log(`Table Name: ${row.db_table_name}`);
        log(`SQL Expression: ${row.sql_expression}`);
        log(`Production SQL Expression: ${row.production_sql_expression}`);
        log(`Value: ${row.value}`);
      }
    }
    
    log('\nOperation completed successfully.');
    
  } catch (error) {
    log(`Error: ${error.message}`);
    log(error.stack);
  } finally {
    // Close the database connection
    if (db) {
      db.close((err) => {
        if (err) {
          log(`Error closing database: ${err.message}`);
        } else {
          log('Database connection closed.');
        }
      });
    }
    
    // Write output to file
    fs.writeFileSync(outputFile, output);
    console.log(`\nResults written to ${outputFile}`);
  }
}

// Run the function
findAndUpdateChartData().catch(error => {
  console.error('Unhandled error:', error);
  fs.appendFileSync('chart-data-results.txt', `\nUnhandled error: ${error}`);
});
