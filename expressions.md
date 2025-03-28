# Data Point Expressions

This file documents the SQL expressions used for each data point in the Tallman Dashboard.

## Key Metrics

### Total Revenue (P21)
```sql
SELECT SUM(invoice_total) 
FROM invoice_hdr 
WHERE invoice_date >= DATEADD(month, -1, GETDATE())
```

### Total Orders (P21)
```sql
SELECT COUNT(*) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -1, GETDATE())
```

### Active Customers (P21)
```sql
SELECT COUNT(DISTINCT customer_id) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -3, GETDATE())
```

### Average Order Value (P21)
```sql
SELECT AVG(order_total) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -1, GETDATE())
```

## Web Orders

### Web Orders (P21)
```sql
SELECT COUNT(*) 
FROM order_hdr 
WHERE order_source = 'WEB' AND order_date >= DATEADD(month, -1, GETDATE())
```

## Inventory

### Inventory Value (P21)
```sql
SELECT SUM(qty_on_hand * avg_cost) 
FROM inv_mst
```

## AR Aging

### 1-30 Days (P21)
```sql
SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 1 AND 30
```

### 31-60 Days (P21)
```sql
SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 31 AND 60
```

### 61-90 Days (P21)
```sql
SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 61 AND 90
```

### Over 90 Days (P21)
```sql
SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due > 90
```

## POR Overview

### Example POR Query (POR)
```sql
SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Open'
```

**Note:** The above expressions are examples and may need to be adjusted based on the specific requirements of each data point.
