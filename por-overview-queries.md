# POR Overview Chart SQL Queries (MS Access)

This document contains MS Access SQL queries for the POR Overview chart in the admin spreadsheet.

## New Rentals

| Month | SQL Expression |
|-------|---------------|
| March '25 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #3/1/2025# 
                          AND [Date] <= #3/31/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #2/1/2025# 
                          AND [Date] <= #2/28/2025#
                          AND [Status] <> 'Closed')` |
| February '25 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #2/1/2025# 
                          AND [Date] <= #2/28/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #1/1/2025# 
                          AND [Date] <= #1/31/2025#
                          AND [Status] <> 'Closed')` |
| January '25 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #1/1/2025# 
                          AND [Date] <= #1/31/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #12/1/2024# 
                          AND [Date] <= #12/31/2024#
                          AND [Status] <> 'Closed')` |
| December '24 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #12/1/2024# 
                          AND [Date] <= #12/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #11/1/2024# 
                          AND [Date] <= #11/30/2024#
                          AND [Status] <> 'Closed')` |
| November '24 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #11/1/2024# 
                          AND [Date] <= #11/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #10/1/2024# 
                          AND [Date] <= #10/31/2024#
                          AND [Status] <> 'Closed')` |
| October '24 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #10/1/2024# 
                          AND [Date] <= #10/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #9/1/2024# 
                          AND [Date] <= #9/30/2024#
                          AND [Status] <> 'Closed')` |
| September '24 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #9/1/2024# 
                          AND [Date] <= #9/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #8/1/2024# 
                          AND [Date] <= #8/31/2024#
                          AND [Status] <> 'Closed')` |
| August '24 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #8/1/2024# 
                          AND [Date] <= #8/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #7/1/2024# 
                          AND [Date] <= #7/31/2024#
                          AND [Status] <> 'Closed')` |
| July '24 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #7/1/2024# 
                          AND [Date] <= #7/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #6/1/2024# 
                          AND [Date] <= #6/30/2024#
                          AND [Status] <> 'Closed')` |
| June '24 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #6/1/2024# 
                          AND [Date] <= #6/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #5/1/2024# 
                          AND [Date] <= #5/31/2024#
                          AND [Status] <> 'Closed')` |
| May '24 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #5/1/2024# 
                          AND [Date] <= #5/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #4/1/2024# 
                          AND [Date] <= #4/30/2024#
                          AND [Status] <> 'Closed')` |
| April '24 | `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #4/1/2024# 
                          AND [Date] <= #4/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #3/1/2024# 
                          AND [Date] <= #3/31/2024#
                          AND [Status] <> 'Closed')` |

## Open Rentals

| Month | SQL Expression |
|-------|---------------|
| March '25 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #3/1/2025# 
                AND [Date] <= #3/31/2025#` |
| February '25 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #2/1/2025# 
                AND [Date] <= #2/28/2025#` |
| January '25 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #1/1/2025# 
                AND [Date] <= #1/31/2025#` |
| December '24 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #12/1/2024# 
                AND [Date] <= #12/31/2024#` |
| November '24 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #11/1/2024# 
                AND [Date] <= #11/30/2024#` |
| October '24 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #10/1/2024# 
                AND [Date] <= #10/31/2024#` |
| September '24 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #9/1/2024# 
                AND [Date] <= #9/30/2024#` |
| August '24 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #8/1/2024# 
                AND [Date] <= #8/31/2024#` |
| July '24 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #7/1/2024# 
                AND [Date] <= #7/31/2024#` |
| June '24 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #6/1/2024# 
                AND [Date] <= #6/30/2024#` |
| May '24 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #5/1/2024# 
                AND [Date] <= #5/31/2024#` |
| April '24 | `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #4/1/2024# 
                AND [Date] <= #4/30/2024#` |

## Rental Value

| Month | SQL Expression |
|-------|---------------|
| March '25 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #3/1/2025# 
                AND [Date] <= #3/31/2025#` |
| February '25 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #2/1/2025# 
                AND [Date] <= #2/28/2025#` |
| January '25 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #1/1/2025# 
                AND [Date] <= #1/31/2025#` |
| December '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #12/1/2024# 
                AND [Date] <= #12/31/2024#` |
| November '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #11/1/2024# 
                AND [Date] <= #11/30/2024#` |
| October '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #10/1/2024# 
                AND [Date] <= #10/31/2024#` |
| September '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #9/1/2024# 
                AND [Date] <= #9/30/2024#` |
| August '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #8/1/2024# 
                AND [Date] <= #8/31/2024#` |
| July '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #7/1/2024# 
                AND [Date] <= #7/31/2024#` |
| June '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #6/1/2024# 
                AND [Date] <= #6/30/2024#` |
| May '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #5/1/2024# 
                AND [Date] <= #5/31/2024#` |
| April '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #4/1/2024# 
                AND [Date] <= #4/30/2024#` |

