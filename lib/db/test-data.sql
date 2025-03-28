-- Test database schema and data to emulate P21 and POR structures

-- P21 Schema Tables
CREATE TABLE IF NOT EXISTS pub_oe_hdr (
    order_id INTEGER PRIMARY KEY,
    order_date DATETIME,
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    customer_id INTEGER
);

CREATE TABLE IF NOT EXISTS pub_customers (
    customer_id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    status VARCHAR(20),
    last_order_date DATETIME
);

CREATE TABLE IF NOT EXISTS pub_inventory_master (
    item_id INTEGER PRIMARY KEY,
    description VARCHAR(100),
    qty_on_hand INTEGER,
    unit_cost DECIMAL(10,2),
    department VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS pub_website_orders (
    order_id INTEGER PRIMARY KEY,
    order_date DATETIME,
    total_amount DECIMAL(10,2),
    customer_id INTEGER,
    revenue DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS pub_ar_open_items (
    invoice_id INTEGER PRIMARY KEY,
    due_date DATETIME,
    amount_open DECIMAL(10,2),
    days_past_due INTEGER,
    customer_id INTEGER
);

CREATE TABLE IF NOT EXISTS pub_ap_open_items (
    invoice_id INTEGER PRIMARY KEY,
    due_date DATETIME,
    amount_open DECIMAL(10,2),
    vendor_id INTEGER
);

-- POR Schema Tables
CREATE TABLE IF NOT EXISTS por_rental_contracts (
    contract_id INTEGER PRIMARY KEY,
    start_date DATETIME,
    end_date DATETIME,
    total_value DECIMAL(10,2),
    status VARCHAR(20),
    customer_id INTEGER
);

CREATE TABLE IF NOT EXISTS por_rental_items (
    item_id INTEGER PRIMARY KEY,
    contract_id INTEGER,
    description VARCHAR(100),
    daily_rate DECIMAL(10,2),
    quantity INTEGER
);

CREATE TABLE IF NOT EXISTS por_customers (
    customer_id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS por_invoices (
    invoice_id INTEGER PRIMARY KEY,
    contract_id INTEGER,
    invoice_date DATETIME,
    amount DECIMAL(10,2),
    status VARCHAR(20)
);

-- Clear existing data
DELETE FROM pub_oe_hdr;
DELETE FROM pub_customers;
DELETE FROM pub_inventory_master;
DELETE FROM pub_website_orders;
DELETE FROM pub_ar_open_items;
DELETE FROM pub_ap_open_items;
DELETE FROM por_rental_contracts;
DELETE FROM por_rental_items;
DELETE FROM por_customers;
DELETE FROM por_invoices;

-- Sample data for P21 tables
-- Orders data with consistent monthly distribution for the past 12 months
INSERT INTO pub_oe_hdr (order_id, order_date, total_amount, status, customer_id)
WITH RECURSIVE dates(date) AS (
  SELECT date('now', '-11 months', 'start of month')
  UNION ALL
  SELECT date(date, '+1 month')
  FROM dates
  WHERE date < date('now', 'start of month')
)
SELECT 
    rowid,
    date,
    100 + (rowid % 10) * 100,  -- Consistent but varied amounts
    CASE (rowid % 3)
        WHEN 0 THEN 'Open'
        WHEN 1 THEN 'Closed'
        ELSE 'Pending'
    END,
    (rowid % 50) + 1
FROM dates, (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t
ORDER BY date;

-- Customer data
INSERT INTO pub_customers (customer_id, name, status, last_order_date)
SELECT 
    rowid,
    'Customer ' || rowid,
    CASE (rowid % 3)
        WHEN 0 THEN 'active'
        WHEN 1 THEN 'inactive'
        ELSE 'pending'
    END,
    date('now', '-' || (rowid % 60) || ' days')
FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t1,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t2
LIMIT 100;

-- Inventory data
INSERT INTO pub_inventory_master (item_id, description, qty_on_hand, unit_cost, department)
SELECT 
    rowid,
    'Item ' || rowid,
    (rowid % 10) * 100,
    50 + (rowid % 5) * 10,
    CASE (rowid % 3)
        WHEN 0 THEN 'Hardware'
        WHEN 1 THEN 'Software'
        ELSE 'Services'
    END
FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t1,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t2
LIMIT 100;

-- Web orders data with monthly distribution
INSERT INTO pub_website_orders (order_id, order_date, total_amount, customer_id, revenue)
WITH RECURSIVE dates(date) AS (
  SELECT date('now', '-11 months', 'start of month')
  UNION ALL
  SELECT date(date, '+1 month')
  FROM dates
  WHERE date < date('now', 'start of month')
)
SELECT 
    1000 + rowid,
    date,
    200 + (rowid % 8) * 50,
    (rowid % 50) + 1,
    200 + (rowid % 8) * 50
FROM dates, (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t
ORDER BY date;

-- AR aging data with specific buckets
INSERT INTO pub_ar_open_items (invoice_id, due_date, amount_open, days_past_due, customer_id)
VALUES
    -- Current (0 days)
    (2001, date('now'), 5000.00, 0, 1),
    (2002, date('now'), 7500.00, 0, 2),
    (2003, date('now'), 3200.00, 0, 3),
    
    -- 1-30 Days
    (2004, date('now', '-15 days'), 4200.00, 15, 4),
    (2005, date('now', '-22 days'), 6100.00, 22, 5),
    (2006, date('now', '-28 days'), 3800.00, 28, 6),
    
    -- 31-60 Days
    (2007, date('now', '-35 days'), 3500.00, 35, 7),
    (2008, date('now', '-45 days'), 4800.00, 45, 8),
    (2009, date('now', '-58 days'), 5200.00, 58, 9),
    
    -- 61-90 Days
    (2010, date('now', '-65 days'), 2900.00, 65, 10),
    (2011, date('now', '-78 days'), 3700.00, 78, 11),
    (2012, date('now', '-85 days'), 4100.00, 85, 12),
    
    -- 90+ Days
    (2013, date('now', '-95 days'), 2500.00, 95, 13),
    (2014, date('now', '-120 days'), 3200.00, 120, 14),
    (2015, date('now', '-150 days'), 4800.00, 150, 15);

-- AP data with monthly distribution
INSERT INTO pub_ap_open_items (invoice_id, due_date, amount_open, vendor_id)
WITH RECURSIVE dates(date) AS (
  SELECT date('now', '-11 months', 'start of month')
  UNION ALL
  SELECT date(date, '+1 month')
  FROM dates
  WHERE date < date('now', 'start of month')
)
SELECT 
    3000 + rowid,
    date,
    500 + (rowid % 10) * 200,
    (rowid % 20) + 1
FROM dates, (SELECT 1 UNION SELECT 2 UNION SELECT 3) t
ORDER BY date;

-- POR data
INSERT INTO por_rental_contracts (contract_id, start_date, end_date, total_value, status, customer_id)
WITH RECURSIVE dates(date) AS (
  SELECT date('now', '-11 months', 'start of month')
  UNION ALL
  SELECT date(date, '+1 month')
  FROM dates
  WHERE date < date('now', 'start of month')
)
SELECT 
    4000 + rowid,
    date,
    date(date, '+30 days'),
    1500 + (rowid % 5) * 1000,
    CASE (rowid % 3)
        WHEN 0 THEN 'Active'
        WHEN 1 THEN 'Completed'
        ELSE 'Pending'
    END,
    (rowid % 50) + 1
FROM dates, (SELECT 1 UNION SELECT 2) t
ORDER BY date;

-- Create views to make testing easier
CREATE VIEW IF NOT EXISTS monthly_orders AS
SELECT 
    strftime('%Y-%m', order_date) as month,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue
FROM pub_oe_hdr
GROUP BY strftime('%Y-%m', order_date)
ORDER BY month;

CREATE VIEW IF NOT EXISTS monthly_web_orders AS
SELECT 
    strftime('%Y-%m', order_date) as month,
    COUNT(*) as order_count,
    SUM(revenue) as total_revenue
FROM pub_website_orders
GROUP BY strftime('%Y-%m', order_date)
ORDER BY month;

CREATE VIEW IF NOT EXISTS ar_aging AS
SELECT
    CASE
        WHEN days_past_due <= 30 THEN '0-30'
        WHEN days_past_due <= 60 THEN '31-60'
        WHEN days_past_due <= 90 THEN '61-90'
        WHEN days_past_due <= 120 THEN '91-120'
        ELSE '120+'
    END as aging_bucket,
    SUM(amount_open) as total_amount
FROM pub_ar_open_items
GROUP BY aging_bucket
ORDER BY aging_bucket;
