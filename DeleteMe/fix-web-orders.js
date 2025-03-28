// Script to fix Web Orders chart name in the database
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Open the database
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');
console.log(`Opening database at: ${dbPath}`);

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath);

try {
  // Start a transaction
  db.prepare('BEGIN TRANSACTION').run();

  // First, check the current state of Web Orders data
  const webOrdersData = db.prepare("SELECT id, chart_name, variable_name FROM chart_data WHERE id LIKE '6%' OR id LIKE '7%'").all();
  console.log(`Found ${webOrdersData.length} potential Web Orders rows`);

  // Identify rows that should be Web Orders based on ID pattern
  const webOrdersIds = [];
  for (let i = 64; i <= 75; i++) {
    webOrdersIds.push(i.toString()); // Orders Count rows
    webOrdersIds.push(`${i}R`);      // Revenue rows
  }

  // Update all Web Orders rows
  let updatedCount = 0;
  for (const id of webOrdersIds) {
    const result = db.prepare("UPDATE chart_data SET chart_name = 'Web Orders' WHERE id = ?").run(id);
    if (result.changes > 0) {
      updatedCount++;
      console.log(`Updated row with ID ${id} to have chart_name = 'Web Orders'`);
    }
  }
  
  console.log(`Updated ${updatedCount} rows with Web Orders chart name`);

  // Verify the update
  const verifyRows = db.prepare("SELECT id, chart_name, variable_name FROM chart_data WHERE chart_name = 'Web Orders'").all();
  const ordersCount = verifyRows.filter(row => row.variable_name === 'Orders Count').length;
  const revenue = verifyRows.filter(row => row.variable_name === 'Revenue').length;
  
  console.log(`After update: Found ${verifyRows.length} Web Orders rows`);
  console.log(`Orders Count rows: ${ordersCount}, Revenue rows: ${revenue}`);

  // If we still don't have enough rows, try to insert missing ones from scratch
  if (ordersCount < 12 || revenue < 12) {
    console.log("Still missing some Web Orders rows. Attempting to fix by inserting missing rows...");
    
    // Define the structure for Web Orders rows
    const createWebOrderRow = (id, isRevenue, monthNum) => {
      const monthOffset = monthNum - 1;
      const variableName = isRevenue ? "Revenue" : "Orders Count";
      const calculation = isRevenue ? "SUM(order_total)" : "COUNT(*)";
      const rowId = isRevenue ? `${id}R` : id;
      
      return {
        id: rowId,
        chartName: "Web Orders",
        variableName: variableName,
        serverName: "P21",
        tableName: "oe_hdr",
        sqlExpression: isRevenue 
          ? `SELECT SUM(order_total) as value FROM orders WHERE order_source = 'web' AND strftime('%Y-%m', date) = strftime('%Y-%m', datetime('now', '-${monthOffset} month'))`
          : `SELECT COUNT(*) as value FROM orders WHERE order_source = 'web' AND strftime('%Y-%m', date) = strftime('%Y-%m', datetime('now', '-${monthOffset} month'))`,
        productionSqlExpression: isRevenue
          ? `SELECT SUM(order_total) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'WEB' AND FORMAT(order_date, 'yyyy-MM') = FORMAT(DATEADD(month, -${monthOffset}, GETDATE()), 'yyyy-MM')`
          : `SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'WEB' AND FORMAT(order_date, 'yyyy-MM') = FORMAT(DATEADD(month, -${monthOffset}, GETDATE()), 'yyyy-MM')`,
        value: "0",
        transformer: "number",
        lastUpdated: new Date().toISOString()
      };
    };

    // Check which rows are missing and insert them
    const existingIds = verifyRows.map(row => row.id);
    let insertedCount = 0;
    
    for (let month = 1; month <= 12; month++) {
      const baseId = 63 + month;
      
      // Check and insert Orders Count row if missing
      if (!existingIds.includes(baseId.toString())) {
        const orderRow = createWebOrderRow(baseId.toString(), false, month);
        db.prepare(`
          INSERT INTO chart_data (id, chart_name, variable_name, server_name, db_table_name, sql_expression, production_sql_expression, value, transformer, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orderRow.id,
          orderRow.chartName,
          orderRow.variableName,
          orderRow.serverName,
          orderRow.tableName,
          orderRow.sqlExpression,
          orderRow.productionSqlExpression,
          orderRow.value,
          orderRow.transformer,
          orderRow.lastUpdated
        );
        insertedCount++;
        console.log(`Inserted missing Orders Count row for month ${month}`);
      }
      
      // Check and insert Revenue row if missing
      if (!existingIds.includes(`${baseId}R`)) {
        const revenueRow = createWebOrderRow(baseId.toString(), true, month);
        db.prepare(`
          INSERT INTO chart_data (id, chart_name, variable_name, server_name, db_table_name, sql_expression, production_sql_expression, value, transformer, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          revenueRow.id,
          revenueRow.chartName,
          revenueRow.variableName,
          revenueRow.serverName,
          revenueRow.tableName,
          revenueRow.sqlExpression,
          revenueRow.productionSqlExpression,
          revenueRow.value,
          revenueRow.transformer,
          revenueRow.lastUpdated
        );
        insertedCount++;
        console.log(`Inserted missing Revenue row for month ${month}`);
      }
    }
    
    console.log(`Inserted ${insertedCount} missing Web Orders rows`);
    
    // Final verification
    const finalVerifyRows = db.prepare("SELECT id, chart_name, variable_name FROM chart_data WHERE chart_name = 'Web Orders'").all();
    const finalOrdersCount = finalVerifyRows.filter(row => row.variable_name === 'Orders Count').length;
    const finalRevenue = finalVerifyRows.filter(row => row.variable_name === 'Revenue').length;
    
    console.log(`Final state: Found ${finalVerifyRows.length} Web Orders rows`);
    console.log(`Orders Count rows: ${finalOrdersCount}, Revenue rows: ${finalRevenue}`);
  }

  // Commit the transaction
  db.prepare('COMMIT').run();
  console.log('Web Orders data fix completed successfully');
  
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error fixing Web Orders data:', error);
} finally {
  // Close the database
  db.close();
}
