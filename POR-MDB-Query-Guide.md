# POR MDB Query Guide

This document outlines the supported SQL commands for querying the Point of Rental (POR) MS Access database through the Tallman Dashboard.

## Supported Query Types

The POR database connection uses the `mdb-reader` package which has limited SQL support compared to a full SQL database. Only the following query types are supported:

### 1. SHOW TABLES

Lists all tables in the POR database.

```sql
SHOW TABLES
```

### 2. DESCRIBE

Shows the structure of a specific table.

```sql
DESCRIBE TableName
```

Example:
```sql
DESCRIBE PurchaseOrder
```

### 3. SELECT

Retrieves data from a table. Only basic SELECT queries are supported.

```sql
SELECT * FROM TableName
```

Examples:
```sql
SELECT * FROM PurchaseOrder
SELECT * FROM CustomerFile_Tr_Bak
```

**Important Limitations:**
- No WHERE clauses are supported in SELECT queries
- No JOIN operations are supported
- No ORDER BY clauses are supported
- No LIMIT or TOP clauses are supported
- No column selection is supported (must use SELECT *)

### 4. MSysObjects Queries (Special Case)

These are special queries that are handled by the PORDirectReader class to simulate MSysObjects functionality. They are not standard SQL queries but are supported by our implementation.

```sql
-- Find tables matching a pattern
SELECT * FROM MSysObjects WHERE Name LIKE '%Pattern%' AND Type=1 AND Flags=0

-- Check if a specific table exists
SELECT COUNT(*) AS table_count FROM MSysObjects WHERE Name='TableName' AND Type=1
```

Examples:
```sql
-- Find all tables containing 'Customer' in the name
SELECT * FROM MSysObjects WHERE Name LIKE '%Customer%' AND Type=1 AND Flags=0

-- Find all tables containing 'Transaction' in the name
SELECT * FROM MSysObjects WHERE Name LIKE '%Transaction%' AND Type=1 AND Flags=0
```

## Common POR Tables

Based on our exploration, these are some of the key tables in the POR database:

1. `PurchaseOrder` - Purchase order header information
2. `PurchaseOrderDetail` - Purchase order line items
3. `CustomerFile_Tr_Bak` - Customer information
4. `Transactions` - Transaction records
5. `TransactionItems` - Items included in transactions
6. `ItemFile` - Inventory items
7. `ItemPurchaseDetail` - Details about purchased items
8. `ItemPurchaseDetailFinancing` - Financing information for purchased items
9. `PurchaseOrderColumns` - Column definitions for purchase orders

## Error Handling

If you attempt to use an unsupported SQL command, you will receive an error message like:

```
Only SELECT, SHOW TABLES, and DESCRIBE queries are supported
```

## Best Practices

1. Always check if a table exists before querying it
2. Use DESCRIBE to understand the table structure before querying
3. For complex data needs, consider extracting the raw data and processing it in JavaScript
4. Table names are case-sensitive, but the PORDirectReader will attempt to match table names case-insensitively

## Technical Implementation

The POR database connection is implemented in the `PORDirectReader` class, which uses the `mdb-reader` package to read MS Access database files directly without requiring ODBC or the Microsoft Access Database Engine.

The implementation simulates some SQL functionality that isn't natively supported by the `mdb-reader` package, such as MSysObjects queries for table existence checks and pattern matching.
