# Purchase Order Admin Spreadsheet Rows

This document contains rows for the admin spreadsheet to retrieve purchase order data from the POR database.

## Monthly PO Counts

| Variable Name | Server | Table | SQL Expression |
|---------------|--------|-------|---------------|
| March '25 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2025-03-01' AND Date <= '2025-03-31'` |
| February '25 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2025-02-01' AND Date <= '2025-02-28'` |
| January '25 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2025-01-01' AND Date <= '2025-01-31'` |
| December '24 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2024-12-01' AND Date <= '2024-12-31'` |
| November '24 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2024-11-01' AND Date <= '2024-11-30'` |
| October '24 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2024-10-01' AND Date <= '2024-10-31'` |
| September '24 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2024-09-01' AND Date <= '2024-09-30'` |
| August '24 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2024-08-01' AND Date <= '2024-08-31'` |
| July '24 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2024-07-01' AND Date <= '2024-07-31'` |
| June '24 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2024-06-01' AND Date <= '2024-06-30'` |
| May '24 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2024-05-01' AND Date <= '2024-05-31'` |
| April '24 | POR | PurchaseOrder | `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2024-04-01' AND Date <= '2024-04-30'` |

## Monthly PO Totals

| Variable Name | Server | Table | SQL Expression |
|---------------|--------|-------|---------------|
| March '25 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2025-03-01' AND Date <= '2025-03-31'` |
| February '25 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2025-02-01' AND Date <= '2025-02-28'` |
| January '25 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2025-01-01' AND Date <= '2025-01-31'` |
| December '24 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2024-12-01' AND Date <= '2024-12-31'` |
| November '24 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2024-11-01' AND Date <= '2024-11-30'` |
| October '24 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2024-10-01' AND Date <= '2024-10-31'` |
| September '24 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2024-09-01' AND Date <= '2024-09-30'` |
| August '24 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2024-08-01' AND Date <= '2024-08-31'` |
| July '24 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2024-07-01' AND Date <= '2024-07-31'` |
| June '24 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2024-06-01' AND Date <= '2024-06-30'` |
| May '24 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2024-05-01' AND Date <= '2024-05-31'` |
| April '24 | POR | PurchaseOrder | `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '2024-04-01' AND Date <= '2024-04-30'` |

## Vendor Analysis

| Variable Name | Server | Table | SQL Expression |
|---------------|--------|-------|---------------|
| Top 5 Vendors | POR | PurchaseOrder | `SELECT TOP 5 VendorNumber, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2025-01-01' GROUP BY VendorNumber ORDER BY Count DESC` |

## PO Status

| Variable Name | Server | Table | SQL Expression |
|---------------|--------|-------|---------------|
| Status Distribution | POR | PurchaseOrder | `SELECT Status, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2025-01-01' GROUP BY Status` |

## Store Analysis

| Variable Name | Server | Table | SQL Expression |
|---------------|--------|-------|---------------|
| PO by Store | POR | PurchaseOrder | `SELECT Store, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '2025-01-01' GROUP BY Store` |

