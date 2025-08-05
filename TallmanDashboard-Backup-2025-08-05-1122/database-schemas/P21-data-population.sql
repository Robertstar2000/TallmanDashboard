-- P21 SQL Server Data Population Script
-- Creates sample data that matches TallmanDashboard chart requirements

USE P21;
GO

-- Clear existing data (if any)
DELETE FROM [dbo].[inventory];
DELETE FROM [dbo].[order_lines];
DELETE FROM [dbo].[payments];
DELETE FROM [dbo].[sales_history];
DELETE FROM [dbo].[sales_orders];
DELETE FROM [dbo].[ar_invoices];
DELETE FROM [dbo].[products];
DELETE FROM [dbo].[customers];
GO

-- Insert Customers (100 records)
DECLARE @CustomerCount INT = 1;
WHILE @CustomerCount <= 100
BEGIN
    INSERT INTO [dbo].[customers] ([customer_code], [customer_name], [address], [phone], [email], [active], [created_date])
    VALUES (
        'CUST' + RIGHT('000' + CAST(@CustomerCount AS VARCHAR(3)), 3),
        'Customer ' + CAST(@CustomerCount AS VARCHAR(3)) + ' Inc.',
        CAST(@CustomerCount AS VARCHAR(10)) + ' Main Street, Business City, ST 12345',
        '555-' + RIGHT('000' + CAST(@CustomerCount AS VARCHAR(3)), 3) + '-' + RIGHT('000' + CAST(@CustomerCount + 1000 AS VARCHAR(3)), 4),
        'contact' + CAST(@CustomerCount AS VARCHAR(3)) + '@customer' + CAST(@CustomerCount AS VARCHAR(3)) + '.com',
        1,
        DATEADD(DAY, -@CustomerCount, GETDATE())
    );
    SET @CustomerCount = @CustomerCount + 1;
END
GO

-- Insert Products (500 records)
DECLARE @ProductCount INT = 1;
WHILE @ProductCount <= 500
BEGIN
    INSERT INTO [dbo].[products] ([product_code], [product_name], [cost], [price], [category], [active])
    VALUES (
        'PROD' + RIGHT('0000' + CAST(@ProductCount AS VARCHAR(4)), 4),
        'Product ' + CAST(@ProductCount AS VARCHAR(4)),
        ROUND(RAND() * 100 + 10, 2),  -- Cost between $10-$110
        ROUND(RAND() * 200 + 20, 2),  -- Price between $20-$220
        CASE 
            WHEN @ProductCount % 5 = 0 THEN 'Electronics'
            WHEN @ProductCount % 5 = 1 THEN 'Hardware'
            WHEN @ProductCount % 5 = 2 THEN 'Software'
            WHEN @ProductCount % 5 = 3 THEN 'Accessories'
            ELSE 'Services'
        END,
        1
    );
    SET @ProductCount = @ProductCount + 1;
END
GO

-- Insert AR Invoices (1000 records covering various aging periods)
DECLARE @InvoiceCount INT = 1;
WHILE @InvoiceCount <= 1000
BEGIN
    DECLARE @DaysAgo INT = FLOOR(RAND() * 365);  -- Random invoice from last year
    DECLARE @InvoiceAmount DECIMAL(18,2) = ROUND(RAND() * 5000 + 100, 2);
    DECLARE @PaidAmount DECIMAL(18,2) = CASE 
        WHEN RAND() > 0.3 THEN ROUND(@InvoiceAmount * RAND() * 0.8, 2) 
        ELSE 0 
    END;
    
    INSERT INTO [dbo].[ar_invoices] 
    ([invoice_number], [customer_id], [invoice_date], [due_date], [invoice_balance], [original_amount], [status])
    VALUES (
        'INV-' + RIGHT('00000' + CAST(@InvoiceCount AS VARCHAR(5)), 5),
        (@InvoiceCount % 100) + 1,  -- Random customer 1-100
        DATEADD(DAY, -@DaysAgo, GETDATE()),
        DATEADD(DAY, -@DaysAgo + 30, GETDATE()),  -- 30 day terms
        @InvoiceAmount - @PaidAmount,
        @InvoiceAmount,
        CASE WHEN @PaidAmount >= @InvoiceAmount THEN 'Paid' ELSE 'Open' END
    );
    SET @InvoiceCount = @InvoiceCount + 1;
END
GO

-- Insert Sales Orders (2000 records covering last year)
DECLARE @OrderCount INT = 1;
WHILE @OrderCount <= 2000
BEGIN
    DECLARE @OrderDaysAgo INT = FLOOR(RAND() * 365);
    DECLARE @OrderTotal DECIMAL(18,2) = ROUND(RAND() * 10000 + 200, 2);
    
    INSERT INTO [dbo].[sales_orders] 
    ([order_number], [customer_id], [order_date], [ship_date], [order_total], [status], [source_system])
    VALUES (
        'SO-' + RIGHT('00000' + CAST(@OrderCount AS VARCHAR(5)), 5),
        (@OrderCount % 100) + 1,
        DATEADD(DAY, -@OrderDaysAgo, GETDATE()),
        CASE 
            WHEN RAND() > 0.2 THEN DATEADD(DAY, -@OrderDaysAgo + FLOOR(RAND() * 7 + 1), GETDATE())
            ELSE NULL 
        END,
        @OrderTotal,
        CASE 
            WHEN RAND() > 0.8 THEN 'Open'
            WHEN RAND() > 0.1 THEN 'Shipped'
            ELSE 'Cancelled'
        END,
        'P21'
    );
    SET @OrderCount = @OrderCount + 1;
END
GO

-- Insert Order Lines (5000 records for backorder calculations)
DECLARE @LineCount INT = 1;
WHILE @LineCount <= 5000
BEGIN
    DECLARE @Qty DECIMAL(18,4) = FLOOR(RAND() * 100) + 1;
    DECLARE @ShippedQty DECIMAL(18,4) = CASE 
        WHEN RAND() > 0.3 THEN @Qty 
        ELSE FLOOR(@Qty * RAND()) 
    END;
    DECLARE @UnitPrice DECIMAL(18,4) = ROUND(RAND() * 500 + 10, 2);
    
    INSERT INTO [dbo].[order_lines] 
    ([order_id], [product_id], [quantity_ordered], [quantity_shipped], [unit_price], [line_total], [status])
    VALUES (
        (@LineCount % 2000) + 1,  -- Reference existing orders
        (@LineCount % 500) + 1,   -- Reference existing products
        @Qty,
        @ShippedQty,
        @UnitPrice,
        @Qty * @UnitPrice,
        CASE WHEN @ShippedQty >= @Qty THEN 'Completed' ELSE 'Open' END
    );
    SET @LineCount = @LineCount + 1;
END
GO

-- Insert Payments (1500 records for revenue tracking)
DECLARE @PaymentCount INT = 1;
WHILE @PaymentCount <= 1500
BEGIN
    DECLARE @PaymentDaysAgo INT = FLOOR(RAND() * 365);
    
    INSERT INTO [dbo].[payments] 
    ([invoice_id], [customer_id], [payment_amount], [payment_date], [payment_method], [reference_number])
    VALUES (
        CASE WHEN RAND() > 0.2 THEN (@PaymentCount % 1000) + 1 ELSE NULL END,
        (@PaymentCount % 100) + 1,
        ROUND(RAND() * 3000 + 50, 2),
        DATEADD(DAY, -@PaymentDaysAgo, GETDATE()),
        CASE 
            WHEN RAND() > 0.6 THEN 'Check'
            WHEN RAND() > 0.3 THEN 'Credit Card'
            ELSE 'ACH Transfer'
        END,
        'REF-' + RIGHT('00000' + CAST(@PaymentCount AS VARCHAR(5)), 5)
    );
    SET @PaymentCount = @PaymentCount + 1;
END
GO

-- Insert Sales History (copy from sales_orders for historical analysis)
INSERT INTO [dbo].[sales_history] ([order_id], [order_date], [order_total], [source_system], [customer_id])
SELECT [order_id], [order_date], [order_total], [source_system], [customer_id]
FROM [dbo].[sales_orders];
GO

-- Insert Inventory for Site Distribution (1500 records across 3 sites)
DECLARE @InvCount INT = 1;
WHILE @InvCount <= 500  -- 500 products
BEGIN
    -- Site A
    INSERT INTO [dbo].[inventory] ([product_id], [location_id], [quantity_on_hand], [reserved_quantity])
    VALUES (@InvCount, 'SITE_A', FLOOR(RAND() * 1000), FLOOR(RAND() * 50));
    
    -- Site B
    INSERT INTO [dbo].[inventory] ([product_id], [location_id], [quantity_on_hand], [reserved_quantity])
    VALUES (@InvCount, 'SITE_B', FLOOR(RAND() * 800), FLOOR(RAND() * 40));
    
    -- Site C
    INSERT INTO [dbo].[inventory] ([product_id], [location_id], [quantity_on_hand], [reserved_quantity])
    VALUES (@InvCount, 'SITE_C', FLOOR(RAND() * 600), FLOOR(RAND() * 30));
    
    SET @InvCount = @InvCount + 1;
END
GO

-- Create additional today's data for real-time metrics
-- Today's orders
INSERT INTO [dbo].[sales_orders] 
([order_number], [customer_id], [order_date], [order_total], [status], [source_system])
VALUES 
('SO-TODAY-001', 1, GETDATE(), 1500.00, 'Open', 'P21'),
('SO-TODAY-002', 2, GETDATE(), 2750.00, 'Open', 'P21'),
('SO-TODAY-003', 3, GETDATE(), 980.00, 'Shipped', 'P21'),
('SO-TODAY-004', 4, GETDATE(), 3200.00, 'Open', 'P21'),
('SO-TODAY-005', 5, GETDATE(), 675.00, 'Open', 'P21');
GO

-- Today's payments
INSERT INTO [dbo].[payments] 
([customer_id], [payment_amount], [payment_date], [payment_method])
VALUES 
(1, 2500.00, GETDATE(), 'Check'),
(2, 1800.00, GETDATE(), 'Credit Card'),
(3, 950.00, GETDATE(), 'ACH Transfer');
GO

PRINT 'P21 data population completed successfully.';
PRINT 'Created:';
PRINT '- 100 Customers';
PRINT '- 500 Products';
PRINT '- 1000 AR Invoices';
PRINT '- 2005 Sales Orders (including 5 for today)';
PRINT '- 5000 Order Lines';
PRINT '- 1503 Payments (including 3 for today)';
PRINT '- 1500 Inventory records (3 sites)';
PRINT '- Historical sales data copied';
