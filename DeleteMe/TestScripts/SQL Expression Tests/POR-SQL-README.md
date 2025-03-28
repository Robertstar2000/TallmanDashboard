# POR SQL Expressions

This file contains information about the SQL expressions used for the POR database.

## Primary SQL Expressions

These expressions use the `Rentals` table and `RentalDate` column:

```sql
SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 1 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())
```

## Alternative SQL Expressions

If the primary expressions don't work, try these expressions that use the `Contracts` table and `ContractDate` column:

```sql
SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 1 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())
```

## Fallback SQL Expressions

If none of the above expressions work, try these expressions that should work with any MS Access database:

```sql
SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1
```

## Notes

1. MS Access uses `DatePart('m', date)` instead of `Month(date)`
2. MS Access uses `DatePart('yyyy', date)` instead of `Year(date)`
3. MS Access uses `Now()` instead of `Date()`
4. Common tables in POR databases might include: Rentals, Contracts, Transactions, Orders, Invoices
5. Common date columns might include: RentalDate, ContractDate, Date, TransactionDate, InvoiceDate, OrderDate

## Restoring the Backup

If the SQL expressions don't work, you can restore the backup from: C:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\db\complete-chart-data.backup.ts
