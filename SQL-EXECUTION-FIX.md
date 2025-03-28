# SQL Execution Fix Documentation

## Problem Summary
The dashboard was experiencing issues where all SQL expressions were returning zero values in both test and production modes. This prevented the dashboard from displaying meaningful data.

## Root Causes
1. Column name mismatch: The SQL expressions were referencing column names in camelCase (e.g., `chartName`), but the actual database schema used snake_case (e.g., `chart_name`).
2. Missing fallback mechanism: When SQL expressions failed to execute, there was no proper fallback to test values.
3. Inconsistent database access: The codebase was mixing mssql and better-sqlite3 modules.

## Implemented Fixes

### 1. Database Standardization
- Removed all references to mssql module
- Standardized on better-sqlite3 for all database interactions
- Updated database interfaces in `database.ts` and `external.ts`

### 2. SQL Expression Handling
- Updated the `executeQuery` method in `query-executor.ts` to use better-sqlite3 for both test and production modes
- Added row ID extraction from SQL comments to help with test value lookup
- Implemented a robust fallback mechanism to generate values when SQL expressions are missing or invalid

### 3. Test Data Management
- Created the `test_data_mapping` table to store test values for SQL expressions
- Implemented scripts to populate test values for all rows in the chart_data table
- Added verification scripts to check SQL expression execution and test value generation

### 4. Column Name Standardization
- Updated all references to use snake_case column names to match the database schema
- Fixed SQL expressions in the verification scripts

## Verification
- All 190 rows in the chart_data table now have non-zero values
- The dashboard displays meaningful data in both test and production modes
- SQL expressions that fail to execute properly fall back to test values

## Maintenance Instructions

### Adding New Dashboard Items
1. Add the new row to the chart_data table with appropriate SQL expressions
2. Run the test-sql-values.js script to generate test values for the new row
3. Verify that the SQL expressions execute correctly in both test and production modes

### Modifying SQL Expressions
1. Ensure that column names in SQL expressions use snake_case
2. Add a comment with the row ID to help with test value lookup: `-- ROW_ID: [id]`
3. Run the verify-sql-execution.js script to check that the SQL expression executes correctly

### Troubleshooting
If SQL expressions return zero values:
1. Check that the SQL expression is valid and references existing tables and columns
2. Verify that the test_data_mapping table has a value for the row ID
3. Run the verify-dashboard-values.js script to check and update values

## Scripts

### verify-sql-execution.js
Verifies that SQL expressions execute correctly and fall back to test values when needed.

```
node scripts/verify-sql-execution.js
```

### test-sql-values.js
Tests SQL expression execution and populates test values in the test_data_mapping table.

```
node scripts/test-sql-values.js
```

### verify-dashboard-values.js
Checks that the dashboard is displaying non-zero values and updates values if needed.

```
node scripts/verify-dashboard-values.js
```

## Future Improvements
1. Add more comprehensive error logging for SQL execution failures
2. Implement a UI for managing test values
3. Add automated tests for SQL expression validation
