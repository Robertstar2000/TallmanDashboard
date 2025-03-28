/**
 * Initialize Admin Database Complete
 * 
 * This script completely initializes the admin database with:
 * 1. Proper schema for admin_variables table
 * 2. Historical Data rows for both P21 and POR
 * 3. POR Overview rows with MS Access compatible SQL
 */

import fs from 'fs';
import path from 'path';
import { executeWrite } from '../lib/db/sqlite';

interface AdminVariable {
  id?: string;
  name: string;
  value: string | number;
  category: string;
  chart_group: string;
  chart_name: string;
  variable_name: string;
  server_name: string;
  sql_expression: string;
  production_sql_expression: string;
  table_name: string;
  timeframe?: string;
}

async function initializeAdminDbComplete() {
  try {
    console.log('Initializing Admin Database...');
    
    // Drop the admin_variables table if it exists
    const dropTableSql = "DROP TABLE IF EXISTS admin_variables";
    await executeWrite(dropTableSql);
    console.log('Dropped admin_variables table if it existed');
    
    // Create the admin_variables table with the proper schema
    const createTableSql = `
      CREATE TABLE admin_variables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        value TEXT,
        category TEXT,
        chart_group TEXT,
        chart_name TEXT,
        variable_name TEXT,
        server_name TEXT,
        sql_expression TEXT,
        production_sql_expression TEXT,
        table_name TEXT,
        timeframe TEXT
      )
    `;
    
    await executeWrite(createTableSql);
    console.log('Created admin_variables table with proper schema');
    
    // Create Historical Data rows for P21 and POR
    const historicalDataRows: AdminVariable[] = [];
    
    // Create 12 months of data for both P21 and POR
    for (let i = 1; i <= 12; i++) {
      const monthOffset = i === 1 ? 0 : -(i - 1);
      
      // P21 row for the month
      historicalDataRows.push({
        name: `Historical Data - P21 - Month ${i}`,
        value: "0",
        category: "P21",
        chart_group: "Historical Data",
        chart_name: "Historical Data",
        variable_name: "P21",
        server_name: "P21",
        sql_expression: `SELECT COALESCE(SUM(value), 0) as value FROM historical_data WHERE source = 'p21' AND strftime('%Y-%m', date) = strftime('%Y-%m', datetime('now', '${monthOffset === 0 ? '' : monthOffset + ' month'}'))`,
        production_sql_expression: `SELECT ISNULL(SUM(order_amt), 0) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE FORMAT(order_date, 'yyyy-MM') = FORMAT(DATEADD(month, ${monthOffset}, GETDATE()), 'yyyy-MM')`,
        table_name: "oe_hdr",
        timeframe: `Month ${i}`
      });
      
      // POR row for the month with MS Access SQL
      historicalDataRows.push({
        name: `Historical Data - POR - Month ${i}`,
        value: "0",
        category: "POR",
        chart_group: "Historical Data",
        chart_name: "Historical Data",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: `SELECT COALESCE(SUM(value), 0) as value FROM historical_data WHERE source = 'por' AND strftime('%Y-%m', date) = strftime('%Y-%m', datetime('now', '${monthOffset === 0 ? '' : monthOffset + ' month'}'))`,
        production_sql_expression: `SELECT Sum(Nz([Total],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],"yyyy-mm") = Format(DateAdd("m",${monthOffset},Date()),"yyyy-mm")`,
        table_name: "PurchaseOrder",
        timeframe: `Month ${i}`
      });
    }
    
    console.log(`Created ${historicalDataRows.length} Historical Data rows in memory`);
    
    // Create POR Overview rows
    const porOverviewRows: AdminVariable[] = [
      {
        name: "POR Overview - Open POs",
        value: "0",
        category: "POR",
        chart_group: "POR Overview",
        chart_name: "POR Overview",
        variable_name: "Open POs",
        server_name: "POR",
        sql_expression: "SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Open'",
        production_sql_expression: "SELECT Count(*) FROM [PurchaseOrder] WHERE [Status] = 'Open'",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR Overview - Closed POs",
        value: "0",
        category: "POR",
        chart_group: "POR Overview",
        chart_name: "POR Overview",
        variable_name: "Closed POs",
        server_name: "POR",
        sql_expression: "SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Closed'",
        production_sql_expression: "SELECT Count(*) FROM [PurchaseOrder] WHERE [Status] = 'Closed'",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR Overview - POs This Month",
        value: "0",
        category: "POR",
        chart_group: "POR Overview",
        chart_name: "POR Overview",
        variable_name: "POs This Month",
        server_name: "POR",
        sql_expression: `SELECT COUNT(*) FROM PurchaseOrder WHERE [Date] BETWEEN '${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]}' AND '${new Date().toISOString().split('T')[0]}'`,
        production_sql_expression: `SELECT Count(*) FROM [PurchaseOrder] WHERE [Date] BETWEEN #${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString()}# AND #${new Date().toLocaleDateString()}#`,
        table_name: "PurchaseOrder"
      },
      {
        name: "POR Overview - POs Last Month",
        value: "0",
        category: "POR",
        chart_group: "POR Overview",
        chart_name: "POR Overview",
        variable_name: "POs Last Month",
        server_name: "POR",
        sql_expression: `SELECT COUNT(*) FROM PurchaseOrder WHERE [Date] BETWEEN '${new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]}' AND '${new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]}'`,
        production_sql_expression: `SELECT Count(*) FROM [PurchaseOrder] WHERE [Date] BETWEEN #${new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString()}# AND #${new Date(new Date().getFullYear(), new Date().getMonth(), 0).toLocaleDateString()}#`,
        table_name: "PurchaseOrder"
      }
    ];
    
    console.log(`Created ${porOverviewRows.length} POR Overview rows in memory`);
    
    // Combine all rows
    const allRows = [...historicalDataRows, ...porOverviewRows];
    
    // Insert all rows into the admin_variables table
    for (const row of allRows) {
      const insertSql = `
        INSERT INTO admin_variables (
          name, 
          value, 
          category, 
          chart_group, 
          chart_name, 
          variable_name, 
          server_name, 
          sql_expression, 
          production_sql_expression,
          table_name,
          timeframe
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await executeWrite(insertSql, [
        row.name,
        row.value.toString(),
        row.category,
        row.chart_group,
        row.chart_name,
        row.variable_name,
        row.server_name,
        row.sql_expression,
        row.production_sql_expression,
        row.table_name,
        row.timeframe || null
      ]);
    }
    
    console.log(`Inserted ${allRows.length} rows into the admin_variables table`);
    
    // Verify the insertion
    const historicalDataCount = await executeWrite("SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'Historical Data'");
    const porOverviewCount = await executeWrite("SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'POR Overview'");
    
    const hdCount = Array.isArray(historicalDataCount) && historicalDataCount.length > 0 ? historicalDataCount[0].count : 0;
    const poCount = Array.isArray(porOverviewCount) && porOverviewCount.length > 0 ? porOverviewCount[0].count : 0;
    
    console.log(`\nVerified ${hdCount} Historical Data rows in the admin_variables table`);
    console.log(`Verified ${poCount} POR Overview rows in the admin_variables table`);
    
    // Save the SQL queries to files for reference
    const historicalDataSql = historicalDataRows.map(row => ({
      name: row.name,
      variableName: row.variable_name,
      serverName: row.server_name,
      timeframe: row.timeframe,
      sqlExpression: row.sql_expression,
      productionSqlExpression: row.production_sql_expression
    }));
    
    const porOverviewSql = porOverviewRows.map(row => ({
      name: row.name,
      variableName: row.variable_name,
      serverName: row.server_name,
      sqlExpression: row.sql_expression,
      productionSqlExpression: row.production_sql_expression
    }));
    
    fs.writeFileSync('historical-data-sql.json', JSON.stringify(historicalDataSql, null, 2));
    fs.writeFileSync('por-overview-sql.json', JSON.stringify(porOverviewSql, null, 2));
    
    console.log('\nSaved SQL queries to historical-data-sql.json and por-overview-sql.json');
    console.log('\nAdmin Database initialization complete');
  } catch (error) {
    console.error('Error initializing Admin Database:', error instanceof Error ? error.message : String(error));
  }
}

// Run the initialization
initializeAdminDbComplete().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
