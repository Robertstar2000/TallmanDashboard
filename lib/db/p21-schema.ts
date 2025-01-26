'use client';

// P21 Schema definitions based on official P21 data dictionary
export const P21_SCHEMA = {
  orders: {
    table: 'oe_hdr',
    fields: {
      id: 'order_no',
      status: 'order_status',
      amount: 'order_amt',
      date: 'order_date',
      customer: 'customer_id',
      type: 'order_type',
      total: 'total_lines',
      user: 'user_id'
    }
  },
  accounts_payable: {
    table: 'ap_hdr',
    fields: {
      id: 'invoice_no',
      amount: 'invoice_amt',
      date: 'invoice_date',
      status: 'invoice_status',
      vendor: 'vendor_id',
      due_date: 'due_date',
      terms: 'terms_code'
    }
  },
  inventory: {
    table: 'inv_mstr',
    fields: {
      id: 'item_id',
      site: 'whse',
      value: 'std_cost',
      turnover: 'turn_rate',
      qty_onhand: 'qty_on_hand',
      qty_committed: 'qty_committed',
      qty_onorder: 'qty_on_order',
      product_line: 'prod_line',
      category: 'category_1'
    }
  },
  shipments: {
    table: 'oe_ship_hdr',
    fields: {
      id: 'ship_id',
      date: 'ship_date',
      count: 'line_count',
      order_no: 'order_no',
      carrier: 'carrier_cd',
      tracking: 'tracking_no'
    }
  }
};

// SQL query templates using P21 schema and standard joins
export const P21_QUERIES = {
  total_orders: `
    SELECT COUNT(*) as total_count
    FROM ${P21_SCHEMA.orders.table}
    WHERE ${P21_SCHEMA.orders.fields.date} >= DATEADD(month, -1, GETDATE())
  `,
  open_orders: `
    SELECT COUNT(*) as open_count
    FROM ${P21_SCHEMA.orders.table}
    WHERE ${P21_SCHEMA.orders.fields.status} = 'O'
    AND ${P21_SCHEMA.orders.fields.type} NOT IN ('Q', 'T')
  `,
  inventory_value: `
    SELECT 
      im.${P21_SCHEMA.inventory.fields.product_line},
      SUM(im.${P21_SCHEMA.inventory.fields.qty_onhand} * im.${P21_SCHEMA.inventory.fields.value}) as total_value,
      AVG(im.${P21_SCHEMA.inventory.fields.turnover}) as avg_turnover
    FROM ${P21_SCHEMA.inventory.table} im
    WHERE im.${P21_SCHEMA.inventory.fields.qty_onhand} > 0
    GROUP BY im.${P21_SCHEMA.inventory.fields.product_line}
  `,
  accounts_payable_aging: `
    SELECT 
      SUM(CASE WHEN DATEDIFF(day, ${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) <= 0 
          THEN ${P21_SCHEMA.accounts_payable.fields.amount} ELSE 0 END) as current_amount,
      SUM(CASE WHEN DATEDIFF(day, ${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) > 30 
          THEN ${P21_SCHEMA.accounts_payable.fields.amount} ELSE 0 END) as overdue_amount
    FROM ${P21_SCHEMA.accounts_payable.table}
    WHERE ${P21_SCHEMA.accounts_payable.fields.status} != 'P'
  `,
  ar_aging: `
    SELECT 
      CASE 
        WHEN DATEDIFF(day, ${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) BETWEEN 1 AND 30 
          THEN '1-30'
        WHEN DATEDIFF(day, ${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) BETWEEN 31 AND 60 
          THEN '31-60'
        WHEN DATEDIFF(day, ${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) BETWEEN 61 AND 90 
          THEN '61-90'
        WHEN DATEDIFF(day, ${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) > 90 
          THEN '90+'
        ELSE 'Current'
      END as range,
      SUM(${P21_SCHEMA.accounts_payable.fields.amount}) as amount
    FROM ${P21_SCHEMA.accounts_payable.table}
    WHERE ${P21_SCHEMA.accounts_payable.fields.status} != 'P'
    GROUP BY 
      CASE 
        WHEN DATEDIFF(day, ${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) BETWEEN 1 AND 30 
          THEN '1-30'
        WHEN DATEDIFF(day, ${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) BETWEEN 31 AND 60 
          THEN '31-60'
        WHEN DATEDIFF(day, ${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) BETWEEN 61 AND 90 
          THEN '61-90'
        WHEN DATEDIFF(day, ${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) > 90 
          THEN '90+'
        ELSE 'Current'
      END
    ORDER BY 
      CASE range
        WHEN 'Current' THEN 1
        WHEN '1-30' THEN 2
        WHEN '31-60' THEN 3
        WHEN '61-90' THEN 4
        WHEN '90+' THEN 5
      END
  `
};