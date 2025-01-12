'use client';

// P21 Schema definitions based on data dictionary
export const P21_SCHEMA = {
  orders: {
    table: 'oe_hdr',
    fields: {
      id: 'order_no',
      status: 'order_status',
      amount: 'order_amt',
      date: 'order_date'
    }
  },
  accounts_payable: {
    table: 'ap_hdr',
    fields: {
      id: 'invoice_no',
      amount: 'invoice_amt',
      date: 'invoice_date',
      status: 'invoice_status'
    }
  },
  inventory: {
    table: 'inv_mstr',
    fields: {
      id: 'item_id',
      site: 'whse',
      value: 'std_cost',
      turnover: 'turn_rate'
    }
  },
  shipments: {
    table: 'oe_ship_hdr',
    fields: {
      id: 'ship_id',
      date: 'ship_date',
      count: 'line_count'
    }
  }
};

// SQL query templates using P21 schema
export const P21_QUERIES = {
  total_orders: `
    SELECT COUNT(*) 
    FROM ${P21_SCHEMA.orders.table}
  `,
  open_orders: `
    SELECT COUNT(*) 
    FROM ${P21_SCHEMA.orders.table} 
    WHERE ${P21_SCHEMA.orders.fields.status} = 'O'
  `,
  // Add other query templates...
};