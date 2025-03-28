const sqlite3 = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Path to the test database
const dbPath = path.resolve(dataDir, 'test.db');
console.log(`Database path: ${dbPath}`);

try {
  // Create or open the database
  console.log(`Creating/opening test database at ${dbPath}`);
  const db = sqlite3(dbPath);

  // Read the SQL setup script
  const sqlPath = path.resolve(process.cwd(), 'lib', 'db', 'test-data.sql');
  console.log(`Reading SQL script from ${sqlPath}`);
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL script not found at ${sqlPath}`);
    process.exit(1);
  }
  
  const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

  // Execute the SQL script
  console.log('Executing SQL setup script...');
  db.exec(sqlScript);
  console.log('SQL script executed successfully');

  // Create test_data_mapping table
  console.log('Creating test_data_mapping table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_data_mapping (
      id TEXT PRIMARY KEY,
      test_value TEXT NOT NULL
    )
  `);

  // Insert some sample test data mappings
  console.log('Inserting sample test data mappings...');
  const insertStmt = db.prepare('INSERT OR REPLACE INTO test_data_mapping (id, test_value) VALUES (?, ?)');

  // Sample data for key metrics
  const sampleData = [
    { id: 'key_metric_total_orders', value: 1250 },
    { id: 'key_metric_open_orders', value: 325 },
    { id: 'key_metric_pending_orders', value: 75 },
    { id: 'key_metric_daily_sales', value: 45000 },
    { id: 'key_metric_ar_balance', value: 850000 },
    { id: 'key_metric_backlog', value: 125 },
    { id: 'key_metric_monthly_sales', value: 1250000 }
  ];

  // Insert the sample data
  const transaction = db.transaction(() => {
    for (const item of sampleData) {
      insertStmt.run(item.id, item.value.toString());
      console.log(`Set test value for ${item.id}: ${item.value}`);
    }
  });

  transaction();
  console.log('Sample test data inserted successfully');

  // Insert sample data into the tables
  console.log('Inserting sample data into tables...');

  // Sample data for pub_oe_hdr
  db.exec(`
    INSERT INTO pub_oe_hdr (order_id, order_date, total_amount, status, customer_id)
    VALUES 
      (1, datetime('now', '-1 day'), 1500.00, 'Open', 101),
      (2, datetime('now', '-2 day'), 2500.00, 'Closed', 102),
      (3, datetime('now', '-3 day'), 3500.00, 'Open', 103),
      (4, datetime('now', '-4 day'), 4500.00, 'Pending', 104),
      (5, datetime('now', '-5 day'), 5500.00, 'Backlogged', 105)
  `);

  // Close the database
  db.close();
  console.log('Test database initialization complete');
} catch (error) {
  console.error('Error during database initialization:', error);
}
