const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new sqlite3.Database(path.join(dataDir, 'dashboard.db'));

// Create test tables first
db.serialize(() => {
  // Drop existing tables
  db.run('DROP TABLE IF EXISTS customer_metrics');
  db.run('DROP TABLE IF EXISTS por_metrics');
  db.run('DROP TABLE IF EXISTS inventory');
  db.run('DROP TABLE IF EXISTS chart_data');

  // Create test tables
  db.run(`
    CREATE TABLE customer_metrics (
      id INTEGER PRIMARY KEY,
      date TEXT,
      customer_count INTEGER
    )
  `);

  db.run(`
    CREATE TABLE por_metrics (
      id INTEGER PRIMARY KEY,
      date TEXT,
      amount REAL
    )
  `);

  db.run(`
    CREATE TABLE inventory (
      id INTEGER PRIMARY KEY,
      date TEXT,
      quantity INTEGER
    )
  `);

  // Insert test data for each month
  const months = Array.from({length: 12}, (_, i) => {
    const date = new Date(2024, i, 1);
    return date.toISOString().split('T')[0];
  });

  // Insert customer metrics test data
  const customerStmt = db.prepare('INSERT INTO customer_metrics (date, customer_count) VALUES (?, ?)');
  months.forEach(date => {
    customerStmt.run(date, Math.floor(Math.random() * 1000) + 500); // Random between 500-1500
  });
  customerStmt.finalize();

  // Insert POR metrics test data
  const porStmt = db.prepare('INSERT INTO por_metrics (date, amount) VALUES (?, ?)');
  months.forEach(date => {
    porStmt.run(date, Math.floor(Math.random() * 50000) + 25000); // Random between 25000-75000
  });
  porStmt.finalize();

  // Insert inventory test data
  const inventoryStmt = db.prepare('INSERT INTO inventory (date, quantity) VALUES (?, ?)');
  months.forEach(date => {
    inventoryStmt.run(date, Math.floor(Math.random() * 1000) + 200); // Random between 200-1200
  });
  inventoryStmt.finalize();

  // Create chart_data table
  db.run(`
    CREATE TABLE chart_data (
      id TEXT PRIMARY KEY,
      chart_name TEXT NOT NULL,
      variable_name TEXT NOT NULL,
      server_name TEXT NOT NULL,
      db_table_name TEXT NOT NULL,
      sql_expression TEXT NOT NULL,
      production_sql_expression TEXT NOT NULL,
      value TEXT,
      last_updated TEXT
    )
  `);
});

// Helper function to generate monthly data for a year
function generateMonthlyData(baseId, chartName, serverName, tableName, sqlTemplate, productionSqlTemplate) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return months.map((month, index) => ({
    id: `${baseId}_${index + 1}`,
    chart_name: chartName,
    variable_name: month,
    server_name: serverName,
    db_table_name: tableName,
    sql_expression: sqlTemplate.replace('{month}', index + 1),
    production_sql_expression: productionSqlTemplate.replace('{month}', index + 1),
    value: '0',
    last_updated: new Date().toISOString()
  }));
}

// Helper function to generate daily data for a week
function generateDailyData(chartName, metrics, serverName) {
  const days = ['Today', 'Yesterday', 'Day -2', 'Day -3', 'Day -4', 'Day -5', 'Day -6'];
  let data = [];
  
  metrics.forEach(metric => {
    data = data.concat(days.map((day, index) => ({
      id: `${chartName}_${metric.name}_${index}`,
      chart_name: chartName,
      variable_name: `${metric.name} - ${day}`,
      server_name: serverName,
      db_table_name: metric.tableName,
      sql_expression: metric.sqlTemplate.replace('{day}', index),
      production_sql_expression: metric.productionSqlTemplate.replace('{day}', index),
      value: '0',
      last_updated: new Date().toISOString()
    })));
  });
  
  return data;
}

// Generate sample data
const sampleData = [
  // Key Metrics (expanded)
  {
    id: 'metric_1',
    chart_name: 'Key Metrics',
    variable_name: 'Total Revenue',
    server_name: 'P21',
    db_table_name: 'por_metrics',
    sql_expression: 'SELECT COALESCE(SUM(amount), 0) FROM por_metrics WHERE date >= date("now", "-30 days")',
    production_sql_expression: 'SELECT SUM(amount) FROM revenue WHERE date >= DATEADD(day, -30, GETDATE())',
    value: '0',
    last_updated: new Date().toISOString()
  },
  {
    id: 'metric_2',
    chart_name: 'Key Metrics',
    variable_name: 'Total Orders',
    server_name: 'P21',
    db_table_name: 'customer_metrics',
    sql_expression: 'SELECT COALESCE(SUM(customer_count), 0) FROM customer_metrics WHERE date >= date("now", "-30 days")',
    production_sql_expression: 'SELECT COUNT(*) FROM orders WHERE date >= DATEADD(day, -30, GETDATE())',
    value: '0',
    last_updated: new Date().toISOString()
  },
  {
    id: 'metric_3',
    chart_name: 'Key Metrics',
    variable_name: 'Active Customers',
    server_name: 'P21',
    db_table_name: 'customer_metrics',
    sql_expression: 'SELECT COALESCE(AVG(customer_count), 0) FROM customer_metrics WHERE date >= date("now", "-90 days")',
    production_sql_expression: 'SELECT COUNT(*) FROM customers WHERE last_order_date >= DATEADD(day, -90, GETDATE())',
    value: '0',
    last_updated: new Date().toISOString()
  },
  {
    id: 'metric_4',
    chart_name: 'Key Metrics',
    variable_name: 'Average Order Value',
    server_name: 'P21',
    db_table_name: 'por_metrics',
    sql_expression: 'SELECT COALESCE(AVG(amount), 0) FROM por_metrics WHERE date >= date("now", "-30 days")',
    production_sql_expression: 'SELECT AVG(total_amount) FROM orders WHERE date >= DATEADD(day, -30, GETDATE())',
    value: '0',
    last_updated: new Date().toISOString()
  },
  {
    id: 'metric_5',
    chart_name: 'Key Metrics',
    variable_name: 'Web Orders',
    server_name: 'P21',
    db_table_name: 'customer_metrics',
    sql_expression: 'SELECT COALESCE(COUNT(*), 0) FROM customer_metrics WHERE date >= date("now", "-30 days")',
    production_sql_expression: 'SELECT COUNT(*) FROM web_orders WHERE date >= DATEADD(day, -30, GETDATE())',
    value: '0',
    last_updated: new Date().toISOString()
  },
  {
    id: 'metric_6',
    chart_name: 'Key Metrics',
    variable_name: 'Inventory Value',
    server_name: 'P21',
    db_table_name: 'inventory',
    sql_expression: 'SELECT COALESCE(SUM(quantity), 0) FROM inventory WHERE date >= date("now", "-30 days")',
    production_sql_expression: 'SELECT SUM(value) FROM inventory WHERE date >= DATEADD(day, -30, GETDATE())',
    value: '0',
    last_updated: new Date().toISOString()
  }
];

// Add Historical Data (12 months × 2 servers × 2 metrics)
sampleData.push(...generateMonthlyData(
  'hist_p21_orders',
  'Historical Data',
  'P21',
  'customer_metrics',
  'SELECT COALESCE(SUM(customer_count), 0) FROM customer_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT COUNT(*) FROM orders WHERE MONTH(date) = {month}'
));

sampleData.push(...generateMonthlyData(
  'hist_p21_revenue',
  'Historical Data',
  'P21',
  'por_metrics',
  'SELECT COALESCE(SUM(amount), 0) FROM por_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT SUM(amount) FROM revenue WHERE MONTH(date) = {month}'
));

sampleData.push(...generateMonthlyData(
  'hist_por_orders',
  'Historical Data',
  'POR',
  'customer_metrics',
  'SELECT COALESCE(SUM(customer_count), 0) FROM customer_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT COUNT(*) FROM orders WHERE MONTH(date) = {month}'
));

sampleData.push(...generateMonthlyData(
  'hist_por_revenue',
  'Historical Data',
  'POR',
  'por_metrics',
  'SELECT COALESCE(SUM(amount), 0) FROM por_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT SUM(amount) FROM revenue WHERE MONTH(date) = {month}'
));

// Add Accounts Data (12 months × 2 types)
sampleData.push(...generateMonthlyData(
  'ap',
  'Accounts',
  'P21',
  'por_metrics',
  'SELECT COALESCE(SUM(amount), 0) FROM por_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT SUM(amount) FROM accounts_payable WHERE MONTH(date) = {month}'
));

sampleData.push(...generateMonthlyData(
  'ar',
  'Accounts',
  'P21',
  'por_metrics',
  'SELECT COALESCE(SUM(amount), 0) FROM por_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT SUM(amount) FROM accounts_receivable WHERE MONTH(date) = {month}'
));

// Add Site Distribution Data (4 sites × 3 metrics)
const sites = ['Columbus', 'Addison', 'Lake City', 'Other'];
const siteMetrics = ['Orders', 'Revenue', 'Inventory'];
sites.forEach((site, siteIndex) => {
  siteMetrics.forEach((metric, metricIndex) => {
    sampleData.push({
      id: `site_${siteIndex + 1}_${metricIndex + 1}`,
      chart_name: 'Site Distribution',
      variable_name: `${site} ${metric}`,
      server_name: 'P21',
      db_table_name: 'inventory',
      sql_expression: `SELECT COALESCE(SUM(quantity), 0) FROM inventory WHERE strftime('%m', date) = strftime('%m', 'now')`,
      production_sql_expression: `SELECT COALESCE(SUM(${metric.toLowerCase()}), ${1000 * (siteIndex + 1)}) FROM site_metrics WHERE site = '${site}'`,
      value: String(1000 * (siteIndex + 1)),
      last_updated: new Date().toISOString()
    });
  });
});

// Add AR Aging Data (5 categories × 2 metrics)
const agingCategories = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
const agingMetrics = ['Amount', 'Count'];
agingCategories.forEach((category, catIndex) => {
  agingMetrics.forEach((metric, metricIndex) => {
    sampleData.push({
      id: `aging_${catIndex + 1}_${metricIndex + 1}`,
      chart_name: 'AR Aging',
      variable_name: `${category} ${metric}`,
      server_name: 'P21',
      db_table_name: 'por_metrics',
      sql_expression: `SELECT COALESCE(${metric === 'Amount' ? 'SUM(amount)' : 'COUNT(*)'}, 0) FROM por_metrics WHERE strftime('%m', date) = strftime('%m', 'now')`,
      production_sql_expression: `SELECT ${metric === 'Amount' ? 'SUM(amount)' : 'COUNT(*)'} FROM ar_aging WHERE category = '${category}'`,
      value: '0',
      last_updated: new Date().toISOString()
    });
  });
});

// Add Daily Orders Data (7 days)
const dailyOrdersData = generateDailyData('Daily Orders', [
  { name: 'Orders Count', tableName: 'orders', sqlTemplate: 'SELECT COUNT(*) FROM orders WHERE DATE(order_date) = DATE(\'now\', \'-{day} days\')', productionSqlTemplate: 'SELECT COUNT(*) FROM P21.dbo.orders WHERE DATE(order_date) = DATE(\'now\', \'-{day} days\')' },
  { name: 'Orders Value', tableName: 'orders', sqlTemplate: 'SELECT SUM(total_amount) FROM orders WHERE DATE(order_date) = DATE(\'now\', \'-{day} days\')', productionSqlTemplate: 'SELECT SUM(total_amount) FROM P21.dbo.orders WHERE DATE(order_date) = DATE(\'now\', \'-{day} days\')' }
], 'P21');

sampleData.push(...dailyOrdersData);

// Add Web Orders Data (12 months × 2 metrics)
sampleData.push(...generateMonthlyData(
  'web_count',
  'Web Orders',
  'P21',
  'customer_metrics',
  'SELECT COALESCE(SUM(customer_count), 0) FROM customer_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT COUNT(*) FROM web_orders WHERE MONTH(date) = {month}'
));

sampleData.push(...generateMonthlyData(
  'web_value',
  'Web Orders',
  'P21',
  'por_metrics',
  'SELECT COALESCE(SUM(amount), 0) FROM por_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT SUM(amount) FROM web_orders WHERE MONTH(date) = {month}'
));

// Add Customer Metrics Data (12 months × 3 metrics)
sampleData.push(...generateMonthlyData(
  'cust_new',
  'Customer Metrics',
  'P21',
  'customer_metrics',
  'SELECT COALESCE(customer_count, 0) FROM customer_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT COUNT(*) FROM customers WHERE MONTH(join_date) = {month}'
));

sampleData.push(...generateMonthlyData(
  'cust_active',
  'Customer Metrics',
  'P21',
  'customer_metrics',
  'SELECT COALESCE(customer_count, 0) FROM customer_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT COUNT(*) FROM customers WHERE MONTH(last_order_date) = {month}'
));

sampleData.push(...generateMonthlyData(
  'cust_returning',
  'Customer Metrics',
  'P21',
  'customer_metrics',
  'SELECT COALESCE(customer_count, 0) FROM customer_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT COUNT(*) FROM customers WHERE MONTH(last_order_date) = {month} AND order_count > 1'
));

// Add POR Overview Data (12 months × 2 metrics)
sampleData.push(...generateMonthlyData(
  'por_revenue',
  'POR Overview',
  'POR',
  'por_metrics',
  'SELECT COALESCE(amount, 0) FROM por_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT SUM(amount) FROM revenue WHERE MONTH(date) = {month}'
));

sampleData.push(...generateMonthlyData(
  'por_orders',
  'POR Overview',
  'POR',
  'por_metrics',
  'SELECT COALESCE(amount, 0) FROM por_metrics WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT COUNT(*) FROM orders WHERE MONTH(date) = {month}'
));

// Add Inventory Data (12 months × 3 metrics)
sampleData.push(...generateMonthlyData(
  'inv_quantity',
  'Inventory',
  'P21',
  'inventory',
  'SELECT COALESCE(quantity, 0) FROM inventory WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT SUM(quantity) FROM inventory WHERE MONTH(date) = {month}'
));

sampleData.push(...generateMonthlyData(
  'inv_value',
  'Inventory',
  'P21',
  'inventory',
  'SELECT COALESCE(quantity * 100, 0) FROM inventory WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT SUM(value) FROM inventory WHERE MONTH(date) = {month}'
));

sampleData.push(...generateMonthlyData(
  'inv_turnover',
  'Inventory',
  'P21',
  'inventory',
  'SELECT COALESCE(quantity, 0) FROM inventory WHERE strftime("%m", date) = printf("%02d", {month})',
  'SELECT AVG(turnover_rate) FROM inventory WHERE MONTH(date) = {month}'
));

// Insert sample data
db.serialize(() => {
  // Insert sample data
  const stmt = db.prepare(`
    INSERT INTO chart_data (
      id, chart_name, variable_name, server_name, db_table_name,
      sql_expression, production_sql_expression, value, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  console.log('Total rows to insert:', sampleData.length);
  
  sampleData.forEach((row, index) => {
    console.log(`Inserting row ${index + 1}/${sampleData.length}: ${row.chart_name} - ${row.variable_name}`);
    stmt.run(
      row.id,
      row.chart_name,
      row.variable_name,
      row.server_name,
      row.db_table_name,
      row.sql_expression,
      row.production_sql_expression,
      row.value,
      row.last_updated,
      (err) => {
        if (err) {
          console.error('Error inserting row:', err);
          console.error('Row data:', row);
        }
      }
    );
  });

  stmt.finalize();

  // Verify data
  db.all('SELECT COUNT(*) as count FROM chart_data', (err, rows) => {
    if (err) {
      console.error('Error verifying data:', err);
      return;
    }
    console.log(`Initialized ${rows[0].count} rows of sample data`);
    
    // Log some sample rows to verify data
    db.all('SELECT * FROM chart_data LIMIT 5', (err, rows) => {
      if (err) {
        console.error('Error fetching sample rows:', err);
        return;
      }
      console.log('Sample rows:', rows);
    });
  });
});

// Close the database connection
db.close();
