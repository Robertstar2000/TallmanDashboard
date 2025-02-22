import { AdminVariable } from '@/lib/types/dashboard';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';

export const testData: AdminVariable[] = [
  // Daily Orders - Last 7 days
  ...Array.from({ length: 7 }).map((_, i) => ({
    id: i + 1,
    name: `Daily Orders ${7 - i}`,
    chartGroup: 'Daily Orders',
    subGroup: 'Orders',
    value: '0',
    calculation: '',
    sqlExpression: `
      SELECT COUNT(*) as order_count 
      FROM oe_hdr 
      WHERE order_date = DATE('now', '-${i} days')
    `,
    testSqlExpression: `
      SELECT COUNT(*) as order_count 
      FROM test_orders 
      WHERE order_date = DATE('now', '-${i} days')
    `,
    productionTable: 'oe_hdr',
    testTable: 'test_orders',
    sourceServer: 'P21',
    updateInterval: 60,
    isMetric: false,
    dataPoint: {
      x: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      y: 0
    }
  })),

  // Inventory Data - Current and Backlog for each category
  ...['Electronics', 'Tools', 'Safety', 'Lighting', 'Power', 'Accessories'].flatMap((category, i) => [
    {
      id: 100 + i * 2,
      name: `Current ${category}`,
      chartGroup: 'Inventory',
      subGroup: category,
      value: '0',
      calculation: '',
      sqlExpression: `
        SELECT SUM(qty_on_hand) as current_qty
        FROM item_master
        WHERE category = '${category}'
      `,
      testSqlExpression: `
        SELECT SUM(qty_on_hand) as current_qty
        FROM test_inventory
        WHERE category = '${category}'
      `,
      productionTable: 'item_master',
      testTable: 'test_inventory',
      sourceServer: 'P21',
      updateInterval: 300,
      isMetric: false,
      dataPoint: {
        x: category,
        y: 0
      }
    },
    {
      id: 101 + i * 2,
      name: `Backlog ${category}`,
      chartGroup: 'Inventory',
      subGroup: category,
      value: '0',
      calculation: '',
      sqlExpression: `
        SELECT SUM(qty_ordered - qty_shipped) as backlog_qty
        FROM oe_line
        JOIN item_master ON oe_line.item_id = item_master.item_id
        WHERE category = '${category}'
      `,
      testSqlExpression: `
        SELECT SUM(qty_ordered - qty_shipped) as backlog_qty
        FROM test_order_lines
        JOIN test_inventory ON test_order_lines.item_id = test_inventory.item_id
        WHERE category = '${category}'
      `,
      productionTable: 'oe_line',
      testTable: 'test_order_lines',
      sourceServer: 'P21',
      updateInterval: 300,
      isMetric: false,
      dataPoint: {
        x: category,
        y: 0
      }
    }
  ]),

  // AR Aging Buckets
  ...['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'].map((bucket, i) => ({
    id: 200 + i,
    name: `AR ${bucket}`,
    chartGroup: 'AR Aging',
    subGroup: bucket,
    value: '0',
    calculation: '',
    sqlExpression: `
      SELECT SUM(amount) as aging_amount
      FROM ar_open_items
      WHERE aging_bucket = '${bucket}'
    `,
    testSqlExpression: `
      SELECT SUM(amount) as aging_amount
      FROM test_ar_aging
      WHERE aging_bucket = '${bucket}'
    `,
    productionTable: 'ar_open_items',
    testTable: 'test_ar_aging',
    sourceServer: 'P21',
    updateInterval: 3600,
    isMetric: false,
    dataPoint: {
      x: bucket,
      y: 0
    }
  })),

  // Customer Growth - Last 12 months
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: 300 + i,
    name: `Customer Growth Month ${12 - i}`,
    chartGroup: 'Customer Growth',
    subGroup: 'Total Customers',
    value: '0',
    calculation: '',
    sqlExpression: `
      SELECT COUNT(DISTINCT customer_id) as customer_count
      FROM customer_master
      WHERE created_date <= DATE('now', '-${i} months')
    `,
    testSqlExpression: `
      SELECT COUNT(DISTINCT customer_id) as customer_count
      FROM test_customers
      WHERE created_date <= DATE('now', '-${i} months')
    `,
    productionTable: 'customer_master',
    testTable: 'test_customers',
    sourceServer: 'P21',
    updateInterval: 3600,
    isMetric: false,
    dataPoint: {
      x: new Date(new Date().setMonth(new Date().getMonth() - i)).toISOString().split('T')[0],
      y: 0
    }
  })),

  // Rental Equipment Status
  ...['Available', 'Rented', 'Maintenance', 'Reserved'].map((status, i) => ({
    id: 400 + i,
    name: `Equipment ${status}`,
    chartGroup: 'Equipment Status',
    subGroup: status,
    value: '0',
    calculation: '',
    sqlExpression: `
      SELECT COUNT(*) as equipment_count
      FROM equipment
      WHERE status = '${status}'
    `,
    testSqlExpression: `
      SELECT COUNT(*) as equipment_count
      FROM test_equipment
      WHERE status = '${status}'
    `,
    productionTable: 'equipment',
    testTable: 'test_equipment',
    sourceServer: 'POR',
    updateInterval: 300,
    isMetric: false,
    dataPoint: {
      x: status,
      y: 0
    }
  }))
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
