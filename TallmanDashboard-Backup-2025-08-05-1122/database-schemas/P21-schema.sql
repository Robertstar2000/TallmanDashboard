-- P21 SQL Server Database Schema
-- Created to support TallmanDashboard chart requirements

USE P21;
GO

-- AR Invoices table for AR Aging charts (5 data points)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ar_invoices]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ar_invoices] (
        [invoice_id] INT IDENTITY(1,1) PRIMARY KEY,
        [invoice_number] NVARCHAR(50) NOT NULL,
        [customer_id] INT NOT NULL,
        [invoice_date] DATETIME NOT NULL,
        [due_date] DATETIME NOT NULL,
        [invoice_balance] DECIMAL(18,2) NOT NULL,
        [original_amount] DECIMAL(18,2) NOT NULL,
        [status] NVARCHAR(20) NOT NULL DEFAULT 'Open',
        [created_date] DATETIME DEFAULT GETDATE(),
        [updated_date] DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_ar_invoices_due_date ON [dbo].[ar_invoices] ([due_date]);
    CREATE INDEX IX_ar_invoices_status ON [dbo].[ar_invoices] ([status]);
END
GO

-- Sales Orders table for Daily Orders, Key Metrics (27+ data points)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sales_orders]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[sales_orders] (
        [order_id] INT IDENTITY(1,1) PRIMARY KEY,
        [order_number] NVARCHAR(50) NOT NULL,
        [customer_id] INT NOT NULL,
        [order_date] DATETIME NOT NULL,
        [ship_date] DATETIME NULL,
        [order_total] DECIMAL(18,2) NOT NULL,
        [status] NVARCHAR(20) NOT NULL DEFAULT 'Open',
        [source_system] NVARCHAR(10) DEFAULT 'P21',
        [created_date] DATETIME DEFAULT GETDATE(),
        [updated_date] DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_sales_orders_order_date ON [dbo].[sales_orders] ([order_date]);
    CREATE INDEX IX_sales_orders_status ON [dbo].[sales_orders] ([status]);
END
GO

-- Order Lines table for Backorders calculation
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[order_lines]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[order_lines] (
        [line_id] INT IDENTITY(1,1) PRIMARY KEY,
        [order_id] INT NOT NULL,
        [product_id] INT NOT NULL,
        [quantity_ordered] DECIMAL(18,4) NOT NULL,
        [quantity_shipped] DECIMAL(18,4) DEFAULT 0,
        [unit_price] DECIMAL(18,4) NOT NULL,
        [line_total] DECIMAL(18,2) NOT NULL,
        [status] NVARCHAR(20) NOT NULL DEFAULT 'Open',
        [created_date] DATETIME DEFAULT GETDATE(),
        FOREIGN KEY ([order_id]) REFERENCES [dbo].[sales_orders]([order_id])
    );
    
    CREATE INDEX IX_order_lines_status ON [dbo].[order_lines] ([status]);
END
GO

-- Payments table for Revenue calculations
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[payments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[payments] (
        [payment_id] INT IDENTITY(1,1) PRIMARY KEY,
        [invoice_id] INT NULL,
        [customer_id] INT NOT NULL,
        [payment_amount] DECIMAL(18,2) NOT NULL,
        [payment_date] DATETIME NOT NULL,
        [payment_method] NVARCHAR(50) NOT NULL,
        [reference_number] NVARCHAR(100) NULL,
        [created_date] DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_payments_payment_date ON [dbo].[payments] ([payment_date]);
END
GO

-- Sales History table for Historical Data charts (36 data points)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sales_history]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[sales_history] (
        [history_id] INT IDENTITY(1,1) PRIMARY KEY,
        [order_id] INT NOT NULL,
        [order_date] DATETIME NOT NULL,
        [order_total] DECIMAL(18,2) NOT NULL,
        [source_system] NVARCHAR(10) NOT NULL, -- 'P21' or 'POR'
        [customer_id] INT NOT NULL,
        [created_date] DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_sales_history_order_date ON [dbo].[sales_history] ([order_date]);
    CREATE INDEX IX_sales_history_source_system ON [dbo].[sales_history] ([source_system]);
END
GO

-- Products table for inventory calculations
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[products] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [product_code] NVARCHAR(50) NOT NULL,
        [product_name] NVARCHAR(255) NOT NULL,
        [cost] DECIMAL(18,4) NOT NULL,
        [price] DECIMAL(18,4) NOT NULL,
        [category] NVARCHAR(50) NULL,
        [active] BIT DEFAULT 1,
        [created_date] DATETIME DEFAULT GETDATE()
    );
    
    CREATE UNIQUE INDEX IX_products_product_code ON [dbo].[products] ([product_code]);
END
GO

-- Inventory table for Site Distribution charts (3 data points)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[inventory]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[inventory] (
        [inventory_id] INT IDENTITY(1,1) PRIMARY KEY,
        [product_id] INT NOT NULL,
        [location_id] NVARCHAR(20) NOT NULL, -- 'SITE_A', 'SITE_B', 'SITE_C'
        [quantity_on_hand] DECIMAL(18,4) NOT NULL DEFAULT 0,
        [reserved_quantity] DECIMAL(18,4) DEFAULT 0,
        [last_updated] DATETIME DEFAULT GETDATE(),
        FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id])
    );
    
    CREATE INDEX IX_inventory_location_id ON [dbo].[inventory] ([location_id]);
    CREATE INDEX IX_inventory_product_location ON [dbo].[inventory] ([product_id], [location_id]);
END
GO

-- Customers table for lookups
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[customers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[customers] (
        [customer_id] INT IDENTITY(1,1) PRIMARY KEY,
        [customer_code] NVARCHAR(50) NOT NULL,
        [customer_name] NVARCHAR(255) NOT NULL,
        [address] NVARCHAR(500) NULL,
        [phone] NVARCHAR(50) NULL,
        [email] NVARCHAR(255) NULL,
        [active] BIT DEFAULT 1,
        [created_date] DATETIME DEFAULT GETDATE()
    );
    
    CREATE UNIQUE INDEX IX_customers_customer_code ON [dbo].[customers] ([customer_code]);
END
GO

PRINT 'P21 database schema creation completed successfully.';
