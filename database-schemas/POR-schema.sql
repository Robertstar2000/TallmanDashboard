-- POR MS Access Database Schema
-- Created to support TallmanDashboard chart requirements
-- Note: This uses Access SQL syntax

-- Vendor Invoices table for Accounts Payable charts (12 data points)
CREATE TABLE vendor_invoices (
    invoice_id AUTOINCREMENT PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    invoice_number TEXT(50) NOT NULL,
    invoice_date DATETIME NOT NULL,
    due_date DATETIME NOT NULL,
    invoice_amount CURRENCY NOT NULL,
    amount_paid CURRENCY DEFAULT 0,
    balance_due CURRENCY NOT NULL,
    status TEXT(20) DEFAULT "Open",
    created_date DATETIME DEFAULT Now(),
    updated_date DATETIME DEFAULT Now()
);

CREATE INDEX IX_vendor_invoices_due_date ON vendor_invoices (due_date);
CREATE INDEX IX_vendor_invoices_status ON vendor_invoices (status);

-- Customer Invoices table for Accounts Receivable charts (36 data points)
CREATE TABLE customer_invoices (
    invoice_id AUTOINCREMENT PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    invoice_number TEXT(50) NOT NULL,
    invoice_date DATETIME NOT NULL,
    due_date DATETIME NOT NULL,
    invoice_amount CURRENCY NOT NULL,
    amount_paid CURRENCY DEFAULT 0,
    balance_due CURRENCY NOT NULL,
    status TEXT(20) DEFAULT "Open",
    overdue_days INTEGER DEFAULT 0,
    created_date DATETIME DEFAULT Now(),
    updated_date DATETIME DEFAULT Now()
);

CREATE INDEX IX_customer_invoices_due_date ON customer_invoices (due_date);
CREATE INDEX IX_customer_invoices_status ON customer_invoices (status);
CREATE INDEX IX_customer_invoices_overdue ON customer_invoices (overdue_days);

-- Customers table for Customer Metrics charts (24 data points)
CREATE TABLE customers (
    customer_id AUTOINCREMENT PRIMARY KEY,
    customer_code TEXT(50) NOT NULL,
    customer_name TEXT(255) NOT NULL,
    customer_type TEXT(50) DEFAULT "Regular", -- Regular, Premium, etc.
    status TEXT(20) DEFAULT "Active",
    creation_date DATETIME NOT NULL,
    last_order_date DATETIME,
    total_orders INTEGER DEFAULT 0,
    total_spent CURRENCY DEFAULT 0,
    address TEXT(500),
    phone TEXT(50),
    email TEXT(255),
    created_date DATETIME DEFAULT Now()
);

CREATE UNIQUE INDEX IX_customers_customer_code ON customers (customer_code);
CREATE INDEX IX_customers_creation_date ON customers (creation_date);
CREATE INDEX IX_customers_status ON customers (status);

-- Prospects table for Customer Metrics charts (12 data points)
CREATE TABLE prospects (
    prospect_id AUTOINCREMENT PRIMARY KEY,
    prospect_name TEXT(255) NOT NULL,
    company TEXT(255),
    contact_date DATETIME NOT NULL,
    status TEXT(50) DEFAULT "New", -- New, Contacted, Qualified, Converted, Lost
    source TEXT(100), -- Website, Referral, Cold Call, etc.
    estimated_value CURRENCY DEFAULT 0,
    probability INTEGER DEFAULT 0, -- 0-100%
    next_action TEXT(255),
    next_action_date DATETIME,
    assigned_to TEXT(100),
    phone TEXT(50),
    email TEXT(255),
    created_date DATETIME DEFAULT Now(),
    updated_date DATETIME DEFAULT Now()
);

CREATE INDEX IX_prospects_contact_date ON prospects (contact_date);
CREATE INDEX IX_prospects_status ON prospects (status);
CREATE INDEX IX_prospects_source ON prospects (source);

-- Rental Contracts table for POR Overview charts (36 data points)
CREATE TABLE rental_contracts (
    contract_id AUTOINCREMENT PRIMARY KEY,
    contract_number TEXT(50) NOT NULL,
    customer_id INTEGER NOT NULL,
    equipment_type TEXT(100) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    monthly_rate CURRENCY NOT NULL,
    total_value CURRENCY NOT NULL,
    status TEXT(20) DEFAULT "Active", -- Active, Completed, Cancelled
    location TEXT(255),
    created_date DATETIME DEFAULT Now(),
    updated_date DATETIME DEFAULT Now()
);

CREATE UNIQUE INDEX IX_rental_contracts_contract_number ON rental_contracts (contract_number);
CREATE INDEX IX_rental_contracts_start_date ON rental_contracts (start_date);
CREATE INDEX IX_rental_contracts_status ON rental_contracts (status);
CREATE INDEX IX_rental_contracts_customer_id ON rental_contracts (customer_id);

-- Web Orders table for Web Orders charts (12 data points)
CREATE TABLE web_orders (
    order_id AUTOINCREMENT PRIMARY KEY,
    order_number TEXT(50) NOT NULL,
    customer_id INTEGER,
    order_date DATETIME NOT NULL,
    ship_date DATETIME,
    order_total CURRENCY NOT NULL,
    status TEXT(20) DEFAULT "Pending", -- Pending, Processing, Shipped, Delivered, Cancelled
    source TEXT(50) DEFAULT "Website", -- Website, Mobile App, etc.
    shipping_method TEXT(50),
    tracking_number TEXT(100),
    created_date DATETIME DEFAULT Now(),
    updated_date DATETIME DEFAULT Now()
);

CREATE INDEX IX_web_orders_order_date ON web_orders (order_date);
CREATE INDEX IX_web_orders_status ON web_orders (status);
CREATE INDEX IX_web_orders_source ON web_orders (source);

-- Inventory Items table for Inventory charts (8 data points)
CREATE TABLE inventory_items (
    item_id AUTOINCREMENT PRIMARY KEY,
    item_code TEXT(50) NOT NULL,
    item_name TEXT(255) NOT NULL,
    category TEXT(100),
    quantity_on_hand INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    unit_cost CURRENCY DEFAULT 0,
    unit_price CURRENCY DEFAULT 0,
    location TEXT(50) DEFAULT "MAIN",
    status TEXT(20) DEFAULT "Active",
    last_count_date DATETIME,
    created_date DATETIME DEFAULT Now(),
    updated_date DATETIME DEFAULT Now()
);

CREATE UNIQUE INDEX IX_inventory_items_item_code ON inventory_items (item_code);
CREATE INDEX IX_inventory_items_category ON inventory_items (category);
CREATE INDEX IX_inventory_items_location ON inventory_items (location);
CREATE INDEX IX_inventory_items_status ON inventory_items (status);

-- Vendors table for lookup purposes
CREATE TABLE vendors (
    vendor_id AUTOINCREMENT PRIMARY KEY,
    vendor_code TEXT(50) NOT NULL,
    vendor_name TEXT(255) NOT NULL,
    address TEXT(500),
    phone TEXT(50),
    email TEXT(255),
    contact_person TEXT(255),
    payment_terms TEXT(50),
    status TEXT(20) DEFAULT "Active",
    created_date DATETIME DEFAULT Now()
);

CREATE UNIQUE INDEX IX_vendors_vendor_code ON vendors (vendor_code);
CREATE INDEX IX_vendors_status ON vendors (status);

-- Order Items table for web order line items
CREATE TABLE order_items (
    item_id AUTOINCREMENT PRIMARY KEY,
    order_id INTEGER NOT NULL,
    inventory_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price CURRENCY NOT NULL,
    line_total CURRENCY NOT NULL,
    created_date DATETIME DEFAULT Now()
);

CREATE INDEX IX_order_items_order_id ON order_items (order_id);
CREATE INDEX IX_order_items_inventory_item_id ON order_items (inventory_item_id);
