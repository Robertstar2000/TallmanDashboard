const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('data/dashboard.db');

// Initialize tables
db.serialize(() => {
  // Recreate chart_data table
  db.run('DROP TABLE IF EXISTS chart_data');
  db.run(`CREATE TABLE chart_data (
    id TEXT PRIMARY KEY,
    chart_name TEXT NOT NULL,
    variable_name TEXT NOT NULL,
    server_name TEXT NOT NULL,
    db_table_name TEXT NOT NULL,
    sql_expression TEXT NOT NULL,
    production_sql_expression TEXT NOT NULL,
    value TEXT DEFAULT "0",
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert initial data
  const stmt = db.prepare(`
    INSERT INTO chart_data (
      id, chart_name, variable_name, server_name, db_table_name,
      sql_expression, production_sql_expression, value
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Key Metrics
  const metrics = [
    ['total_orders', 'Key Metrics', 'Total Orders', 'P21', 'p21_orders',
     'SELECT COUNT(*) as value FROM p21_orders',
     'SELECT COUNT(*) FROM P21.dbo.orders WHERE status != \'cancelled\'',
     '0'],
    ['open_orders', 'Key Metrics', 'Open Orders', 'P21', 'p21_orders',
     'SELECT COUNT(*) as value FROM p21_orders WHERE status = \'open\'',
     'SELECT COUNT(*) FROM P21.dbo.orders WHERE status = \'open\'',
     '0'],
    ['daily_revenue', 'Key Metrics', 'Daily Revenue', 'P21', 'p21_sales',
     'SELECT SUM(amount) as value FROM p21_sales WHERE date(sale_date) = date(\'now\')',
     'SELECT SUM(amount) FROM P21.dbo.sales WHERE CAST(sale_date AS DATE) = CAST(GETDATE() AS DATE)',
     '0'],
    ['open_invoices', 'Key Metrics', 'Open Invoices', 'P21', 'p21_invoices',
     'SELECT SUM(amount) as value FROM p21_invoices WHERE status = \'open\'',
     'SELECT SUM(amount) FROM P21.dbo.invoices WHERE status = \'open\'',
     '0'],
    ['orders_backlogged', 'Key Metrics', 'Orders Backlogged', 'P21', 'p21_orders',
     'SELECT COUNT(*) as value FROM p21_orders WHERE status = \'backlogged\'',
     'SELECT COUNT(*) FROM P21.dbo.orders WHERE status = \'backlogged\'',
     '0']
  ];

  // Insert metrics
  metrics.forEach(metric => stmt.run(...metric));

  // Generate monthly data points
  const months = Array.from({length: 12}, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  }).reverse();

  // Historical Data
  months.forEach(month => {
    stmt.run(
      `historical_p21_${month}`,
      'Historical Data',
      'P21 Revenue',
      'P21',
      'p21_sales',
      `SELECT SUM(amount) as value FROM p21_sales WHERE strftime('%Y-%m', sale_date) = '${month}'`,
      `SELECT SUM(amount) FROM P21.dbo.sales WHERE FORMAT(sale_date, 'yyyy-MM') = '${month}'`,
      '0'
    );
    stmt.run(
      `historical_por_${month}`,
      'Historical Data',
      'POR Revenue',
      'POR',
      'por_rentals',
      `SELECT SUM(rental_value) as value FROM por_rentals WHERE strftime('%Y-%m', rental_date) = '${month}'`,
      `SELECT SUM(rental_value) FROM POR.dbo.rentals WHERE FORMAT(rental_date, 'yyyy-MM') = '${month}'`,
      '0'
    );
  });

  // Site Distribution
  ['Columbus', 'Jackson', 'Mill City'].forEach(site => {
    stmt.run(
      `site_dist_${site.toLowerCase()}`,
      'Site Distribution',
      site,
      'P21',
      'p21_sales',
      `SELECT SUM(amount) as value FROM p21_sales WHERE location = '${site}'`,
      `SELECT SUM(amount) FROM P21.dbo.sales WHERE location = '${site}'`,
      '0'
    );
  });

  // AR Aging
  ['Current', '1-30', '31-60', '61-90', '90+'].forEach(range => {
    stmt.run(
      `ar_aging_${range.toLowerCase().replace('+', 'plus')}`,
      'AR Aging',
      range,
      'P21',
      'ar_aging',
      `SELECT SUM(amount) as value FROM ar_aging WHERE range_days = '${range}' AND date = date('now')`,
      `SELECT SUM(amount) FROM P21.dbo.ar_aging WHERE range_days = '${range}' AND CAST(date AS DATE) = CAST(GETDATE() AS DATE)`,
      '0'
    );
  });

  // Generate daily dates
  const dailyDates = Array.from({length: 30}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().slice(0, 10);
  }).reverse();

  // Daily Orders
  dailyDates.forEach(date => {
    stmt.run(
      `daily_orders_${date}`,
      'Daily Orders',
      'Orders',
      'P21',
      'p21_orders',
      `SELECT COUNT(*) as value FROM p21_orders WHERE date(order_date) = '${date}'`,
      `SELECT COUNT(*) FROM P21.dbo.orders WHERE CAST(order_date AS DATE) = '${date}'`,
      '0'
    );
  });

  // Web Orders
  dailyDates.forEach(date => {
    ['Orders', 'Revenue'].forEach(metric => {
      stmt.run(
        `web_orders_${metric.toLowerCase()}_${date}`,
        'Web Orders',
        metric,
        'P21',
        'por_web_orders',
        `SELECT ${metric === 'Orders' ? 'COUNT(*)' : 'SUM(amount)'} as value FROM por_web_orders WHERE date(order_date) = '${date}'`,
        `SELECT ${metric === 'Orders' ? 'COUNT(*)' : 'SUM(amount)'} FROM POR.dbo.web_orders WHERE CAST(order_date AS DATE) = '${date}'`,
        '0'
      );
    });
  });

  stmt.finalize();
});

db.close();
