import { AdminVariable } from '@/lib/types/dashboard';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';

// Helper function to create test data with numeric values
const createTestData = (id: number, name: string, value: number = 0): AdminVariable => ({
  id: String(id),
  name,
  category: name.split(' ')[0],
  variableName: name.toLowerCase().replace(/\s+/g, '_'),
  chartGroup: 'Test',
  subGroup: 'Test',
  value,
  sqlExpression: '',
  testSqlExpression: '',
  productionTable: '',
  testTable: '',
  sourceServer: 'P21',
  serverName: 'P21',
  tableName: '',
  updateInterval: 300,
  isMetric: false
});

export const testData: AdminVariable[] = [
  // Daily Orders - Last 7 days
  ...Array.from({ length: 7 }).map((_, i) => createTestData(i + 1, `Daily Orders ${7 - i}`, 0)),

  // Inventory Data - Current and Backlog for each category
  ...['Electronics', 'Tools', 'Safety', 'Lighting', 'Power', 'Accessories'].flatMap((category, i) => [
    createTestData(100 + i * 2, `Current ${category}`, 0),
    createTestData(101 + i * 2, `Backlog ${category}`, 0),
  ]),

  // AR Aging Buckets
  ...['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'].map((bucket, i) => createTestData(200 + i, `AR ${bucket}`, 0)),

  // Customer Growth - Last 12 months
  ...Array.from({ length: 12 }).map((_, i) => createTestData(300 + i, `Customer Growth Month ${12 - i}`, 0)),

  // Rental Equipment Status
  ...['Available', 'Rented', 'Maintenance', 'Reserved'].map((status, i) => createTestData(400 + i, `Equipment ${status}`, 0)),
];

export async function initializeTestDatabase(db: Database) {
  // Create test tables
  await db.exec(`
    -- Test Orders Table
    CREATE TABLE IF NOT EXISTS test_orders (
      order_id INTEGER PRIMARY KEY,
      order_date TEXT,
      customer_id INTEGER,
      total_amount REAL
    );

    -- Test Order Lines Table
    CREATE TABLE IF NOT EXISTS test_order_lines (
      line_id INTEGER PRIMARY KEY,
      order_id INTEGER,
      item_id INTEGER,
      qty_ordered INTEGER,
      qty_shipped INTEGER,
      unit_price REAL
    );

    -- Test Inventory Table
    CREATE TABLE IF NOT EXISTS test_inventory (
      item_id INTEGER PRIMARY KEY,
      category TEXT,
      qty_on_hand INTEGER,
      unit_cost REAL
    );

    -- Test AR Aging Table
    CREATE TABLE IF NOT EXISTS test_ar_aging (
      invoice_id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      amount REAL,
      aging_bucket TEXT
    );

    -- Test Customers Table
    CREATE TABLE IF NOT EXISTS test_customers (
      customer_id INTEGER PRIMARY KEY,
      customer_name TEXT,
      created_date TEXT
    );

    -- Test Equipment Table
    CREATE TABLE IF NOT EXISTS test_equipment (
      equipment_id INTEGER PRIMARY KEY,
      equipment_type TEXT,
      status TEXT
    );
  `);

  // Insert sample data
  await db.exec(`
    -- Sample Orders
    INSERT OR REPLACE INTO test_orders (order_id, order_date, customer_id, total_amount)
    SELECT 
      value, 
      DATE('now', '-' || (ABS(RANDOM() % 7)) || ' days'),
      ABS(RANDOM() % 100) + 1,
      ROUND(RANDOM() * 1000, 2)
    FROM generate_series(1, 100);

    -- Sample Inventory
    INSERT OR REPLACE INTO test_inventory (item_id, category, qty_on_hand, unit_cost)
    VALUES 
      (1, 'Electronics', 150, 299.99),
      (2, 'Tools', 200, 149.99),
      (3, 'Safety', 300, 79.99),
      (4, 'Lighting', 250, 89.99),
      (5, 'Power', 175, 199.99),
      (6, 'Accessories', 400, 29.99);

    -- Sample Order Lines
    INSERT OR REPLACE INTO test_order_lines (line_id, order_id, item_id, qty_ordered, qty_shipped, unit_price)
    SELECT 
      value,
      ABS(RANDOM() % 100) + 1,
      ABS(RANDOM() % 6) + 1,
      ABS(RANDOM() % 10) + 1,
      ABS(RANDOM() % 5),
      ROUND(RANDOM() * 100, 2)
    FROM generate_series(1, 200);

    -- Sample AR Aging
    INSERT OR REPLACE INTO test_ar_aging (invoice_id, customer_id, amount, aging_bucket)
    VALUES 
      (1, 1, 5000, 'Current'),
      (2, 2, 3000, '1-30 Days'),
      (3, 3, 2000, '31-60 Days'),
      (4, 4, 1000, '61-90 Days'),
      (5, 5, 500, '90+ Days');

    -- Sample Customers
    INSERT OR REPLACE INTO test_customers (customer_id, customer_name, created_date)
    SELECT 
      value,
      'Customer ' || value,
      DATE('now', '-' || (ABS(RANDOM() % 365)) || ' days')
    FROM generate_series(1, 100);

    -- Sample Equipment
    INSERT OR REPLACE INTO test_equipment (equipment_id, equipment_type, status)
    VALUES 
      (1, 'Lift', 'Available'),
      (2, 'Generator', 'Rented'),
      (3, 'Compressor', 'Maintenance'),
      (4, 'Forklift', 'Reserved'),
      (5, 'Lift', 'Available'),
      (6, 'Generator', 'Rented');
  `);
}
