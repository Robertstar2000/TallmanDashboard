import { Database } from 'sqlite3';
import { open } from 'sqlite';

let testDb: Database | null = null;

export async function getTestDb() {
  if (!testDb) {
    testDb = await open({
      filename: ':memory:',
      driver: Database
    });
    await initializeTestData();
  }
  return testDb;
}

async function initializeTestData() {
  const db = await getTestDb();
  
  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sales_order (
      id INTEGER PRIMARY KEY,
      order_date TEXT,
      total_amount REAL
    );

    CREATE TABLE IF NOT EXISTS accounts_payable (
      id INTEGER PRIMARY KEY,
      due_date TEXT,
      amount REAL,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY,
      rental_date TEXT,
      rental_value REAL,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS web_orders (
      id INTEGER PRIMARY KEY,
      order_date TEXT,
      order_value REAL
    );

    CREATE TABLE IF NOT EXISTS site_distribution (
      id INTEGER PRIMARY KEY,
      site_name TEXT,
      order_count INTEGER
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY,
      date TEXT,
      quantity INTEGER,
      value REAL
    );

    CREATE TABLE IF NOT EXISTS historical_data (
      id INTEGER PRIMARY KEY,
      date TEXT,
      revenue REAL,
      orders INTEGER,
      customers INTEGER
    );

    CREATE TABLE IF NOT EXISTS customer_metrics (
      id INTEGER PRIMARY KEY,
      date TEXT,
      new_customers INTEGER,
      active_customers INTEGER,
      revenue REAL
    );

    CREATE TABLE IF NOT EXISTS ar_aging (
      id INTEGER PRIMARY KEY,
      aging_range TEXT,
      amount REAL
    );
  `);

  // Insert test data
  await db.exec(`
    -- Sales Orders
    INSERT INTO sales_order (order_date, total_amount) VALUES
    ('2025-02-14', 1500),
    ('2025-02-13', 2000),
    ('2025-02-12', 1800);

    -- Accounts Payable
    INSERT INTO accounts_payable (due_date, amount, status) VALUES
    ('2025-02-20', 5000, 'current'),
    ('2025-02-10', 3000, 'overdue'),
    ('2025-02-25', 4000, 'current');

    -- Rentals
    INSERT INTO rentals (rental_date, rental_value, status) VALUES
    ('2025-02-14', 800, 'active'),
    ('2025-02-13', 1200, 'completed'),
    ('2025-02-12', 1000, 'active');

    -- Web Orders
    INSERT INTO web_orders (order_date, order_value) VALUES
    ('2025-02-14', 500),
    ('2025-02-13', 750),
    ('2025-02-12', 600);

    -- Site Distribution
    INSERT INTO site_distribution (site_name, order_count) VALUES
    ('Site A', 100),
    ('Site B', 150),
    ('Site C', 80);

    -- Inventory
    INSERT INTO inventory (date, quantity, value) VALUES
    ('2025-02-14', 1000, 50000),
    ('2025-02-13', 950, 47500),
    ('2025-02-12', 900, 45000);

    -- Historical Data
    INSERT INTO historical_data (date, revenue, orders, customers) VALUES
    ('2025-02-14', 10000, 50, 30),
    ('2025-02-13', 12000, 60, 35),
    ('2025-02-12', 11000, 55, 32);

    -- Customer Metrics
    INSERT INTO customer_metrics (date, new_customers, active_customers, revenue) VALUES
    ('2025-02-14', 5, 100, 8000),
    ('2025-02-13', 7, 98, 9500),
    ('2025-02-12', 6, 95, 8800);

    -- AR Aging
    INSERT INTO ar_aging (aging_range, amount) VALUES
    ('0-30', 50000),
    ('31-60', 30000),
    ('61-90', 20000),
    ('90+', 10000);
  `);
}

// Test database query functions
export async function getTestDailyOrders() {
  const db = await getTestDb();
  return db.all(`
    SELECT 
      order_date as date,
      COUNT(*) as orders
    FROM sales_order
    WHERE order_date >= date('now', '-1 month')
    GROUP BY order_date
    ORDER BY date
  `);
}

export async function getTestAccountsPayable() {
  const db = await getTestDb();
  return db.all(`
    SELECT 
      due_date as date,
      SUM(CASE WHEN date(due_date) >= date('now') THEN amount ELSE 0 END) as current,
      SUM(CASE WHEN date(due_date) < date('now') THEN amount ELSE 0 END) as overdue,
      SUM(amount) as total
    FROM accounts_payable
    WHERE due_date >= date('now', '-1 month')
    GROUP BY due_date
    ORDER BY date
  `);
}

export async function getTestPOROverview() {
  const db = await getTestDb();
  return db.all(`
    SELECT 
      rental_date as date,
      SUM(rental_value) as value,
      status
    FROM rentals
    WHERE rental_date >= date('now', '-1 month')
    GROUP BY rental_date, status
    ORDER BY date
  `);
}

export async function getTestWebOrders() {
  const db = await getTestDb();
  return db.all(`
    SELECT 
      order_date as date,
      COUNT(*) as orders,
      SUM(order_value) as value
    FROM web_orders
    WHERE order_date >= date('now', '-1 month')
    GROUP BY order_date
    ORDER BY date
  `);
}

export async function getTestSiteDistribution() {
  const db = await getTestDb();
  return db.all(`
    SELECT 
      site_name as name,
      order_count as value
    FROM site_distribution
  `);
}

export async function getTestInventory() {
  const db = await getTestDb();
  return db.all(`
    SELECT 
      date,
      quantity,
      value
    FROM inventory
    WHERE date >= date('now', '-1 month')
    ORDER BY date
  `);
}

export async function getTestHistoricalData() {
  const db = await getTestDb();
  return db.all(`
    SELECT 
      date,
      revenue,
      orders,
      customers
    FROM historical_data
    WHERE date >= date('now', '-1 month')
    ORDER BY date
  `);
}

export async function getTestCustomerMetrics() {
  const db = await getTestDb();
  return db.all(`
    SELECT 
      date,
      new_customers,
      active_customers,
      revenue
    FROM customer_metrics
    WHERE date >= date('now', '-1 month')
    ORDER BY date
  `);
}

export async function getTestARAging() {
  const db = await getTestDb();
  const result = await db.all(`
    SELECT 
      aging_range as range,
      amount,
      ROUND(amount * 100.0 / (SELECT SUM(amount) FROM ar_aging), 2) as percentage
    FROM ar_aging
    ORDER BY 
      CASE aging_range
        WHEN '0-30' THEN 1
        WHEN '31-60' THEN 2
        WHEN '61-90' THEN 3
        WHEN '90+' THEN 4
      END
  `);
  return result;
}
