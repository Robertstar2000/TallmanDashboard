var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sqlite3 from 'sqlite3';
let testDb = null;
export function initializeTestDb() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!testDb) {
            testDb = new sqlite3.Database(':memory:', (err) => {
                if (err) {
                    throw new Error(`Error opening test database: ${err.message}`);
                }
            });
        }
        // Ensure db exists before using it
        if (!testDb)
            throw new Error('Failed to initialize test database');
    });
}
function initializeTestData() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeTestDb();
        // Create tables
        yield new Promise((resolve, reject) => {
            testDb.exec(`
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
    `, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
        // Insert test data
        yield new Promise((resolve, reject) => {
            testDb.exec(`
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
    `, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
// Test database query functions
export function getTestDailyOrders() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeTestDb();
        return new Promise((resolve, reject) => {
            testDb.all(`
      SELECT 
        order_date as date,
        COUNT(*) as orders
      FROM sales_order
      WHERE order_date >= date('now', '-1 month')
      GROUP BY order_date
      ORDER BY date
    `, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    });
}
export function getTestAccountsPayable() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeTestDb();
        return new Promise((resolve, reject) => {
            testDb.all(`
      SELECT 
        due_date as date,
        SUM(CASE WHEN date(due_date) >= date('now') THEN amount ELSE 0 END) as current,
        SUM(CASE WHEN date(due_date) < date('now') THEN amount ELSE 0 END) as overdue,
        SUM(amount) as total
      FROM accounts_payable
      WHERE due_date >= date('now', '-1 month')
      GROUP BY due_date
      ORDER BY date
    `, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    });
}
export function getTestPOROverview() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeTestDb();
        return new Promise((resolve, reject) => {
            testDb.all(`
      SELECT 
        rental_date as date,
        SUM(rental_value) as value,
        status
      FROM rentals
      WHERE rental_date >= date('now', '-1 month')
      GROUP BY rental_date, status
      ORDER BY date
    `, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    });
}
export function getTestWebOrders() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeTestDb();
        return new Promise((resolve, reject) => {
            testDb.all(`
      SELECT 
        order_date as date,
        COUNT(*) as orders,
        SUM(order_value) as value
      FROM web_orders
      WHERE order_date >= date('now', '-1 month')
      GROUP BY order_date
      ORDER BY date
    `, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    });
}
export function getTestSiteDistribution() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeTestDb();
        return new Promise((resolve, reject) => {
            testDb.all(`
      SELECT 
        site_name as name,
        order_count as value
      FROM site_distribution
    `, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    });
}
export function getTestInventory() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeTestDb();
        return new Promise((resolve, reject) => {
            testDb.all(`
      SELECT 
        date,
        quantity,
        value
      FROM inventory
      WHERE date >= date('now', '-1 month')
      ORDER BY date
    `, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    });
}
export function getTestHistoricalData() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeTestDb();
        return new Promise((resolve, reject) => {
            testDb.all(`
      SELECT 
        date,
        revenue,
        orders,
        customers
      FROM historical_data
      WHERE date >= date('now', '-1 month')
      ORDER BY date
    `, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    });
}
export function getTestCustomerMetrics() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeTestDb();
        return new Promise((resolve, reject) => {
            testDb.all(`
      SELECT 
        date,
        new_customers,
        active_customers,
        revenue
      FROM customer_metrics
      WHERE date >= date('now', '-1 month')
      ORDER BY date
    `, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    });
}
export function getTestARAging() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeTestDb();
        return new Promise((resolve, reject) => {
            testDb.all(`
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
    `, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    });
}
