# POR Overview Production SQL Update Log

Update Date: 3/14/2025, 8:17:46 PM

Updated POR Overview rows with MS Access compatible SQL for production use.

## MS Access SQL Queries

### Open POs

```sql
SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Open'
```

### Closed POs

```sql
SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Closed'
```

### POs This Month

```sql
SELECT COUNT(*) FROM PurchaseOrder WHERE [Date] BETWEEN #3/1/2025# AND #3/14/2025#
```

### POs Last Month

```sql
SELECT COUNT(*) FROM PurchaseOrder WHERE [Date] BETWEEN #2/1/2025# AND #2/28/2025#
```

