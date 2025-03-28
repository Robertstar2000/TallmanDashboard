# POR Overview Queries Test Report

Test Date: 3/24/2025, 8:26:49 PM

## New Rentals

### New Rentals March '25

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #3/1/2025# 
                          AND [Date] <= #3/31/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #2/1/2025# 
                          AND [Date] <= #2/28/2025#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals February '25

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #2/1/2025# 
                          AND [Date] <= #2/28/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #1/1/2025# 
                          AND [Date] <= #1/31/2025#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals January '25

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #1/1/2025# 
                          AND [Date] <= #1/31/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #12/1/2024# 
                          AND [Date] <= #12/31/2024#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals December '24

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #12/1/2024# 
                          AND [Date] <= #12/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #11/1/2024# 
                          AND [Date] <= #11/30/2024#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals November '24

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #11/1/2024# 
                          AND [Date] <= #11/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #10/1/2024# 
                          AND [Date] <= #10/31/2024#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals October '24

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #10/1/2024# 
                          AND [Date] <= #10/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #9/1/2024# 
                          AND [Date] <= #9/30/2024#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals September '24

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #9/1/2024# 
                          AND [Date] <= #9/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #8/1/2024# 
                          AND [Date] <= #8/31/2024#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals August '24

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #8/1/2024# 
                          AND [Date] <= #8/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #7/1/2024# 
                          AND [Date] <= #7/31/2024#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals July '24

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #7/1/2024# 
                          AND [Date] <= #7/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #6/1/2024# 
                          AND [Date] <= #6/30/2024#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals June '24

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #6/1/2024# 
                          AND [Date] <= #6/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #5/1/2024# 
                          AND [Date] <= #5/31/2024#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals May '24

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #5/1/2024# 
                          AND [Date] <= #5/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #4/1/2024# 
                          AND [Date] <= #4/30/2024#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

### New Rentals April '24

**SQL:**
```sql
(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #4/1/2024# 
                          AND [Date] <= #4/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #3/1/2024# 
                          AND [Date] <= #3/31/2024#
                          AND [Status] <> 'Closed')
```

**Result:** NaN

## Open Rentals

### Open Rentals March '25

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #3/1/2025# 
                AND [Date] <= #3/31/2025#
```

**Result:** 0

### Open Rentals February '25

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #2/1/2025# 
                AND [Date] <= #2/28/2025#
```

**Result:** 0

### Open Rentals January '25

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #1/1/2025# 
                AND [Date] <= #1/31/2025#
```

**Result:** 0

### Open Rentals December '24

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #12/1/2024# 
                AND [Date] <= #12/31/2024#
```

**Result:** 0

### Open Rentals November '24

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #11/1/2024# 
                AND [Date] <= #11/30/2024#
```

**Result:** 0

### Open Rentals October '24

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #10/1/2024# 
                AND [Date] <= #10/31/2024#
```

**Result:** 0

### Open Rentals September '24

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #9/1/2024# 
                AND [Date] <= #9/30/2024#
```

**Result:** 0

### Open Rentals August '24

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #8/1/2024# 
                AND [Date] <= #8/31/2024#
```

**Result:** 0

### Open Rentals July '24

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #7/1/2024# 
                AND [Date] <= #7/31/2024#
```

**Result:** 0

### Open Rentals June '24

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #6/1/2024# 
                AND [Date] <= #6/30/2024#
```

**Result:** 0

### Open Rentals May '24

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #5/1/2024# 
                AND [Date] <= #5/31/2024#
```

**Result:** 0

### Open Rentals April '24

**SQL:**
```sql
SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #4/1/2024# 
                AND [Date] <= #4/30/2024#
```

**Result:** 0

## Rental Value

### Rental Value March '25

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #3/1/2025# 
                AND [Date] <= #3/31/2025#
```

**Result:** 0

### Rental Value February '25

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #2/1/2025# 
                AND [Date] <= #2/28/2025#
```

**Result:** 0

### Rental Value January '25

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #1/1/2025# 
                AND [Date] <= #1/31/2025#
```

**Result:** 0

### Rental Value December '24

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #12/1/2024# 
                AND [Date] <= #12/31/2024#
```

**Result:** 0

### Rental Value November '24

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #11/1/2024# 
                AND [Date] <= #11/30/2024#
```

**Result:** 0

### Rental Value October '24

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #10/1/2024# 
                AND [Date] <= #10/31/2024#
```

**Result:** 0

### Rental Value September '24

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #9/1/2024# 
                AND [Date] <= #9/30/2024#
```

**Result:** 0

### Rental Value August '24

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #8/1/2024# 
                AND [Date] <= #8/31/2024#
```

**Result:** 0

### Rental Value July '24

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #7/1/2024# 
                AND [Date] <= #7/31/2024#
```

**Result:** 0

### Rental Value June '24

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #6/1/2024# 
                AND [Date] <= #6/30/2024#
```

**Result:** 0

### Rental Value May '24

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #5/1/2024# 
                AND [Date] <= #5/31/2024#
```

**Result:** 0

### Rental Value April '24

**SQL:**
```sql
SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #4/1/2024# 
                AND [Date] <= #4/30/2024#
```

**Result:** 0

## Summary of Results

### New Rentals

| Month | Value |
|-------|-------|
| March '25 | NaN |
| February '25 | NaN |
| January '25 | NaN |
| December '24 | NaN |
| November '24 | NaN |
| October '24 | NaN |
| September '24 | NaN |
| August '24 | NaN |
| July '24 | NaN |
| June '24 | NaN |
| May '24 | NaN |
| April '24 | NaN |

### Open Rentals

| Month | Value |
|-------|-------|
| March '25 | 0 |
| February '25 | 0 |
| January '25 | 0 |
| December '24 | 0 |
| November '24 | 0 |
| October '24 | 0 |
| September '24 | 0 |
| August '24 | 0 |
| July '24 | 0 |
| June '24 | 0 |
| May '24 | 0 |
| April '24 | 0 |

### Rental Value

| Month | Value |
|-------|-------|
| March '25 | 0 |
| February '25 | 0 |
| January '25 | 0 |
| December '24 | 0 |
| November '24 | 0 |
| October '24 | 0 |
| September '24 | 0 |
| August '24 | 0 |
| July '24 | 0 |
| June '24 | 0 |
| May '24 | 0 |
| April '24 | 0 |

