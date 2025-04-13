export const initialSpreadsheetState = {
    variables: {
        'var-total-orders': {
            id: 'var-total-orders',
            name: 'total_orders',
            displayName: 'Total Orders',
            value: 0,
            category: 'Key Metrics',
            chartId: 'metric-total-orders',
            chartType: 'metric',
            chartGroup: 'Metrics',
            calculation: 'COUNT',
            sqlExpression: 'SELECT COUNT(*) FROM orders',
            p21DataDictionary: 'orders',
            prodSqlExpression: 'SELECT COUNT(*) FROM oe_hdr WHERE company_id = 1',
            prodDataDictionary: 'P21.oe_hdr'
        },
        'var-open-orders': {
            id: 'var-open-orders',
            name: 'open_orders',
            displayName: 'Open Orders',
            value: 0,
            category: 'Key Metrics',
            chartId: 'metric-open-orders',
            chartType: 'metric',
            chartGroup: 'Metrics',
            calculation: 'COUNT',
            sqlExpression: 'SELECT COUNT(*) FROM orders WHERE status = "open"',
            p21DataDictionary: 'orders',
            prodSqlExpression: 'SELECT COUNT(*) FROM oe_hdr WHERE company_id = 1 AND order_status = "O"',
            prodDataDictionary: 'P21.oe_hdr'
        },
        'var-in-process': {
            id: 'var-in-process',
            name: 'in_process',
            displayName: 'In Process',
            value: 0,
            category: 'Key Metrics',
            chartId: 'metric-in-process',
            chartType: 'metric',
            chartGroup: 'Metrics',
            calculation: 'COUNT',
            sqlExpression: 'SELECT COUNT(*) FROM orders WHERE status = "in_process"',
            p21DataDictionary: 'orders',
            prodSqlExpression: 'SELECT COUNT(*) FROM oe_hdr WHERE company_id = 1 AND order_status = "P"',
            prodDataDictionary: 'P21.oe_hdr'
        },
        'var-weekly-revenue': {
            id: 'var-weekly-revenue',
            name: 'weekly_revenue',
            displayName: 'Weekly Revenue',
            value: 0,
            category: 'Key Metrics',
            chartId: 'metric-weekly-revenue',
            chartType: 'metric',
            chartGroup: 'Metrics',
            calculation: 'SUM',
            sqlExpression: 'SELECT SUM(revenue) FROM orders WHERE date >= NOW() - INTERVAL 1 WEEK',
            p21DataDictionary: 'orders',
            prodSqlExpression: 'SELECT SUM(ext_price) FROM oe_hdr WHERE company_id = 1 AND order_date >= DATEADD(week, -1, GETDATE())',
            prodDataDictionary: 'P21.oe_hdr'
        }
    },
    charts: {
        'metric-total-orders': {
            id: 'metric-total-orders',
            name: 'Total Orders',
            type: 'metric',
            category: 'Key Metrics',
            variables: ['var-total-orders']
        },
        'metric-open-orders': {
            id: 'metric-open-orders',
            name: 'Open Orders',
            type: 'metric',
            category: 'Key Metrics',
            variables: ['var-open-orders']
        },
        'metric-in-process': {
            id: 'metric-in-process',
            name: 'In Process',
            type: 'metric',
            category: 'Key Metrics',
            variables: ['var-in-process']
        },
        'metric-weekly-revenue': {
            id: 'metric-weekly-revenue',
            name: 'Weekly Revenue',
            type: 'metric',
            category: 'Key Metrics',
            variables: ['var-weekly-revenue']
        }
    },
    categories: ['Key Metrics', 'Historical Data', 'Accounts Payable', 'Customers', 'Inventory', 'Site Distribution', 'AR Aging']
};
