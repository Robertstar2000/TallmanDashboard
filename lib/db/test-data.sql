-- Test database schema and data
CREATE TABLE IF NOT EXISTS orderHdr (
    OrderId INTEGER PRIMARY KEY,
    OrderDate DATETIME,
    TotAmt DECIMAL(10,2),
    Status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS WebOrderHdr (
    OrderId INTEGER PRIMARY KEY,
    OrderDate DATETIME,
    TotAmt DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS POR_InvoiceHdr (
    InvoiceId INTEGER PRIMARY KEY,
    DueDate DATETIME,
    AmtOpen DECIMAL(10,2),
    Status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS AR_InvoiceHdr (
    InvoiceId INTEGER PRIMARY KEY,
    DueDate DATETIME,
    AmtOpen DECIMAL(10,2)
);

-- Table for Weekly Revenue
CREATE TABLE IF NOT EXISTS WeeklyRevenue (
    RevenueDate DATETIME,
    Revenue DECIMAL(10,2)
);

-- Table for Open Invoices
CREATE TABLE IF NOT EXISTS OpenInvoices (
    InvoiceId INTEGER PRIMARY KEY,
    AmtOpen DECIMAL(10,2)
);

-- Table for Orders Backlogged
CREATE TABLE IF NOT EXISTS OrdersBacklogged (
    OrderId INTEGER PRIMARY KEY,
    OrderDate DATETIME
);

-- Table for Total Sales Monthly
CREATE TABLE IF NOT EXISTS TotalSalesMonthly (
    SalesDate DATETIME,
    Sales DECIMAL(10,2)
);

-- Sample data for orders
INSERT INTO orderHdr (OrderDate, TotAmt, Status)
SELECT 
    datetime('now', '-' || abs(random() % 24) || ' hours'),
    round(random() * 10000, 2),
    CASE (abs(random()) % 3)
        WHEN 0 THEN 'Open'
        WHEN 1 THEN 'Closed'
        ELSE 'Pending'
    END
FROM (SELECT 1 UNION ALL SELECT 2) t1,
     (SELECT 1 UNION ALL SELECT 2) t2,
     (SELECT 1 UNION ALL SELECT 2) t3
LIMIT 100;

-- Sample data for web orders
INSERT INTO WebOrderHdr (OrderDate, TotAmt)
SELECT 
    datetime('now', '-' || abs(random() % 720) || ' hours'),
    round(random() * 5000, 2)
FROM (SELECT 1 UNION ALL SELECT 2) t1,
     (SELECT 1 UNION ALL SELECT 2) t2
LIMIT 50;

-- Sample data for POR invoices
INSERT INTO POR_InvoiceHdr (DueDate, AmtOpen, Status)
SELECT 
    datetime('now', '+' || abs(random() % 30) || ' days'),
    round(random() * 15000, 2),
    CASE (abs(random()) % 2)
        WHEN 0 THEN 'Current'
        ELSE 'Overdue'
    END
FROM (SELECT 1 UNION ALL SELECT 2) t1,
     (SELECT 1 UNION ALL SELECT 2) t2
LIMIT 75;

-- Sample data for AR invoices
INSERT INTO AR_InvoiceHdr (DueDate, AmtOpen)
SELECT 
    datetime('now', '+' || abs(random() % 30) || ' days'),
    round(random() * 12000, 2)
FROM (SELECT 1 UNION ALL SELECT 2) t1,
     (SELECT 1 UNION ALL SELECT 2) t2
LIMIT 75;

-- Insert sample data for Weekly Revenue
INSERT INTO WeeklyRevenue (RevenueDate, Revenue)
SELECT 
    datetime('now', '-' || abs(random() % 7) || ' days'),
    round(random() * 200000, 2)
FROM (SELECT 1 UNION ALL SELECT 2) t1,
     (SELECT 1 UNION ALL SELECT 2) t2
LIMIT 7;

-- Insert sample data for Open Invoices
INSERT INTO OpenInvoices (InvoiceId, AmtOpen)
SELECT 
    abs(random()),
    round(random() * 5000, 2)
FROM (SELECT 1 UNION ALL SELECT 2) t1,
     (SELECT 1 UNION ALL SELECT 2) t2
LIMIT 15;

-- Insert sample data for Orders Backlogged
INSERT INTO OrdersBacklogged (OrderId, OrderDate)
SELECT 
    abs(random()),
    datetime('now', '-' || abs(random() % 30) || ' days')
FROM (SELECT 1 UNION ALL SELECT 2) t1,
     (SELECT 1 UNION ALL SELECT 2) t2
LIMIT 10;

-- Insert sample data for Total Sales Monthly
INSERT INTO TotalSalesMonthly (SalesDate, Sales)
SELECT 
    datetime('now', 'start of month'),
    round(random() * 500000, 2)
FROM (SELECT 1 UNION ALL SELECT 2) t1
LIMIT 1;
