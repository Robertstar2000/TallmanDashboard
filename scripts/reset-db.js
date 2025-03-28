const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(path.join(process.cwd(), 'data', 'dashboard.db'));

// Sample data for testing
const sampleData = [
  {
    id: '1',
    chart_name: 'Key Metrics',
    variable_name: 'Total Revenue',
    server_name: 'P21',
    db_table_name: 'revenue',
    sql_expression: 'SELECT SUM(amount) FROM revenue WHERE date >= DATE("now", "-30 days")',
    production_sql_expression: 'SELECT SUM(amount) FROM revenue WHERE date >= DATE("now", "-30 days")',
    value: '0',
    last_updated: new Date().toISOString()
  },
  {
    id: '2',
    chart_name: 'Key Metrics',
    variable_name: 'Total Orders',
    server_name: 'P21',
    db_table_name: 'orders',
    sql_expression: 'SELECT COUNT(*) FROM orders WHERE date >= DATE("now", "-30 days")',
    production_sql_expression: 'SELECT COUNT(*) FROM orders WHERE date >= DATE("now", "-30 days")',
    value: '0',
    last_updated: new Date().toISOString()
  }
];

// Reset database
db.serialize(() => {
  // Drop existing table
  db.run('DROP TABLE IF EXISTS chart_data');

  // Create table
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

  // Insert sample data
  const stmt = db.prepare(`
    INSERT INTO chart_data (
      id, chart_name, variable_name, server_name, db_table_name,
      sql_expression, production_sql_expression, value, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleData.forEach(row => {
    stmt.run(
      row.id,
      row.chart_name,
      row.variable_name,
      row.server_name,
      row.db_table_name,
      row.sql_expression,
      row.production_sql_expression,
      row.value,
      row.last_updated
    );
  });

  stmt.finalize();

  // Verify data
  db.all('SELECT * FROM chart_data', (err, rows) => {
    if (err) {
      console.error('Error verifying data:', err);
    } else {
      console.log('Database reset with sample data:', rows);
    }
    db.close();
  });
});
