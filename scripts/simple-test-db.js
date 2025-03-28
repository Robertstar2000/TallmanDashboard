const sqlite3 = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Create an in-memory database for testing
console.log('Creating in-memory test database');
const db = sqlite3(':memory:');

// Create a simple test table
console.log('Creating test tables');
db.exec(`
  CREATE TABLE pub_oe_hdr (
    order_id INTEGER PRIMARY KEY,
    order_date TEXT,
    total_amount REAL,
    status TEXT,
    customer_id INTEGER
  );

  CREATE TABLE test_data_mapping (
    id TEXT PRIMARY KEY,
    test_value TEXT NOT NULL
  );
`);

// Insert sample data
console.log('Inserting sample data');
db.exec(`
  INSERT INTO pub_oe_hdr (order_id, order_date, total_amount, status, customer_id)
  VALUES 
    (1, '2025-03-10', 1500.00, 'Open', 101),
    (2, '2025-03-09', 2500.00, 'Closed', 102),
    (3, '2025-03-08', 3500.00, 'Open', 103),
    (4, '2025-03-07', 4500.00, 'Pending', 104),
    (5, '2025-03-06', 5500.00, 'Backlogged', 105);
`);

// Insert test data mappings
const insertStmt = db.prepare('INSERT INTO test_data_mapping (id, test_value) VALUES (?, ?)');
const sampleData = [
  { id: 'key_metric_total_orders', value: 1250 },
  { id: 'key_metric_open_orders', value: 325 },
  { id: 'key_metric_pending_orders', value: 75 }
];

for (const item of sampleData) {
  insertStmt.run(item.id, item.value.toString());
  console.log(`Set test value for ${item.id}: ${item.value}`);
}

// Test queries
console.log('\nRunning test queries:');

// Query 1: Count all orders
const totalOrders = db.prepare('SELECT COUNT(*) as value FROM pub_oe_hdr').get();
console.log('Total orders:', totalOrders.value);

// Query 2: Count open orders
const openOrders = db.prepare("SELECT COUNT(*) as value FROM pub_oe_hdr WHERE status = 'Open'").get();
console.log('Open orders:', openOrders.value);

// Query 3: Get test value from mapping
const testValue = db.prepare("SELECT test_value FROM test_data_mapping WHERE id = 'key_metric_open_orders'").get();
console.log('Test value for open orders:', testValue ? testValue.test_value : 'not found');

// Query 4: Sum of order amounts
const totalAmount = db.prepare('SELECT SUM(total_amount) as value FROM pub_oe_hdr').get();
console.log('Total order amount:', totalAmount.value);

// Close the database
db.close();
console.log('\nTest complete');
