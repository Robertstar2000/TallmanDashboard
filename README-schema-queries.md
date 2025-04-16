# SQL Server Schema Query Reference

This guide provides useful SQL queries to explore the database schema for your TallmanDashboard (P21/SQL Server).

## 1. List All Tables
```sql
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
```

## 2. List All Columns for a Table
Replace `YourTable` with the table name you want to inspect.
```sql
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'YourTable'
ORDER BY ORDINAL_POSITION;
```

## 3. List All Columns in All Tables
```sql
SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;
```

---

**How to Use:**
- Copy and paste these queries into the dashboard SQL tester (read-only mode).
- Use them to discover table and column names for building accurate metrics.

---

*This file is available from the Admin page Help button.*
