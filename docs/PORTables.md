# Point of Rental Database Tables

This document contains information about the tables in the Point of Rental MS Access database.

Generated on: 3/13/2025, 7:20:05 PM

## Database Information

- **File Path**: C:\Users\BobM\Desktop\POR.mdb
- **Database Type**: Microsoft Access (.mdb)
- **Access Method**: Microsoft.ACE.OLEDB.12.0 Provider

## MS Access Query Syntax Notes

Point of Rental uses MS Access, which has different SQL syntax from SQL Server:

- Table names generally don't need square brackets unless they contain spaces or special characters
- Date literals use # instead of quotes: `#01/01/2025#`
- Text values use single quotes: `'Value'`
- JET SQL dialect is used instead of T-SQL

Example query:
```sql
SELECT * FROM Contracts WHERE CreatedDateTime > #01/01/2025#
```

## Key Tables for Dashboard Integration

### Contracts Table

The Contracts table is used for purchase orders in Point of Rental. Key fields include:

| Field Name | Description |
|------------|-------------|
| PONumber | Purchase Order Number |
| CreatedDateTime | Date and time when the contract/PO was created |
| CustomerID | Reference to customer information |
| TotalAmount | Total amount of the purchase order |
| Status | Current status of the contract/PO |

### Example Queries for Dashboard

#### Count Purchase Orders by Month

To count the number of purchase orders created each month:

```sql
SELECT 
    Format(CreatedDateTime, 'yyyy-mm') AS Month, 
    Count(PONumber) AS POCount
FROM 
    Contracts
WHERE 
    CreatedDateTime BETWEEN #01/01/2025# AND #12/31/2025#
GROUP BY 
    Format(CreatedDateTime, 'yyyy-mm')
ORDER BY 
    Month
```

#### Current Month Purchase Order Count

To get the count of purchase orders for the current month:

```sql
SELECT 
    Count(PONumber) AS CurrentMonthPOCount
FROM 
    Contracts
WHERE 
    Format(CreatedDateTime, 'yyyy-mm') = Format(Date(), 'yyyy-mm')
```

## Common Tables

The following tables are commonly found in Point of Rental databases:

| Table Name | Description |
|------------|-------------|
| Contracts | Purchase orders and rental contracts |
| Customers | Customer information and accounts |
| Equipment | Equipment inventory and details |
| Invoices | Customer invoices |
| Payments | Payment records |
| Rentals | Rental transaction records |
| Reservations | Equipment reservations |
| Transactions | Financial transactions |
| Vendors | Vendor information |
| WorkOrders | Maintenance and repair orders |

## System Tables

MS Access databases also contain system tables that may be useful for querying metadata:

| Table Name | Description |
|------------|-------------|
| MSysObjects | Contains information about all objects in the database |
| MSysQueries | Contains information about saved queries |
| MSysRelationships | Contains information about relationships between tables |

## Querying for Table Structure

To get a list of all user tables in the database, use:

```sql
SELECT MSysObjects.Name AS TableName
FROM MSysObjects
WHERE (((MSysObjects.Type) In (1,4,6)) AND ((MSysObjects.Flags)=0))
ORDER BY MSysObjects.Name
```

To get the structure of the Contracts table:

```sql
SELECT TOP 1 * FROM Contracts
```

## Important Notes

1. Table names may vary between different versions of Point of Rental software
2. MS Access has a 2GB file size limitation
3. Connection strings should use the Microsoft.ACE.OLEDB.12.0 provider
4. For older databases, you might need to use the Microsoft.Jet.OLEDB.4.0 provider
