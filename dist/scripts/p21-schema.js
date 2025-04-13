'use client';
// P21 Schema definitions based on official Prophet 21 data dictionary
export const P21_SCHEMA = {
    orders: {
        table: 'dbo.oe_hdr',
        fields: {
            id: 'order_no',
            status: 'completed',
            amount: 'order_amt',
            date: 'order_date',
            customer: 'customer_id',
            type: 'order_type',
            total: 'total_lines',
            user: 'last_maintained_by',
            company: 'company_id',
            location: 'location_id',
            currency: 'currency_id',
            delete_flag: 'delete_flag',
            completed: 'completed',
            backlog: 'cancel_flag',
            requested_date: 'requested_date',
            promise_date: 'promise_date'
        }
    },
    order_lines: {
        table: 'dbo.oe_line',
        fields: {
            id: 'oe_line_uid',
            order_no: 'order_no',
            line_no: 'line_no',
            item: 'item_id',
            qty: 'qty_ordered',
            price: 'unit_price',
            extended_price: 'extended_price',
            cost: 'unit_cost',
            date: 'date_created',
            status: 'delete_flag'
        }
    },
    accounts_receivable: {
        table: 'dbo.ar_open_items',
        fields: {
            id: 'document_no',
            amount: 'amount',
            date: 'document_date',
            due_date: 'due_date',
            status: 'status',
            customer: 'customer_id',
            type: 'document_type',
            balance: 'balance',
            company: 'company_id',
            terms: 'terms_code'
        }
    },
    accounts_payable: {
        table: 'dbo.ap_open_items',
        fields: {
            id: 'invoice_no',
            amount: 'invoice_amt',
            date: 'invoice_date',
            status: 'invoice_status',
            vendor: 'vendor_id',
            due_date: 'due_date',
            terms: 'terms_code',
            company: 'company_id',
            balance: 'open_balance'
        }
    },
    inventory: {
        table: 'dbo.inv_mast',
        fields: {
            id: 'item_id',
            site: 'whse',
            value: 'std_cost',
            turnover: 'turn_rate',
            qty_onhand: 'qty_on_hand',
            qty_committed: 'qty_committed',
            qty_onorder: 'qty_on_order',
            product_line: 'prod_line',
            category: 'category_1',
            company: 'company_id',
            location: 'location_id',
            unit: 'unit',
            last_cost: 'last_cost',
            avg_cost: 'avg_cost',
            delete_flag: 'delete_flag'
        }
    },
    customers: {
        table: 'dbo.customer',
        fields: {
            id: 'customer_id',
            name: 'name',
            status: 'delete_flag',
            type: 'type',
            credit_limit: 'credit_limit',
            balance: 'balance',
            terms: 'terms_code',
            price_level: 'price_level',
            company: 'company_id',
            currency: 'currency_id'
        }
    },
    invoices: {
        table: 'dbo.invoice_hdr',
        fields: {
            id: 'invoice_no',
            date: 'invoice_date',
            order_no: 'order_no',
            customer: 'customer_id',
            amount: 'invoice_amt',
            status: 'completed',
            company: 'company_id',
            location: 'location_id',
            delete_flag: 'delete_flag'
        }
    },
    shipments: {
        table: 'dbo.oe_ship_hdr',
        fields: {
            id: 'ship_id',
            date: 'ship_date',
            count: 'line_count',
            order_no: 'order_no',
            carrier: 'carrier_cd',
            tracking: 'tracking_no',
            company: 'company_id',
            location: 'location_id',
            status: 'status'
        }
    }
};
// SQL query templates using P21 schema and standard joins
export const P21_QUERIES = {
    total_orders: `
    SELECT COUNT(*) as total_count, SUM(${P21_SCHEMA.orders.fields.amount}) as total_amount
    FROM ${P21_SCHEMA.orders.table}
    WHERE ${P21_SCHEMA.orders.fields.date} >= DATEADD(month, -1, GETDATE())
    AND ${P21_SCHEMA.orders.fields.type} NOT IN ('Q', 'T')
    AND ${P21_SCHEMA.orders.fields.company} = @company_id
  `,
    open_orders: `
    SELECT COUNT(*) as open_count, SUM(${P21_SCHEMA.orders.fields.amount}) as open_amount
    FROM ${P21_SCHEMA.orders.table}
    WHERE ${P21_SCHEMA.orders.fields.status} = 'O'
    AND ${P21_SCHEMA.orders.fields.type} NOT IN ('Q', 'T')
    AND ${P21_SCHEMA.orders.fields.company} = @company_id
  `,
    inventory_value: `
    SELECT 
      im.${P21_SCHEMA.inventory.fields.product_line},
      SUM(im.${P21_SCHEMA.inventory.fields.qty_onhand} * 
        COALESCE(im.${P21_SCHEMA.inventory.fields.avg_cost}, 
                 im.${P21_SCHEMA.inventory.fields.last_cost}, 
                 im.${P21_SCHEMA.inventory.fields.value})) as total_value,
      AVG(im.${P21_SCHEMA.inventory.fields.turnover}) as avg_turnover,
      COUNT(DISTINCT im.${P21_SCHEMA.inventory.fields.id}) as item_count
    FROM ${P21_SCHEMA.inventory.table} im
    WHERE im.${P21_SCHEMA.inventory.fields.qty_onhand} > 0
    AND im.${P21_SCHEMA.inventory.fields.company} = @company_id
    GROUP BY im.${P21_SCHEMA.inventory.fields.product_line}
  `,
    accounts_payable_aging: `
    SELECT 
      SUM(CASE WHEN DATEDIFF(day, ap.${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) <= 0 
          THEN ap.${P21_SCHEMA.accounts_payable.fields.balance} ELSE 0 END) as current_amount,
      SUM(CASE WHEN DATEDIFF(day, ap.${P21_SCHEMA.accounts_payable.fields.due_date}, GETDATE()) > 30 
          THEN ap.${P21_SCHEMA.accounts_payable.fields.balance} ELSE 0 END) as overdue_amount
    FROM ${P21_SCHEMA.accounts_payable.table} ap
    WHERE ap.${P21_SCHEMA.accounts_payable.fields.status} != 'P'
    AND ap.${P21_SCHEMA.accounts_payable.fields.company} = @company_id
  `,
    ar_aging: `
    SELECT 
      CASE 
        WHEN DATEDIFF(day, ar.${P21_SCHEMA.accounts_receivable.fields.due_date}, GETDATE()) BETWEEN 1 AND 30 
          THEN '1-30'
        WHEN DATEDIFF(day, ar.${P21_SCHEMA.accounts_receivable.fields.due_date}, GETDATE()) BETWEEN 31 AND 60 
          THEN '31-60'
        WHEN DATEDIFF(day, ar.${P21_SCHEMA.accounts_receivable.fields.due_date}, GETDATE()) BETWEEN 61 AND 90 
          THEN '61-90'
        WHEN DATEDIFF(day, ar.${P21_SCHEMA.accounts_receivable.fields.due_date}, GETDATE()) > 90 
          THEN '90+'
        ELSE 'Current'
      END as range,
      SUM(ar.${P21_SCHEMA.accounts_receivable.fields.balance}) as amount,
      COUNT(DISTINCT ar.${P21_SCHEMA.accounts_receivable.fields.customer}) as customer_count
    FROM ${P21_SCHEMA.accounts_receivable.table} ar
    WHERE ar.${P21_SCHEMA.accounts_receivable.fields.status} != 'P'
    AND ar.${P21_SCHEMA.accounts_receivable.fields.company} = @company_id
    GROUP BY 
      CASE 
        WHEN DATEDIFF(day, ar.${P21_SCHEMA.accounts_receivable.fields.due_date}, GETDATE()) BETWEEN 1 AND 30 
          THEN '1-30'
        WHEN DATEDIFF(day, ar.${P21_SCHEMA.accounts_receivable.fields.due_date}, GETDATE()) BETWEEN 31 AND 60 
          THEN '31-60'
        WHEN DATEDIFF(day, ar.${P21_SCHEMA.accounts_receivable.fields.due_date}, GETDATE()) BETWEEN 61 AND 90 
          THEN '61-90'
        WHEN DATEDIFF(day, ar.${P21_SCHEMA.accounts_receivable.fields.due_date}, GETDATE()) > 90 
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
  `,
    customer_metrics: `
    SELECT 
      c.${P21_SCHEMA.customers.fields.type},
      COUNT(*) as customer_count,
      SUM(c.${P21_SCHEMA.customers.fields.balance}) as total_balance,
      AVG(c.${P21_SCHEMA.customers.fields.credit_limit}) as avg_credit_limit
    FROM ${P21_SCHEMA.customers.table} c
    WHERE c.${P21_SCHEMA.customers.fields.status} = 'A'
    AND c.${P21_SCHEMA.customers.fields.company} = @company_id
    GROUP BY c.${P21_SCHEMA.customers.fields.type}
  `
};
