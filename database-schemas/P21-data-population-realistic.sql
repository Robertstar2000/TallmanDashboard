-- P21 SQL Server Data Population Script - REALISTIC BUSINESS SCALE
-- Creates sample data that matches actual business volumes:
-- - Yearly Sales: $20-60 million
-- - Daily Sales: $200,000-$500,000

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

-- Insert Customers (500 records - larger customer base)
DECLARE @CustomerCount INT = 1;
WHILE @CustomerCount <= 500
BEGIN
    INSERT INTO [dbo].[customers] ([customer_code], [customer_name], [address], [phone], [email], [active], [created_date])
    VALUES (
        'CUST' + RIGHT('000' + CAST(@CustomerCount AS VARCHAR(3)), 3),
        'Customer ' + CAST(@CustomerCount AS VARCHAR(3)) + ' Inc.',
        CAST(@CustomerCount AS VARCHAR(10)) + ' Main Street, Business City, ST 12345',
        '555-' + RIGHT('000' + CAST(@CustomerCount AS VARCHAR(3)), 3) + '-' + RIGHT('000' + CAST(@CustomerCount + 1000 AS VARCHAR(3)), 4),
        'contact' + CAST(@CustomerCount AS VARCHAR(3)) + '@customer' + CAST(@CustomerCount AS VARCHAR(3)) + '.com',
        1,
        DATEADD(DAY, -(@CustomerCount % 365), GETDATE())
    );
    SET @CustomerCount = @CustomerCount + 1;
END
GO

-- Insert Products (1000 records)
DECLARE @ProductCount INT = 1;
WHILE @ProductCount <= 1000
BEGIN
    INSERT INTO [dbo].[products] ([product_code], [product_name], [cost], [price], [category], [active])
    VALUES (
        'PROD' + RIGHT('0000' + CAST(@ProductCount AS VARCHAR(4)), 4),
        'Product ' + CAST(@ProductCount AS VARCHAR(4)),
        ROUND(RAND() * 500 + 50, 2),   -- Cost between $50-$550
        ROUND(RAND() * 1000 + 100, 2), -- Price between $100-$1,100
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

-- Insert AR Invoices (5000 records with realistic amounts)
DECLARE @InvoiceCount INT = 1;
WHILE @InvoiceCount <= 5000
BEGIN
    DECLARE @DaysAgo INT = FLOOR(RAND() * 365);  -- Random invoice from last year
    -- Realistic invoice amounts: $500 to $25,000
    DECLARE @InvoiceAmount DECIMAL(18,2) = ROUND(RAND() * 24500 + 500, 2);
    DECLARE @PaidAmount DECIMAL(18,2) = CASE 
        WHEN RAND() > 0.3 THEN ROUND(@InvoiceAmount * (RAND() * 0.8 + 0.1), 2) 
        ELSE 0 
    END;
    
    INSERT INTO [dbo].[ar_invoices] 
    ([invoice_number], [customer_id], [invoice_date], [due_date], [invoice_balance], [original_amount], [status])
    VALUES (
        'INV-' + RIGHT('00000' + CAST(@InvoiceCount AS VARCHAR(5)), 5),
        (@InvoiceCount % 500) + 1,  -- Random customer 1-500
        DATEADD(DAY, -@DaysAgo, GETDATE()),
        DATEADD(DAY, -@DaysAgo + 30, GETDATE()),  -- 30 day terms
        @InvoiceAmount - @PaidAmount,
        @InvoiceAmount,
        CASE WHEN @PaidAmount >= @InvoiceAmount THEN 'Paid' ELSE 'Open' END
    );
    SET @InvoiceCount = @InvoiceCount + 1;
END
GO

-- Insert Sales Orders (20,000 records for realistic volume)
-- Target: ~55 orders per day averaging $7,500 = ~$400K daily sales
DECLARE @OrderCount INT = 1;
WHILE @OrderCount <= 20000
BEGIN
    DECLARE @OrderDaysAgo INT = FLOOR(RAND() * 365);
    -- Realistic order amounts: $1,000 to $50,000, weighted toward $5,000-$15,000
    DECLARE @OrderTotal DECIMAL(18,2) = CASE
        WHEN RAND() < 0.6 THEN ROUND(RAND() * 10000 + 5000, 2)  -- 60% between $5K-$15K
        WHEN RAND() < 0.85 THEN ROUND(RAND() * 15000 + 1000, 2) -- 25% between $1K-$16K
        ELSE ROUND(RAND() * 35000 + 15000, 2)                   -- 15% between $15K-$50K
    END;
    
    INSERT INTO [dbo].[sales_orders] 
    ([order_number], [customer_id], [order_date], [ship_date], [order_total], [status], [source_system])
    VALUES (
        'SO-' + RIGHT('00000' + CAST(@OrderCount AS VARCHAR(5)), 5),
        (@OrderCount % 500) + 1,
        DATEADD(DAY, -@OrderDaysAgo, GETDATE()),
        CASE 
            WHEN RAND() > 0.2 THEN DATEADD(DAY, -@OrderDaysAgo + FLOOR(RAND() * 7 + 1), GETDATE())
            ELSE NULL 
        END,
        @OrderTotal,
        CASE 
            WHEN RAND() > 0.85 THEN 'Open'
            WHEN RAND() > 0.05 THEN 'Shipped'
            ELSE 'Cancelled'
        END,
        'P21'
    );
    SET @OrderCount = @OrderCount + 1;
END
GO

-- Insert Order Lines (50,000 records for backorder calculations)
DECLARE @LineCount INT = 1;
WHILE @LineCount <= 50000
BEGIN
    DECLARE @Qty DECIMAL(18,4) = FLOOR(RAND() * 100) + 1;
    DECLARE @ShippedQty DECIMAL(18,4) = CASE 
        WHEN RAND() > 0.3 THEN @Qty 
        ELSE FLOOR(@Qty * RAND()) 
    END;
    DECLARE @UnitPrice DECIMAL(18,4) = ROUND(RAND() * 2000 + 50, 2);
    
    INSERT INTO [dbo].[order_lines] 
    ([order_id], [product_id], [quantity_ordered], [quantity_shipped], [unit_price], [line_total], [status])
    VALUES (
        (@LineCount % 20000) + 1,  -- Reference existing orders
        (@LineCount % 1000) + 1,   -- Reference existing products
        @Qty,
        @ShippedQty,
        @UnitPrice,
        @Qty * @UnitPrice,
        CASE 
            WHEN @ShippedQty >= @Qty THEN 'Completed' 
            WHEN @ShippedQty > 0 THEN 'Backordered'
            ELSE 'Open' 
        END
    );
    SET @LineCount = @LineCount + 1;
END
GO

-- Insert Payments (15,000 records for realistic revenue tracking)
DECLARE @PaymentCount INT = 1;
WHILE @PaymentCount <= 15000
BEGIN
    DECLARE @PaymentDaysAgo INT = FLOOR(RAND() * 365);
    -- Realistic payment amounts: $500 to $30,000
    DECLARE @PaymentAmount DECIMAL(18,2) = ROUND(RAND() * 29500 + 500, 2);
    
    INSERT INTO [dbo].[payments] 
    ([invoice_id], [customer_id], [payment_amount], [payment_date], [payment_method], [reference_number])
    VALUES (
        CASE WHEN RAND() > 0.2 THEN (@PaymentCount % 5000) + 1 ELSE NULL END,
        (@PaymentCount % 500) + 1,
        @PaymentAmount,
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

-- Insert Inventory for Site Distribution (3000 records across 3 sites)
DECLARE @InvCount INT = 1;
WHILE @InvCount <= 1000  -- 1000 products
BEGIN
    -- Site A (largest)
    INSERT INTO [dbo].[inventory] ([product_id], [location_id], [quantity_on_hand], [reserved_quantity])
    VALUES (@InvCount, 'SITE_A', FLOOR(RAND() * 2000 + 100), FLOOR(RAND() * 100));
    
    -- Site B (medium)
    INSERT INTO [dbo].[inventory] ([product_id], [location_id], [quantity_on_hand], [reserved_quantity])
    VALUES (@InvCount, 'SITE_B', FLOOR(RAND() * 1500 + 50), FLOOR(RAND() * 75));
    
    -- Site C (smaller)
    INSERT INTO [dbo].[inventory] ([product_id], [location_id], [quantity_on_hand], [reserved_quantity])
    VALUES (@InvCount, 'SITE_C', FLOOR(RAND() * 1000 + 25), FLOOR(RAND() * 50));
    
    SET @InvCount = @InvCount + 1;
END
GO

-- Create realistic today's data for real-time metrics
-- Today's orders (targeting ~$400K in daily sales)
DECLARE @TodayOrderCount INT = 1;
WHILE @TodayOrderCount <= 55  -- ~55 orders per day
BEGIN
    DECLARE @TodayAmount DECIMAL(18,2) = CASE
        WHEN RAND() < 0.6 THEN ROUND(RAND() * 10000 + 5000, 2)   -- Most orders $5K-$15K
        WHEN RAND() < 0.85 THEN ROUND(RAND() * 15000 + 2000, 2)  -- Some $2K-$17K
        ELSE ROUND(RAND() * 30000 + 15000, 2)                    -- Few large $15K-$45K
    END;

    INSERT INTO [dbo].[sales_orders] 
    ([order_number], [customer_id], [order_date], [order_total], [status], [source_system])
    VALUES (
        'SO-TODAY-' + RIGHT('000' + CAST(@TodayOrderCount AS VARCHAR(3)), 3),
        FLOOR(RAND() * 500) + 1,
        GETDATE(),
        @TodayAmount,
        CASE WHEN RAND() > 0.8 THEN 'Open' ELSE 'Shipped' END,
        'P21'
    );
    SET @TodayOrderCount = @TodayOrderCount + 1;
END
GO

-- Today's payments (realistic daily revenue)
DECLARE @TodayPaymentCount INT = 1;
WHILE @TodayPaymentCount <= 25  -- ~25 payments per day
BEGIN
    DECLARE @TodayPaymentAmount DECIMAL(18,2) = ROUND(RAND() * 15000 + 2000, 2);  -- $2K-$17K payments
    
    INSERT INTO [dbo].[payments] 
    ([customer_id], [payment_amount], [payment_date], [payment_method])
    VALUES (
        FLOOR(RAND() * 500) + 1,
        @TodayPaymentAmount,
        GETDATE(),
        CASE 
            WHEN RAND() > 0.6 THEN 'Check'
            WHEN RAND() > 0.3 THEN 'Credit Card'
            ELSE 'ACH Transfer'
        END
    );
    SET @TodayPaymentCount = @TodayPaymentCount + 1;
END
GO

PRINT 'P21 realistic business-scale data population completed successfully.';
PRINT 'Created:';
PRINT '- 500 Customers';
PRINT '- 1000 Products';
PRINT '- 5000 AR Invoices ($500-$25K each)';
PRINT '- 20,055 Sales Orders ($1K-$50K each, targeting ~$40M yearly)';
PRINT '- 50,000 Order Lines';
PRINT '- 15,025 Payments ($500-$30K each)';
PRINT '- 3000 Inventory records (3 sites)';
PRINT '- Historical sales data copied';
PRINT '';
PRINT 'Expected Business Metrics:';
PRINT '- Yearly Sales: ~$40-50M';
PRINT '- Daily Sales: ~$350-450K';
PRINT '- Today Sales: ~$400K (55 orders)';
PRINT '- Today Revenue: ~$250K (25 payments)';
