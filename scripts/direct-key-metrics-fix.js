// Script to directly fix failing Key Metrics SQL expressions in the database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Simplified Key Metrics SQL expressions that should work reliably
const simplifiedKeyMetrics = [
  {
    id: "118",
    name: "Open Orders (/day)",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -7, GETDATE())"
  },
  {
    id: "119",
    name: "All Open Orders",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    id: "120",
    name: "Daily Revenue",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -7, GETDATE())"
  },
  {
    id: "121",
    name: "Open Invoices",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  }
];

// Main function to update Key Metrics SQL expressions
async function updateKeyMetrics() {
  console.log('Updating Key Metrics SQL expressions in the database...');
  
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each Key Metric
    for (const metric of simplifiedKeyMetrics) {
      await db.run(`
        UPDATE chart_data 
        SET production_sql_expression = ? 
        WHERE id = ?
      `, [metric.sql, metric.id]);
      
      console.log(`Updated SQL expression for ${metric.name} (ID: ${metric.id})`);
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Close the database connection
    await db.close();
    
    console.log('Successfully updated Key Metrics SQL expressions');
    console.log('Please restart the application or click the "Load DB" button in the admin panel to see the changes');
  } catch (error) {
    console.error('Error updating Key Metrics SQL expressions:', error);
  }
}

// Run the main function
updateKeyMetrics();
