-- POR MS Access Data Population Script
-- Creates sample data that matches TallmanDashboard chart requirements
-- Note: This uses Access SQL syntax

-- Clear existing data (if any)
DELETE FROM order_items;
DELETE FROM web_orders;
DELETE FROM rental_contracts;
DELETE FROM customer_invoices;
DELETE FROM vendor_invoices;
DELETE FROM inventory_items;
DELETE FROM prospects;
DELETE FROM customers;
DELETE FROM vendors;

-- Insert Vendors (50 records)
INSERT INTO vendors (vendor_code, vendor_name, address, phone, email, contact_person, payment_terms, status, created_date)
SELECT 
    "VEND" & Right("000" & n.num, 3) AS vendor_code,
    "Vendor " & n.num & " LLC" AS vendor_name,
    n.num & " Industrial Blvd, Supplier City, ST 54321" AS address,
    "555-" & Right("000" & n.num, 3) & "-" & Right("000" & (n.num + 2000), 4) AS phone,
    "billing" & n.num & "@vendor" & n.num & ".com" AS email,
    "Contact Person " & n.num AS contact_person,
    "Net 30" AS payment_terms,
    "Active" AS status,
    DateAdd("d", -n.num, Now()) AS created_date
FROM (
    SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50
) AS n;

-- Insert Customers (150 records)
INSERT INTO customers (customer_code, customer_name, customer_type, status, creation_date, last_order_date, total_orders, total_spent, address, phone, email, created_date)
SELECT 
    "PCUST" & Right("000" & n.num, 3) AS customer_code,
    "POR Customer " & n.num & " Corp" AS customer_name,
    IIf(n.num Mod 4 = 0, "Premium", IIf(n.num Mod 4 = 1, "Regular", IIf(n.num Mod 4 = 2, "Enterprise", "Standard"))) AS customer_type,
    IIf(n.num Mod 20 = 0, "Inactive", "Active") AS status,
    DateAdd("d", -(n.num * 2), Now()) AS creation_date,
    IIf(n.num Mod 5 = 0, Null, DateAdd("d", -Int(Rnd() * 30), Now())) AS last_order_date,
    Int(Rnd() * 50) + 1 AS total_orders,
    Rnd() * 50000 + 1000 AS total_spent,
    n.num & " Customer Lane, Business Town, ST 98765" AS address,
    "555-" & Right("000" & n.num, 3) & "-" & Right("000" & (n.num + 3000), 4) AS phone,
    "contact" & n.num & "@porcustomer" & n.num & ".com" AS email,
    DateAdd("d", -(n.num * 2), Now()) AS created_date
FROM (
    SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
    SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55 UNION
    SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60 UNION
    SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65 UNION
    SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70 UNION
    SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75 UNION
    SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80 UNION
    SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85 UNION
    SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90 UNION
    SELECT 91 UNION SELECT 92 UNION SELECT 93 UNION SELECT 94 UNION SELECT 95 UNION
    SELECT 96 UNION SELECT 97 UNION SELECT 98 UNION SELECT 99 UNION SELECT 100 UNION
    SELECT 101 UNION SELECT 102 UNION SELECT 103 UNION SELECT 104 UNION SELECT 105 UNION
    SELECT 106 UNION SELECT 107 UNION SELECT 108 UNION SELECT 109 UNION SELECT 110 UNION
    SELECT 111 UNION SELECT 112 UNION SELECT 113 UNION SELECT 114 UNION SELECT 115 UNION
    SELECT 116 UNION SELECT 117 UNION SELECT 118 UNION SELECT 119 UNION SELECT 120 UNION
    SELECT 121 UNION SELECT 122 UNION SELECT 123 UNION SELECT 124 UNION SELECT 125 UNION
    SELECT 126 UNION SELECT 127 UNION SELECT 128 UNION SELECT 129 UNION SELECT 130 UNION
    SELECT 131 UNION SELECT 132 UNION SELECT 133 UNION SELECT 134 UNION SELECT 135 UNION
    SELECT 136 UNION SELECT 137 UNION SELECT 138 UNION SELECT 139 UNION SELECT 140 UNION
    SELECT 141 UNION SELECT 142 UNION SELECT 143 UNION SELECT 144 UNION SELECT 145 UNION
    SELECT 146 UNION SELECT 147 UNION SELECT 148 UNION SELECT 149 UNION SELECT 150
) AS n;

-- Insert Prospects (100 records for Customer Metrics charts)
INSERT INTO prospects (prospect_name, company, contact_date, status, source, estimated_value, probability, next_action, next_action_date, assigned_to, phone, email, created_date, updated_date)
SELECT 
    "Prospect " & n.num AS prospect_name,
    "Prospect Company " & n.num & " Inc" AS company,
    DateAdd("d", -Int(Rnd() * 180), Now()) AS contact_date,
    Switch(
        n.num Mod 5 = 0, "New",
        n.num Mod 5 = 1, "Contacted", 
        n.num Mod 5 = 2, "Qualified",
        n.num Mod 5 = 3, "Converted",
        True, "Lost"
    ) AS status,
    Switch(
        n.num Mod 4 = 0, "Website",
        n.num Mod 4 = 1, "Referral",
        n.num Mod 4 = 2, "Cold Call",
        True, "Trade Show"
    ) AS source,
    Rnd() * 25000 + 5000 AS estimated_value,
    Int(Rnd() * 100) AS probability,
    "Follow up call" AS next_action,
    DateAdd("d", Int(Rnd() * 14) + 1, Now()) AS next_action_date,
    "Sales Rep " & (n.num Mod 5 + 1) AS assigned_to,
    "555-" & Right("000" & n.num, 3) & "-" & Right("000" & (n.num + 4000), 4) AS phone,
    "prospect" & n.num & "@company" & n.num & ".com" AS email,
    DateAdd("d", -Int(Rnd() * 180), Now()) AS created_date,
    DateAdd("d", -Int(Rnd() * 30), Now()) AS updated_date
FROM (
    SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
    SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55 UNION
    SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60 UNION
    SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65 UNION
    SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70 UNION
    SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75 UNION
    SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80 UNION
    SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85 UNION
    SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90 UNION
    SELECT 91 UNION SELECT 92 UNION SELECT 93 UNION SELECT 94 UNION SELECT 95 UNION
    SELECT 96 UNION SELECT 97 UNION SELECT 98 UNION SELECT 99 UNION SELECT 100
) AS n;

-- Insert Inventory Items (300 records for Inventory charts)
INSERT INTO inventory_items (item_code, item_name, category, quantity_on_hand, reserved_quantity, reorder_point, reorder_quantity, unit_cost, unit_price, location, status, last_count_date, created_date, updated_date)
SELECT 
    "POR" & Right("0000" & n.num, 4) AS item_code,
    "POR Item " & n.num AS item_name,
    Switch(
        n.num Mod 6 = 0, "Rental Equipment",
        n.num Mod 6 = 1, "Tools",
        n.num Mod 6 = 2, "Safety Equipment", 
        n.num Mod 6 = 3, "Parts",
        n.num Mod 6 = 4, "Accessories",
        True, "Consumables"
    ) AS category,
    Int(Rnd() * 500) + 10 AS quantity_on_hand,
    Int(Rnd() * 20) AS reserved_quantity,
    Int(Rnd() * 50) + 5 AS reorder_point,
    Int(Rnd() * 100) + 25 AS reorder_quantity,
    Rnd() * 200 + 25 AS unit_cost,
    Rnd() * 400 + 50 AS unit_price,
    IIf(n.num Mod 3 = 0, "WAREHOUSE", IIf(n.num Mod 3 = 1, "MAIN", "YARD")) AS location,
    IIf(n.num Mod 25 = 0, "Inactive", "Active") AS status,
    DateAdd("d", -Int(Rnd() * 90), Now()) AS last_count_date,
    DateAdd("d", -(n.num + Int(Rnd() * 100)), Now()) AS created_date,
    DateAdd("d", -Int(Rnd() * 30), Now()) AS updated_date
FROM (
    SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
    -- Continue pattern for 300 records (truncated for brevity - would need full UNION list)
    SELECT 296 UNION SELECT 297 UNION SELECT 298 UNION SELECT 299 UNION SELECT 300
) AS n;

-- Insert Vendor Invoices (500 records for Accounts Payable charts)
INSERT INTO vendor_invoices (vendor_id, invoice_number, invoice_date, due_date, invoice_amount, amount_paid, balance_due, status, created_date, updated_date)
SELECT 
    ((n.num - 1) Mod 50) + 1 AS vendor_id,
    "VINV-" & Right("00000" & n.num, 5) AS invoice_number,
    DateAdd("d", -Int(Rnd() * 365), Now()) AS invoice_date,
    DateAdd("d", -Int(Rnd() * 365) + 30, Now()) AS due_date,  -- 30 day terms
    Rnd() * 8000 + 200 AS invoice_amount,
    IIf(Rnd() > 0.4, Rnd() * 8000 * 0.8, 0) AS amount_paid,
    0 AS balance_due,  -- Will be calculated below
    "Open" AS status,
    DateAdd("d", -Int(Rnd() * 365), Now()) AS created_date,
    DateAdd("d", -Int(Rnd() * 30), Now()) AS updated_date
FROM (
    SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    -- Pattern continues for 500 records (truncated for brevity)
    SELECT 496 UNION SELECT 497 UNION SELECT 498 UNION SELECT 499 UNION SELECT 500
) AS n;

-- Update balance_due and status for vendor invoices
UPDATE vendor_invoices 
SET balance_due = invoice_amount - amount_paid,
    status = IIf(amount_paid >= invoice_amount, "Paid", "Open");

-- Insert Customer Invoices (800 records for Accounts Receivable charts)
INSERT INTO customer_invoices (customer_id, invoice_number, invoice_date, due_date, invoice_amount, amount_paid, balance_due, status, overdue_days, created_date, updated_date)
SELECT 
    ((n.num - 1) Mod 150) + 1 AS customer_id,
    "CINV-" & Right("00000" & n.num, 5) AS invoice_number,
    DateAdd("d", -Int(Rnd() * 365), Now()) AS invoice_date,
    DateAdd("d", -Int(Rnd() * 365) + 30, Now()) AS due_date,
    Rnd() * 12000 + 300 AS invoice_amount,
    IIf(Rnd() > 0.3, Rnd() * 12000 * 0.7, 0) AS amount_paid,
    0 AS balance_due,
    "Open" AS status,
    IIf(DateAdd("d", -Int(Rnd() * 365) + 30, Now()) < Now(), Int(Rnd() * 120), 0) AS overdue_days,
    DateAdd("d", -Int(Rnd() * 365), Now()) AS created_date,
    DateAdd("d", -Int(Rnd() * 30), Now()) AS updated_date
FROM (
    SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    -- Pattern continues for 800 records (truncated for brevity)
    SELECT 796 UNION SELECT 797 UNION SELECT 798 UNION SELECT 799 UNION SELECT 800
) AS n;

-- Update balance_due and status for customer invoices
UPDATE customer_invoices 
SET balance_due = invoice_amount - amount_paid,
    status = IIf(amount_paid >= invoice_amount, "Paid", "Open");

-- Insert Rental Contracts (400 records for POR Overview charts)
INSERT INTO rental_contracts (contract_number, customer_id, equipment_type, start_date, end_date, monthly_rate, total_value, status, location, created_date, updated_date)
SELECT 
    "RC-" & Right("00000" & n.num, 5) AS contract_number,
    ((n.num - 1) Mod 150) + 1 AS customer_id,
    Switch(
        n.num Mod 8 = 0, "Excavator",
        n.num Mod 8 = 1, "Bulldozer",
        n.num Mod 8 = 2, "Crane",
        n.num Mod 8 = 3, "Forklift",
        n.num Mod 8 = 4, "Generator",
        n.num Mod 8 = 5, "Compressor",
        n.num Mod 8 = 6, "Scaffolding",
        True, "Power Tools"
    ) AS equipment_type,
    DateAdd("d", -Int(Rnd() * 365), Now()) AS start_date,
    IIf(Rnd() > 0.3, DateAdd("d", Int(Rnd() * 365) + 30, Now()), Null) AS end_date,
    Rnd() * 2000 + 200 AS monthly_rate,
    (Rnd() * 2000 + 200) * (Int(Rnd() * 12) + 1) AS total_value,
    IIf(Rnd() > 0.2, "Active", IIf(Rnd() > 0.1, "Completed", "Cancelled")) AS status,
    "Site " & ((n.num Mod 10) + 1) AS location,
    DateAdd("d", -Int(Rnd() * 365), Now()) AS created_date,
    DateAdd("d", -Int(Rnd() * 30), Now()) AS updated_date
FROM (
    SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    -- Pattern continues for 400 records (truncated for brevity)
    SELECT 396 UNION SELECT 397 UNION SELECT 398 UNION SELECT 399 UNION SELECT 400
) AS n;

-- Insert Web Orders (300 records for Web Orders charts)
INSERT INTO web_orders (order_number, customer_id, order_date, ship_date, order_total, status, source, shipping_method, tracking_number, created_date, updated_date)
SELECT 
    "WO-" & Right("00000" & n.num, 5) AS order_number,
    IIf(Rnd() > 0.1, ((n.num - 1) Mod 150) + 1, Null) AS customer_id,  -- Some guest orders
    DateAdd("d", -Int(Rnd() * 365), Now()) AS order_date,
    IIf(Rnd() > 0.2, DateAdd("d", -Int(Rnd() * 365) + Int(Rnd() * 7) + 1, Now()), Null) AS ship_date,
    Rnd() * 5000 + 100 AS order_total,
    Switch(
        n.num Mod 6 = 0, "Pending",
        n.num Mod 6 = 1, "Processing",
        n.num Mod 6 = 2, "Shipped",
        n.num Mod 6 = 3, "Delivered",
        n.num Mod 6 = 4, "Cancelled",
        True, "Returned"
    ) AS status,
    IIf(n.num Mod 10 = 0, "Mobile App", "Website") AS source,
    Switch(
        n.num Mod 4 = 0, "Standard",
        n.num Mod 4 = 1, "Express",
        n.num Mod 4 = 2, "Overnight",
        True, "Ground"
    ) AS shipping_method,
    IIf(Rnd() > 0.3, "TRK" & Right("000000000" & Int(Rnd() * 999999999), 9), Null) AS tracking_number,
    DateAdd("d", -Int(Rnd() * 365), Now()) AS created_date,
    DateAdd("d", -Int(Rnd() * 30), Now()) AS updated_date
FROM (
    SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    -- Pattern continues for 300 records (truncated for brevity)
    SELECT 296 UNION SELECT 297 UNION SELECT 298 UNION SELECT 299 UNION SELECT 300
) AS n;

-- Insert Order Items (1000 records for web order line items)
INSERT INTO order_items (order_id, inventory_item_id, quantity, unit_price, line_total, created_date)
SELECT 
    ((n.num - 1) Mod 300) + 1 AS order_id,
    ((n.num - 1) Mod 300) + 1 AS inventory_item_id,
    Int(Rnd() * 10) + 1 AS quantity,
    Rnd() * 400 + 50 AS unit_price,
    (Int(Rnd() * 10) + 1) * (Rnd() * 400 + 50) AS line_total,
    DateAdd("d", -Int(Rnd() * 365), Now()) AS created_date
FROM (
    SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    -- Pattern continues for 1000 records (truncated for brevity)
    SELECT 996 UNION SELECT 997 UNION SELECT 998 UNION SELECT 999 UNION SELECT 1000
) AS n;

-- Create today's data for real-time metrics
-- Today's web orders
INSERT INTO web_orders (order_number, customer_id, order_date, order_total, status, source, created_date, updated_date)
VALUES 
("WO-TODAY-001", 1, Now(), 850.00, "Processing", "Website", Now(), Now()),
("WO-TODAY-002", 5, Now(), 1200.00, "Pending", "Mobile App", Now(), Now()),
("WO-TODAY-003", 12, Now(), 675.00, "Shipped", "Website", Now(), Now());

-- Today's rental contracts
INSERT INTO rental_contracts (contract_number, customer_id, equipment_type, start_date, monthly_rate, total_value, status, location, created_date, updated_date)
VALUES 
("RC-TODAY-001", 8, "Excavator", Now(), 2500.00, 7500.00, "Active", "Site A", Now(), Now()),
("RC-TODAY-002", 15, "Generator", Now(), 800.00, 2400.00, "Active", "Site B", Now(), Now());

-- Today's customer invoices
INSERT INTO customer_invoices (customer_id, invoice_number, invoice_date, due_date, invoice_amount, balance_due, status, created_date, updated_date)
VALUES 
(3, "CINV-TODAY-001", Now(), DateAdd("d", 30, Now()), 3200.00, 3200.00, "Open", Now(), Now()),
(7, "CINV-TODAY-002", Now(), DateAdd("d", 30, Now()), 1850.00, 1850.00, "Open", Now(), Now());
