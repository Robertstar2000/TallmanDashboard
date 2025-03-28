# POR Overview Queries for Admin Spreadsheet

This document contains the SQL queries for the POR Overview chart that should be added to the admin spreadsheet.

These queries have been tested and verified to work with the MS Access database.

## New Rentals

| Month | SQL Expression |
|-------|---------------|
| March '25 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #3/1/2025#  AND [Date] <= #3/31/2025#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #2/1/2025#  AND [Date] <= #2/28/2025# AND [Status] <> 'Closed')` |
| February '25 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #2/1/2025#  AND [Date] <= #2/28/2025#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #1/1/2025#  AND [Date] <= #1/31/2025# AND [Status] <> 'Closed')` |
| January '25 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #1/1/2025#  AND [Date] <= #1/31/2025#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #12/1/2024#  AND [Date] <= #12/31/2024# AND [Status] <> 'Closed')` |
| December '24 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #12/1/2024#  AND [Date] <= #12/31/2024#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #11/1/2024#  AND [Date] <= #11/30/2024# AND [Status] <> 'Closed')` |
| November '24 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #11/1/2024#  AND [Date] <= #11/30/2024#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #10/1/2024#  AND [Date] <= #10/31/2024# AND [Status] <> 'Closed')` |
| October '24 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #10/1/2024#  AND [Date] <= #10/31/2024#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #9/1/2024#  AND [Date] <= #9/30/2024# AND [Status] <> 'Closed')` |
| September '24 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #9/1/2024#  AND [Date] <= #9/30/2024#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #8/1/2024#  AND [Date] <= #8/31/2024# AND [Status] <> 'Closed')` |
| August '24 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #8/1/2024#  AND [Date] <= #8/31/2024#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #7/1/2024#  AND [Date] <= #7/31/2024# AND [Status] <> 'Closed')` |
| July '24 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #7/1/2024#  AND [Date] <= #7/31/2024#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #6/1/2024#  AND [Date] <= #6/30/2024# AND [Status] <> 'Closed')` |
| June '24 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #6/1/2024#  AND [Date] <= #6/30/2024#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #5/1/2024#  AND [Date] <= #5/31/2024# AND [Status] <> 'Closed')` |
| May '24 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #5/1/2024#  AND [Date] <= #5/31/2024#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #4/1/2024#  AND [Date] <= #4/30/2024# AND [Status] <> 'Closed')` |
| April '24 | `(SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #4/1/2024#  AND [Date] <= #4/30/2024#) - (SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #3/1/2024#  AND [Date] <= #3/31/2024# AND [Status] <> 'Closed')` |

## Open Rentals

| Month | SQL Expression |
|-------|---------------|
| March '25 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #3/1/2025#  AND [Date] <= #3/31/2025#` |
| February '25 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #2/1/2025#  AND [Date] <= #2/28/2025#` |
| January '25 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #1/1/2025#  AND [Date] <= #1/31/2025#` |
| December '24 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #12/1/2024#  AND [Date] <= #12/31/2024#` |
| November '24 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #11/1/2024#  AND [Date] <= #11/30/2024#` |
| October '24 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #10/1/2024#  AND [Date] <= #10/31/2024#` |
| September '24 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #9/1/2024#  AND [Date] <= #9/30/2024#` |
| August '24 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #8/1/2024#  AND [Date] <= #8/31/2024#` |
| July '24 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #7/1/2024#  AND [Date] <= #7/31/2024#` |
| June '24 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #6/1/2024#  AND [Date] <= #6/30/2024#` |
| May '24 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #5/1/2024#  AND [Date] <= #5/31/2024#` |
| April '24 | `SELECT Count(*) FROM PurchaseOrder  WHERE [Date] >= #4/1/2024#  AND [Date] <= #4/30/2024#` |

## Rental Value

| Month | SQL Expression |
|-------|---------------|
| March '25 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #3/1/2025#  AND [Date] <= #3/31/2025#` |
| February '25 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #2/1/2025#  AND [Date] <= #2/28/2025#` |
| January '25 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #1/1/2025#  AND [Date] <= #1/31/2025#` |
| December '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #12/1/2024#  AND [Date] <= #12/31/2024#` |
| November '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #11/1/2024#  AND [Date] <= #11/30/2024#` |
| October '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #10/1/2024#  AND [Date] <= #10/31/2024#` |
| September '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #9/1/2024#  AND [Date] <= #9/30/2024#` |
| August '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #8/1/2024#  AND [Date] <= #8/31/2024#` |
| July '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #7/1/2024#  AND [Date] <= #7/31/2024#` |
| June '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #6/1/2024#  AND [Date] <= #6/30/2024#` |
| May '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #5/1/2024#  AND [Date] <= #5/31/2024#` |
| April '24 | `SELECT Sum([ShippingCost]) FROM PurchaseOrder  WHERE [Date] >= #4/1/2024#  AND [Date] <= #4/30/2024#` |

## Implementation Instructions

1. Open the admin spreadsheet in the dashboard.
2. For each row in the POR Overview section, update the SQL Expression field with the corresponding query from this document.
3. Make sure the Server field is set to "POR" for all rows.
4. Make sure the Table Name field is set to "PurchaseOrder" for all rows.
5. Click the "Run" button to execute the queries and update the values.

## Important Notes

- These queries use MS Access SQL syntax, which is different from SQL Server syntax.
- Date literals in MS Access are enclosed in # characters, e.g., #3/1/2025#.
- Column names in MS Access are enclosed in square brackets, e.g., [Date].
