# POR Database Queries Documentation

## Overview

This document provides comprehensive information about the POR (Purchase Order) database queries used in the Tallman Dashboard. The queries have been updated to use proper MS Access syntax with dynamic date functions to ensure they always return relevant data.

## Updated Query Structure

The POR queries have been updated with the following improvements:

1. **Dynamic Date Handling**: Using `DateSerial` and `DateAdd` functions to automatically calculate date ranges based on the current date
2. **NULL Value Handling**: Using `IIf` and `IsNull` functions to properly handle NULL values
3. **Consistent Column Naming**: Using proper MS Access column name syntax with square brackets `[ColumnName]`
4. **Output Formatting**: Ensuring all queries return results with a column named `value` for consistency

## Example Queries

### New Rentals (Current Month)

```sql
SELECT (
  SELECT Count(*) FROM PurchaseOrder 
  WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) 
  AND [Date] <= DateAdd('m', 1, DateSerial(Year(Date()), Month(Date()), 1))-1
) - (
  SELECT Count(*) FROM PurchaseOrder 
  WHERE [Date] >= DateSerial(Year(Date()), Month(Date())-1, 1) 
  AND [Date] <= DateSerial(Year(Date()), Month(Date()), 1)-1 
  AND [Status] <> 'Closed'
) AS value
```

### Open Rentals (Current Month)

```sql
SELECT Count(*) AS value 
FROM PurchaseOrder 
WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) 
AND [Date] <= DateAdd('m', 1, DateSerial(Year(Date()), Month(Date()), 1))-1 
AND [Status] <> 'Closed'
```

### Rental Value (Current Month)

```sql
SELECT Sum(IIf(IsNull([ShippingCost]), 0, [ShippingCost])) AS value 
FROM PurchaseOrder 
WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) 
AND [Date] <= DateAdd('m', 1, DateSerial(Year(Date()), Month(Date()), 1))-1
```

### Top 5 Vendors

```sql
SELECT TOP 5 IIf(IsNull([VendorNumber]), 'Unknown', [VendorNumber]) AS VendorNumber, COUNT(*) AS value 
FROM PurchaseOrder 
WHERE Date >= DateSerial(Year(Date())-1, Month(Date()), 1) 
GROUP BY IIf(IsNull([VendorNumber]), 'Unknown', [VendorNumber]) 
ORDER BY value DESC
```

### Status Distribution

```sql
SELECT IIf(IsNull([Status]), 'Unknown', [Status]) AS Status, COUNT(*) AS value 
FROM PurchaseOrder 
WHERE Date >= DateSerial(Year(Date())-1, Month(Date()), 1) 
GROUP BY IIf(IsNull([Status]), 'Unknown', [Status])
```

## Date Function Explanation

The queries use MS Access date functions to dynamically calculate date ranges:

- `Date()` - Returns the current date
- `Year(Date())` - Returns the current year
- `Month(Date())` - Returns the current month (1-12)
- `DateSerial(year, month, day)` - Creates a date for the specified year, month, and day
- `DateAdd('m', 1, date)` - Adds 1 month to the specified date

For example, to get the first day of the current month:
```sql
DateSerial(Year(Date()), Month(Date()), 1)
```

To get the last day of the current month:
```sql
DateAdd('m', 1, DateSerial(Year(Date()), Month(Date()), 1))-1
```

## NULL Handling

The queries use MS Access functions to handle NULL values:

- `IsNull(expression)` - Returns True if the expression is NULL
- `IIf(condition, trueValue, falseValue)` - Returns one of two values depending on the condition

For example, to handle NULL values in the ShippingCost column:
```sql
IIf(IsNull([ShippingCost]), 0, [ShippingCost])
```

## Connecting to the POR Database

To connect to the POR database:

1. **Obtain the POR database file** (*.mdb format)
2. **Place it in the `data` directory** of the project
3. **Update the connection configuration** in the dashboard settings

You can test the connection using the provided test scripts:

```powershell
node test-por-mdb-connection.js ./data/por.mdb
```

## Testing the Queries

To test the POR queries:

1. Run the SQLite test script to verify query logic:
   ```powershell
   node test-por-queries-sqlite.js
   ```

2. Run the MDB connection test script to analyze the actual POR database:
   ```powershell
   node test-por-mdb-connection.js ./data/por.mdb
   ```

## Troubleshooting

If you encounter issues with the POR queries:

1. **Verify the database structure** - Ensure the PurchaseOrder table exists and has the expected columns
2. **Check column names** - The queries assume specific column names (Date, Status, VendorNumber, ShippingCost, Store)
3. **Test with sample data** - Use the test scripts to verify the queries with sample data
4. **Check date formats** - Ensure dates are stored in a format that MS Access can interpret

## Notes for Developers

When modifying the POR queries:

1. Always use proper MS Access syntax
2. Use dynamic date functions instead of hard-coded dates
3. Handle NULL values appropriately
4. Ensure all queries return a column named `value` for consistency
5. Test thoroughly with both sample data and the actual POR database
