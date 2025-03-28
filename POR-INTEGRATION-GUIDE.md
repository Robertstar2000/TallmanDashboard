# POR Overview Integration Guide

This guide explains how to integrate the POR Overview queries into the admin spreadsheet for the Tallman Dashboard.

## Overview

The POR Overview chart requires data from the Point of Rental (POR) MS Access database. We've created and tested SQL queries that retrieve the necessary data for:

1. New Rentals (monthly)
2. Open Rentals (monthly)
3. Rental Value (monthly)

These queries have been tested and verified to work with the MS Access database through the `PORDirectReader` implementation.

## Integration Process

### Option 1: Automatic Integration (Recommended)

The easiest way to integrate the POR Overview queries is to use the provided integration script:

```bash
npx ts-node scripts/integrate-por-overview-to-admin.ts
```

This script will:
1. Read the tested queries from `por-overview-rows-with-values.json`
2. Create a backup of the current admin rows
3. Update existing POR Overview rows or add new ones
4. Save the changes to the admin database
5. Create a log file with the integration details

**Prerequisites:**
- Run `scripts/test-por-overview-queries.ts` first to generate the `por-overview-rows-with-values.json` file

### Option 2: Manual Integration

If you prefer to manually integrate the queries:

1. Run the update script to generate implementation instructions:
   ```bash
   npx ts-node scripts/update-admin-spreadsheet-por-overview.ts
   ```

2. Open the generated `por-overview-admin-implementation.md` file, which contains:
   - SQL queries for each month and data type
   - Implementation instructions
   - Important notes about MS Access SQL syntax

3. Open the admin spreadsheet in the dashboard
4. For each row in the POR Overview section:
   - Update the SQL Expression field with the corresponding query
   - Ensure the Server field is set to "POR"
   - Ensure the Table Name field is set to "PurchaseOrder"
5. Click the "Run" button to execute the queries and update the values

## Technical Details

### PORDirectReader Implementation

The `PORDirectReader` class in `lib/db/por-direct-reader.ts` provides direct access to the POR MS Access database using the `mdb-reader` package. Key features:

- Connects to the MS Access database without requiring ODBC or the Microsoft Access Database Engine
- Identifies tables containing purchase order data
- Executes SQL queries against the database
- Provides methods for retrieving purchase order counts and comparisons

### SQL Query Format

The SQL queries use MS Access SQL syntax, which differs from SQL Server syntax:

- Date literals are enclosed in # characters: `#3/1/2025#`
- Column names are enclosed in square brackets: `[Date]`
- String literals use single quotes: `'Closed'`

Example query for new rentals:
```sql
(SELECT Count(*) FROM PurchaseOrder 
 WHERE [Date] >= #3/1/2025# 
 AND [Date] <= #3/31/2025#) - 
(SELECT Count(*) FROM PurchaseOrder 
 WHERE [Date] >= #2/1/2025# 
 AND [Date] <= #2/28/2025#
 AND [Status] <> 'Closed')
```

## Troubleshooting

If you encounter issues with the integration:

1. **Database Connection Issues**:
   - Verify the POR database path is correctly configured in the server settings
   - Ensure the application has read access to the database file

2. **SQL Execution Errors**:
   - Check the SQL syntax for MS Access compatibility
   - Verify the table and column names match those in the POR database

3. **No Data Returned**:
   - Run the test script to verify the queries return data
   - Check if the date ranges in the queries match the data in the database

## Additional Resources

- `scripts/test-por-overview-queries.ts`: Test script for the POR Overview queries
- `scripts/test-por-direct-access.ts`: Test script for direct access to the POR database
- `por-overview-test-report.md`: Report of the test results
- `por-overview-queries.sql`: SQL script with all the queries

## Next Steps

After integration, verify that:
1. The admin spreadsheet shows the correct values for each POR Overview row
2. The dashboard displays the data correctly
3. The queries execute efficiently in production mode
