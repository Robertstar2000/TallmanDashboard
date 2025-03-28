// Key Metrics
const keyMetricsQueries = [
  // Total Orders
  {
    id: '1',
    productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)",
    tableName: "oe_hdr"
  },
  // Open Orders
  {
    id: '2',
    productionSqlExpression: "SELECT SUM(oh.net_total) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE oh.status = 'O'",
    tableName: "oe_hdr"
  },
  // Open Orders 2
  {
    id: '3',
    productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE status = 'O'",
    tableName: "oe_hdr"
  },
  // Daily Revenue
  {
    id: '4',
    productionSqlExpression: "SELECT SUM(oh.net_total) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE CAST(oh.ord_date AS date) = CAST(GETDATE() AS date)",
    tableName: "oe_hdr"
  },
  // Open Invoices
  {
    id: '5',
    productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.po_hdr ph WITH (NOLOCK) WHERE ph.order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND ph.order_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0) AND ph.completed = 0",
    tableName: "po_hdr"
  },
  // Orders Backlogged
  {
    id: '6',
    productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE oh.status = 'B' AND oh.ord_date >= DATEADD(day, -30, CAST(GETDATE() AS date))",
    tableName: "oe_hdr"
  },
  // Total Sales Monthly
  {
    id: '7',
    productionSqlExpression: "SELECT SUM(oh.net_total) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE CAST(oh.ord_date AS date) >= DATEADD(month, -11, CAST(GETDATE() AS date))",
    tableName: "oe_hdr"
  }
];

// Site Distribution
const siteDistributionQueries = [
  // Columbus
  {
    id: '8',
    productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '01' AND status = 'O'",
    tableName: "oe_hdr"
  },
  // Addison
  {
    id: '9',
    productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '02' AND status = 'O'",
    tableName: "oe_hdr"
  },
  // Lake City
  {
    id: '10',
    productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '03' AND status = 'O'",
    tableName: "oe_hdr"
  }
];

// Accounts - Monthly Trend
const accountsQueries = [
  // Month 1 (Current Month)
  // Accounts Payable
  {
    id: '11',
    productionSqlExpression: "SELECT ISNULL(SUM(ap.inv_amt - ap.amt_paid), 0) AS value FROM P21.dbo.ap_inv_hdr ap WITH (NOLOCK) WHERE ap.inv_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND ap.inv_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)",
    tableName: "ap_inv_hdr"
  },
  // Accounts Overdue
  {
    id: '12',
    productionSqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM P21.dbo.ap_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 0 AND FORMAT(invoice_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')",
    tableName: "ap_open_items"
  },
  // Accounts Receivable
  {
    id: '13',
    productionSqlExpression: "SELECT ISNULL(SUM(ar.balance), 0) AS value FROM P21.dbo.ar_open_invc ar WITH (NOLOCK) WHERE ar.inv_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND ar.inv_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)",
    tableName: "ar_open_invc"
  },

  // Month 2
  // Accounts Payable
  {
    id: '14',
    productionSqlExpression: "SELECT ISNULL(SUM(ap.inv_amt - ap.amt_paid), 0) AS value FROM P21.dbo.ap_inv_hdr ap WITH (NOLOCK) WHERE ap.inv_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()) - 1, 0) AND ap.inv_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)",
    tableName: "ap_inv_hdr"
  },
  // Accounts Overdue
  {
    id: '15',
    productionSqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM P21.dbo.ap_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 0 AND FORMAT(invoice_date, 'yyyy-MM') = FORMAT(DATEADD(month, -1, GETDATE()), 'yyyy-MM')",
    tableName: "ap_open_items"
  },
  // Accounts Receivable
  {
    id: '16',
    productionSqlExpression: "SELECT ISNULL(SUM(ar.balance), 0) AS value FROM P21.dbo.ar_open_invc ar WITH (NOLOCK) WHERE ar.inv_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()) - 1, 0) AND ar.inv_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)",
    tableName: "ar_open_invc"
  }
];

// Open Orders - Monthly Trend
const openOrdersQueries = [
  // Month 1 (Current Month)
  {
    id: '47',
    productionSqlExpression: "SELECT SUM(oh.net_total) AS value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE oh.status = 'O' AND oh.ord_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND oh.ord_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)",
    tableName: "oe_hdr"
  },
  // Month 2
  {
    id: '48',
    productionSqlExpression: "SELECT SUM(oh.net_total) AS value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE oh.status = 'O' AND oh.ord_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()) - 1, 0) AND oh.ord_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)",
    tableName: "oe_hdr"
  }
];

// Daily Orders - Last 7 Days
const dailyOrdersQueries = [
  // Today
  {
    id: '83',
    productionSqlExpression: "SELECT COUNT(*) AS value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE CAST(ord_date AS date) = CAST(GETDATE() AS date)",
    tableName: "oe_hdr"
  },
  // Yesterday
  {
    id: '84',
    productionSqlExpression: "SELECT COUNT(*) AS value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE CAST(ord_date AS date) = CAST(DATEADD(day, -1, GETDATE()) AS date)",
    tableName: "oe_hdr"
  },
  // 2 days ago
  {
    id: '85',
    productionSqlExpression: "SELECT COUNT(*) AS value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE CAST(ord_date AS date) = CAST(DATEADD(day, -2, GETDATE()) AS date)",
    tableName: "oe_hdr"
  }
];

// Inventory Categories
const inventoryQueries = [
  // In Stock
  {
    id: '90',
    productionSqlExpression: "SELECT SUM(il.qty_on_hand) AS value FROM P21.dbo.inv_loc il WITH (NOLOCK)",
    tableName: "inv_loc"
  },
  // On Order
  {
    id: '91',
    productionSqlExpression: "SELECT SUM(il.qty_on_order) AS value FROM P21.dbo.inv_loc il WITH (NOLOCK)",
    tableName: "inv_loc"
  }
];

// AR Aging
const arAgingQueries = [
  // Current
  {
    id: '95',
    productionSqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM P21.dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) <= 0",
    tableName: "ar_open_items"
  },
  // 1-30 Days
  {
    id: '96',
    productionSqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM P21.dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30",
    tableName: "ar_open_items"
  },
  // 31-60 Days
  {
    id: '97',
    productionSqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM P21.dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60",
    tableName: "ar_open_items"
  },
  // 61-90 Days
  {
    id: '98',
    productionSqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM P21.dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 61 AND 90",
    tableName: "ar_open_items"
  },
  // 90+ Days
  {
    id: '99',
    productionSqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM P21.dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 90",
    tableName: "ar_open_items"
  }
];
