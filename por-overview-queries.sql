-- POR Overview SQL Queries
-- These queries have been tested and verified to work with the MS Access database.

-- New Rentals
-- New Rentals March '25
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #3/1/2025# 
                          AND [Date] <= #3/31/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #2/1/2025# 
                          AND [Date] <= #2/28/2025#
                          AND [Status] <> 'Closed');

-- New Rentals February '25
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #2/1/2025# 
                          AND [Date] <= #2/28/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #1/1/2025# 
                          AND [Date] <= #1/31/2025#
                          AND [Status] <> 'Closed');

-- New Rentals January '25
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #1/1/2025# 
                          AND [Date] <= #1/31/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #12/1/2024# 
                          AND [Date] <= #12/31/2024#
                          AND [Status] <> 'Closed');

-- New Rentals December '24
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #12/1/2024# 
                          AND [Date] <= #12/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #11/1/2024# 
                          AND [Date] <= #11/30/2024#
                          AND [Status] <> 'Closed');

-- New Rentals November '24
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #11/1/2024# 
                          AND [Date] <= #11/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #10/1/2024# 
                          AND [Date] <= #10/31/2024#
                          AND [Status] <> 'Closed');

-- New Rentals October '24
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #10/1/2024# 
                          AND [Date] <= #10/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #9/1/2024# 
                          AND [Date] <= #9/30/2024#
                          AND [Status] <> 'Closed');

-- New Rentals September '24
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #9/1/2024# 
                          AND [Date] <= #9/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #8/1/2024# 
                          AND [Date] <= #8/31/2024#
                          AND [Status] <> 'Closed');

-- New Rentals August '24
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #8/1/2024# 
                          AND [Date] <= #8/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #7/1/2024# 
                          AND [Date] <= #7/31/2024#
                          AND [Status] <> 'Closed');

-- New Rentals July '24
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #7/1/2024# 
                          AND [Date] <= #7/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #6/1/2024# 
                          AND [Date] <= #6/30/2024#
                          AND [Status] <> 'Closed');

-- New Rentals June '24
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #6/1/2024# 
                          AND [Date] <= #6/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #5/1/2024# 
                          AND [Date] <= #5/31/2024#
                          AND [Status] <> 'Closed');

-- New Rentals May '24
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #5/1/2024# 
                          AND [Date] <= #5/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #4/1/2024# 
                          AND [Date] <= #4/30/2024#
                          AND [Status] <> 'Closed');

-- New Rentals April '24
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #4/1/2024# 
                          AND [Date] <= #4/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #3/1/2024# 
                          AND [Date] <= #3/31/2024#
                          AND [Status] <> 'Closed');

-- Open Rentals
-- Open Rentals March '25
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #3/1/2025# 
                AND [Date] <= #3/31/2025#;

-- Open Rentals February '25
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #2/1/2025# 
                AND [Date] <= #2/28/2025#;

-- Open Rentals January '25
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #1/1/2025# 
                AND [Date] <= #1/31/2025#;

-- Open Rentals December '24
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #12/1/2024# 
                AND [Date] <= #12/31/2024#;

-- Open Rentals November '24
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #11/1/2024# 
                AND [Date] <= #11/30/2024#;

-- Open Rentals October '24
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #10/1/2024# 
                AND [Date] <= #10/31/2024#;

-- Open Rentals September '24
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #9/1/2024# 
                AND [Date] <= #9/30/2024#;

-- Open Rentals August '24
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #8/1/2024# 
                AND [Date] <= #8/31/2024#;

-- Open Rentals July '24
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #7/1/2024# 
                AND [Date] <= #7/31/2024#;

-- Open Rentals June '24
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #6/1/2024# 
                AND [Date] <= #6/30/2024#;

-- Open Rentals May '24
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #5/1/2024# 
                AND [Date] <= #5/31/2024#;

-- Open Rentals April '24
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #4/1/2024# 
                AND [Date] <= #4/30/2024#;

-- Rental Value
-- Rental Value March '25
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #3/1/2025# 
                AND [Date] <= #3/31/2025#;

-- Rental Value February '25
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #2/1/2025# 
                AND [Date] <= #2/28/2025#;

-- Rental Value January '25
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #1/1/2025# 
                AND [Date] <= #1/31/2025#;

-- Rental Value December '24
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #12/1/2024# 
                AND [Date] <= #12/31/2024#;

-- Rental Value November '24
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #11/1/2024# 
                AND [Date] <= #11/30/2024#;

-- Rental Value October '24
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #10/1/2024# 
                AND [Date] <= #10/31/2024#;

-- Rental Value September '24
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #9/1/2024# 
                AND [Date] <= #9/30/2024#;

-- Rental Value August '24
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #8/1/2024# 
                AND [Date] <= #8/31/2024#;

-- Rental Value July '24
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #7/1/2024# 
                AND [Date] <= #7/31/2024#;

-- Rental Value June '24
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #6/1/2024# 
                AND [Date] <= #6/30/2024#;

-- Rental Value May '24
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #5/1/2024# 
                AND [Date] <= #5/31/2024#;

-- Rental Value April '24
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #4/1/2024# 
                AND [Date] <= #4/30/2024#;

