# P21 Database Tables

This document lists the most important tables found in the P21Play database, organized by category.

## Key Tables by Category

### Order-related Tables
| Schema | Table Name | Description |
|--------|------------|-------------|
| dbo | oe_hdr | Order header information |
| dbo | oe_line | Order line items |
| dbo | oe_hdr_salesrep | Order header sales representative information |
| dbo | oe_line_salesrep | Order line sales representative information |
| dbo | oe_hdr_notepad | Order header notes |
| dbo | oe_line_notepad | Order line notes |
| dbo | oe_line_schedule | Order line schedule information |
| dbo | oe_line_serial | Order line serial number information |
| dbo | oe_line_lot | Order line lot information |
| dbo | oe_hdr_status | Order header status information |
| dbo | oe_contacts_customer | Order customer contact information |

### Invoice-related Tables
| Schema | Table Name | Description |
|--------|------------|-------------|
| dbo | invoice_hdr | Invoice header information |
| dbo | invoice_line | Invoice line items |
| dbo | invoice_hdr_salesrep | Invoice header sales representative information |
| dbo | invoice_line_salesrep | Invoice line sales representative information |
| dbo | invoice_hdr_notepad | Invoice header notes |
| dbo | invoice_line_notepad | Invoice line notes |
| dbo | invoice_line_taxes | Invoice line tax information |
| dbo | invoice_batch | Invoice batch information |

### Inventory-related Tables
| Schema | Table Name | Description |
|--------|------------|-------------|
| dbo | inv_mast | Inventory master information |
| dbo | inv_loc | Inventory location information |
| dbo | inv_lot | Inventory lot information |
| dbo | inv_serial | Inventory serial information |
| dbo | inv_tran | Inventory transaction information |
| dbo | inv_bin | Inventory bin information |
| dbo | inv_xref | Inventory cross-reference information |
| dbo | inv_on_hand | Inventory on-hand quantities |
| dbo | inv_period_usage | Inventory period usage information |
| dbo | inv_sub | Inventory substitution information |

### Customer-related Tables
| Schema | Table Name | Description |
|--------|------------|-------------|
| dbo | customer | Customer information |
| dbo | customer_notepad | Customer notes |
| dbo | customer_ship_to | Customer ship-to addresses |
| dbo | customer_contact | Customer contact information |
| dbo | customer_class | Customer classification information |
| dbo | customer_order_history | Customer order history |
| dbo | customer_oe_info | Customer order entry information |

### Vendor-related Tables
| Schema | Table Name | Description |
|--------|------------|-------------|
| dbo | vendor | Vendor information |
| dbo | vendor_notepad | Vendor notes |
| dbo | vendor_contact | Vendor contact information |
| dbo | vendor_class | Vendor classification information |
| dbo | vendor_item | Vendor item information |
| dbo | vendor_address | Vendor address information |

### Product-related Tables
| Schema | Table Name | Description |
|--------|------------|-------------|
| dbo | product_group | Product group information |
| dbo | product_line | Product line information |
| dbo | product_class | Product classification information |
| dbo | product_family | Product family information |
| dbo | product_category | Product category information |

### Pricing-related Tables
| Schema | Table Name | Description |
|--------|------------|-------------|
| dbo | price_matrix | Price matrix information |
| dbo | price_method | Price method information |
| dbo | price_library | Price library information |
| dbo | price_contract | Price contract information |
| dbo | price_contract_line | Price contract line information |
| dbo | price_family | Price family information |

### Sales-related Tables
| Schema | Table Name | Description |
|--------|------------|-------------|
| dbo | salesrep | Sales representative information |
| dbo | salesrep_x_customer | Sales representative to customer relationship |
| dbo | salesrep_commission | Sales representative commission information |
| dbo | salesrep_quota | Sales representative quota information |
| dbo | sales_territory | Sales territory information |

## Common SQL Queries

### Order Count Query
```sql
SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK)
```

### Invoice Count Query
```sql
SELECT COUNT(*) FROM dbo.invoice_hdr WITH (NOLOCK)
```

### Inventory Count Query
```sql
SELECT COUNT(*) FROM dbo.inv_mast WITH (NOLOCK)
```

### Customer Count Query
```sql
SELECT COUNT(*) FROM dbo.customer WITH (NOLOCK)
```

### Order Value Query
```sql
SELECT SUM(extended_amt) FROM dbo.oe_line WITH (NOLOCK)
```

### Invoice Value Query
```sql
SELECT SUM(extended_amt) FROM dbo.invoice_line WITH (NOLOCK)
```

## Best Practices for P21 Queries

1. Always use schema qualification (e.g., `dbo.table_name`)
2. Use the NOLOCK hint for read operations to avoid blocking (e.g., `FROM dbo.table_name WITH (NOLOCK)`)
3. Include appropriate WHERE clauses to limit result sets
4. Use appropriate JOINs to relate tables (e.g., `oe_hdr` to `oe_line`)
5. Consider performance implications for large tables
