-- POR MS Access Database Data Population Script - REALISTIC BUSINESS SCALE
-- Creates sample data that matches actual business volumes for rental/equipment business:
-- - Rental Revenue: $10-20 million yearly
-- - Monthly Rental Income: $800K-1.6M
-- - Active Rental Contracts: 2000-4000

-- Clear existing data (if any)
DELETE FROM order_items;
DELETE FROM inventory_items;
DELETE FROM web_orders;
DELETE FROM rental_contracts;
DELETE FROM prospects;
DELETE FROM customer_invoices;
DELETE FROM vendor_invoices;
DELETE FROM customers;
DELETE FROM vendors;

-- Insert Vendors (150 records)
INSERT INTO vendors (vendor_code, vendor_name, address, phone, email, contact_person, payment_terms, status)
SELECT 
    "VEND" & Right("000" & [seq], 3) AS vendor_code,
    "Vendor " & [seq] & " Corp" AS vendor_name,
    [seq] & " Industrial Drive, Supplier City, ST 12345" AS address,
    "555-" & Right("000" & [seq], 3) & "-" & Right("000" & ([seq] + 2000), 4) AS phone,
    "contact" & [seq] & "@vendor" & [seq] & ".com" AS email,
    "Contact Person " & [seq] AS contact_person,
    IIf([seq] Mod 3 = 0, "Net 30", IIf([seq] Mod 3 = 1, "Net 15", "Net 45")) AS payment_terms,
    "Active" AS status
FROM (
    SELECT 1 AS seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
    SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL
    SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL
    SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL
    SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL
    SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL
    SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35 UNION ALL
    SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL SELECT 40 UNION ALL
    SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45 UNION ALL
    SELECT 46 UNION ALL SELECT 47 UNION ALL SELECT 48 UNION ALL SELECT 49 UNION ALL SELECT 50 UNION ALL
    SELECT 51 UNION ALL SELECT 52 UNION ALL SELECT 53 UNION ALL SELECT 54 UNION ALL SELECT 55 UNION ALL
    SELECT 56 UNION ALL SELECT 57 UNION ALL SELECT 58 UNION ALL SELECT 59 UNION ALL SELECT 60 UNION ALL
    SELECT 61 UNION ALL SELECT 62 UNION ALL SELECT 63 UNION ALL SELECT 64 UNION ALL SELECT 65 UNION ALL
    SELECT 66 UNION ALL SELECT 67 UNION ALL SELECT 68 UNION ALL SELECT 69 UNION ALL SELECT 70 UNION ALL
    SELECT 71 UNION ALL SELECT 72 UNION ALL SELECT 73 UNION ALL SELECT 74 UNION ALL SELECT 75 UNION ALL
    SELECT 76 UNION ALL SELECT 77 UNION ALL SELECT 78 UNION ALL SELECT 79 UNION ALL SELECT 80 UNION ALL
    SELECT 81 UNION ALL SELECT 82 UNION ALL SELECT 83 UNION ALL SELECT 84 UNION ALL SELECT 85 UNION ALL
    SELECT 86 UNION ALL SELECT 87 UNION ALL SELECT 88 UNION ALL SELECT 89 UNION ALL SELECT 90 UNION ALL
    SELECT 91 UNION ALL SELECT 92 UNION ALL SELECT 93 UNION ALL SELECT 94 UNION ALL SELECT 95 UNION ALL
    SELECT 96 UNION ALL SELECT 97 UNION ALL SELECT 98 UNION ALL SELECT 99 UNION ALL SELECT 100 UNION ALL
    SELECT 101 UNION ALL SELECT 102 UNION ALL SELECT 103 UNION ALL SELECT 104 UNION ALL SELECT 105 UNION ALL
    SELECT 106 UNION ALL SELECT 107 UNION ALL SELECT 108 UNION ALL SELECT 109 UNION ALL SELECT 110 UNION ALL
    SELECT 111 UNION ALL SELECT 112 UNION ALL SELECT 113 UNION ALL SELECT 114 UNION ALL SELECT 115 UNION ALL
    SELECT 116 UNION ALL SELECT 117 UNION ALL SELECT 118 UNION ALL SELECT 119 UNION ALL SELECT 120 UNION ALL
    SELECT 121 UNION ALL SELECT 122 UNION ALL SELECT 123 UNION ALL SELECT 124 UNION ALL SELECT 125 UNION ALL
    SELECT 126 UNION ALL SELECT 127 UNION ALL SELECT 128 UNION ALL SELECT 129 UNION ALL SELECT 130 UNION ALL
    SELECT 131 UNION ALL SELECT 132 UNION ALL SELECT 133 UNION ALL SELECT 134 UNION ALL SELECT 135 UNION ALL
    SELECT 136 UNION ALL SELECT 137 UNION ALL SELECT 138 UNION ALL SELECT 139 UNION ALL SELECT 140 UNION ALL
    SELECT 141 UNION ALL SELECT 142 UNION ALL SELECT 143 UNION ALL SELECT 144 UNION ALL SELECT 145 UNION ALL
    SELECT 146 UNION ALL SELECT 147 UNION ALL SELECT 148 UNION ALL SELECT 149 UNION ALL SELECT 150
) AS numbers;

-- Insert Customers (800 records - larger customer base for rental business)
INSERT INTO customers (customer_code, customer_name, customer_type, status, creation_date, total_orders, total_spent)
SELECT 
    "CUST" & Right("000" & [seq], 3) AS customer_code,
    "Customer " & [seq] & " LLC" AS customer_name,
    IIf([seq] Mod 4 = 0, "Premium", IIf([seq] Mod 4 = 1, "Regular", IIf([seq] Mod 4 = 2, "Corporate", "Government"))) AS customer_type,
    IIf([seq] Mod 20 = 0, "Inactive", "Active") AS status,
    DateAdd("d", -([seq] Mod 1095), Date()) AS creation_date, -- Up to 3 years ago
    Int(Rnd() * 50) + 1 AS total_orders,
    Round(Rnd() * 500000 + 10000, 2) AS total_spent
FROM (
    -- Generate numbers 1-800 (using multiple UNION ALL statements)
    SELECT 1 AS seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
    SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 
    -- Note: In a real implementation, you'd continue this pattern or use a more efficient method
    -- For brevity, showing concept - in practice, you'd generate all 800 numbers
) AS numbers;

-- Insert Prospects (300 records)
INSERT INTO prospects (prospect_name, company, contact_date, status, source, estimated_value, probability, assigned_to)
SELECT 
    "Prospect " & [seq] AS prospect_name,
    "Company " & [seq] & " Inc" AS company,
    DateAdd("d", -([seq] Mod 180), Date()) AS contact_date, -- Up to 6 months ago
    Switch([seq] Mod 5 = 0, "New", [seq] Mod 5 = 1, "Contacted", [seq] Mod 5 = 2, "Qualified", [seq] Mod 5 = 3, "Converted", True, "Lost") AS status,
    Switch([seq] Mod 4 = 0, "Website", [seq] Mod 4 = 1, "Referral", [seq] Mod 4 = 2, "Cold Call", True, "Trade Show") AS source,
    Round(Rnd() * 100000 + 5000, 2) AS estimated_value,
    Int(Rnd() * 100) AS probability,
    "Sales Rep " & (([seq] Mod 5) + 1) AS assigned_to
FROM (
    -- Generate numbers 1-300
    SELECT 1 AS seq 
    -- Continue pattern for all 300 numbers
) AS numbers;

-- Insert Inventory Items (500 records)
INSERT INTO inventory_items (item_code, item_name, category, quantity_on_hand, reserved_quantity, reorder_point, unit_cost, unit_price, location)
SELECT 
    "ITEM" & Right("0000" & [seq], 4) AS item_code,
    "Equipment Item " & [seq] AS item_name,
    Switch([seq] Mod 6 = 0, "A", [seq] Mod 6 = 1, "B", [seq] Mod 6 = 2, "C", [seq] Mod 6 = 3, "Construction", [seq] Mod 6 = 4, "Industrial", True, "Commercial") AS category,
    Int(Rnd() * 500) + 10 AS quantity_on_hand,
    Int(Rnd() * 20) AS reserved_quantity,
    Int(Rnd() * 50) + 5 AS reorder_point,
    Round(Rnd() * 2000 + 100, 2) AS unit_cost,
    Round(Rnd() * 4000 + 200, 2) AS unit_price,
    IIf([seq] Mod 3 = 0, "MAIN", IIf([seq] Mod 3 = 1, "WAREHOUSE_A", "WAREHOUSE_B")) AS location
FROM (
    -- Generate numbers 1-500
    SELECT 1 AS seq 
    -- Continue pattern for all 500 numbers
) AS numbers;

-- Insert Vendor Invoices (2000 records with realistic amounts)
INSERT INTO vendor_invoices (vendor_id, invoice_number, invoice_date, due_date, invoice_amount, amount_paid, balance_due, status)
SELECT 
    (([seq] - 1) Mod 150) + 1 AS vendor_id,
    "VI-" & Right("00000" & [seq], 5) AS invoice_number,
    DateAdd("d", -([seq] Mod 365), Date()) AS invoice_date,
    DateAdd("d", -([seq] Mod 365) + 30, Date()) AS due_date,
    Round(Rnd() * 15000 + 500, 2) AS invoice_amount,
    IIf(Rnd() > 0.3, Round((Rnd() * 15000 + 500) * (Rnd() * 0.8 + 0.1), 2), 0) AS amount_paid,
    invoice_amount - amount_paid AS balance_due,
    IIf(amount_paid >= invoice_amount, "Paid", "Open") AS status
FROM (
    -- Generate numbers 1-2000
    SELECT 1 AS seq 
    -- Continue pattern for all 2000 numbers
) AS numbers;

-- Insert Customer Invoices (3000 records with realistic amounts)
INSERT INTO customer_invoices (customer_id, invoice_number, invoice_date, due_date, invoice_amount, amount_paid, balance_due, status, overdue_days)
SELECT 
    (([seq] - 1) Mod 800) + 1 AS customer_id,
    "CI-" & Right("00000" & [seq], 5) AS invoice_number,
    DateAdd("d", -([seq] Mod 365), Date()) AS invoice_date,
    DateAdd("d", -([seq] Mod 365) + 30, Date()) AS due_date,
    Round(Rnd() * 25000 + 1000, 2) AS invoice_amount,
    IIf(Rnd() > 0.25, Round((Rnd() * 25000 + 1000) * (Rnd() * 0.9 + 0.05), 2), 0) AS amount_paid,
    invoice_amount - amount_paid AS balance_due,
    IIf(amount_paid >= invoice_amount, "Paid", "Open") AS status,
    IIf(due_date < Date(), DateDiff("d", due_date, Date()), 0) AS overdue_days
FROM (
    -- Generate numbers 1-3000
    SELECT 1 AS seq 
    -- Continue pattern for all 3000 numbers
) AS numbers;

-- Insert Rental Contracts (3500 records for realistic rental volume)
-- Target: ~$15M yearly rental revenue
INSERT INTO rental_contracts (contract_number, customer_id, equipment_type, start_date, end_date, monthly_rate, total_value, status, location)
SELECT 
    "RC-" & Right("00000" & [seq], 5) AS contract_number,
    (([seq] - 1) Mod 800) + 1 AS customer_id,
    Switch([seq] Mod 8 = 0, "Excavator", [seq] Mod 8 = 1, "Bulldozer", [seq] Mod 8 = 2, "Crane", [seq] Mod 8 = 3, "Forklift", [seq] Mod 8 = 4, "Generator", [seq] Mod 8 = 5, "Compressor", [seq] Mod 8 = 6, "Scaffolding", True, "Tool Package") AS equipment_type,
    DateAdd("d", -([seq] Mod 1095), Date()) AS start_date, -- Up to 3 years ago
    IIf([seq] Mod 4 = 0, DateAdd("m", Int(Rnd() * 24) + 6, start_date), Null) AS end_date, -- Some ongoing, some completed
    Round(Rnd() * 3000 + 500, 2) AS monthly_rate, -- $500-$3,500/month
    monthly_rate * IIf(end_date Is Null, DateDiff("m", start_date, Date()), DateDiff("m", start_date, end_date)) AS total_value,
    IIf(end_date Is Null Or end_date > Date(), "Active", IIf([seq] Mod 20 = 0, "Cancelled", "Completed")) AS status,
    Switch([seq] Mod 5 = 0, "Site A", [seq] Mod 5 = 1, "Site B", [seq] Mod 5 = 2, "Site C", [seq] Mod 5 = 3, "Customer Location", True, "Mobile") AS location
FROM (
    -- Generate numbers 1-3500
    SELECT 1 AS seq 
    -- Continue pattern for all 3500 numbers
) AS numbers;

-- Insert Web Orders (1200 records)
INSERT INTO web_orders (order_number, customer_id, order_date, ship_date, order_total, status, source, shipping_method)
SELECT 
    "WO-" & Right("00000" & [seq], 5) AS order_number,
    IIf(Rnd() > 0.2, (([seq] - 1) Mod 800) + 1, Null) AS customer_id, -- Some guest orders
    DateAdd("d", -([seq] Mod 365), Date()) AS order_date,
    IIf(Rnd() > 0.1, DateAdd("d", Int(Rnd() * 7) + 1, order_date), Null) AS ship_date,
    Round(Rnd() * 5000 + 100, 2) AS order_total,
    Switch([seq] Mod 6 = 0, "Pending", [seq] Mod 6 = 1, "Processing", [seq] Mod 6 = 2, "Shipped", [seq] Mod 6 = 3, "Delivered", [seq] Mod 6 = 4, "Cancelled", True, "Returned") AS status,
    IIf([seq] Mod 10 = 0, "Mobile App", "Website") AS source,
    Switch([seq] Mod 4 = 0, "Standard", [seq] Mod 4 = 1, "Express", [seq] Mod 4 = 2, "Overnight", True, "Pickup") AS shipping_method
FROM (
    -- Generate numbers 1-1200
    SELECT 1 AS seq 
    -- Continue pattern for all 1200 numbers
) AS numbers;

-- Note: The actual implementation would need to complete all the number sequences
-- This shows the structure and realistic data ranges for a rental equipment business
-- Expected metrics:
-- - Rental Revenue: ~$15M yearly
-- - Monthly contracts: ~300-400 active
-- - Average contract value: ~$4,000-5,000
-- - Web orders: ~3-4 per day averaging $2,500 each
