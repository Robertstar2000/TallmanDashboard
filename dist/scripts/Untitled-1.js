/**
 * SINGLE SOURCE OF TRUTH for dashboard data
 *
 * This file contains all SQL expressions, chart configurations, and server settings
 * for the Tallman Dashboard. This is the authoritative source that the database
 * will be initialized from.
 *
 * When changes are made to the database through the admin interface, the "Save DB"
 * button will update this file directly.
 *
 * When the "Load DB" button is clicked, the database will be populated from this file.
 *
 * Last updated: 2025-04-01T14:00:35.583Z
 */
// Chart data for the dashboard
const singleSourceData = [
    {
        "id": "test_connection",
        "DataPoint": "Test Connection",
        "chartGroup": "Test",
        "chartName": "Test",
        "variableName": "Test",
        "serverName": "P21",
        "tableName": "dbo.test_table",
        "calculation": "number",
        "sqlExpression": "SELECT 1 as value",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "1",
        "DataPoint": "Value, total_orders",
        "chartGroup": "Key Metrics",
        "chartName": "Value",
        "variableName": "total_orders",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "10",
        "DataPoint": "Payable, Jan",
        "chartGroup": "Accounts",
        "chartName": "Jan",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "20",
        "DataPoint": "Receivable, Jan",
        "chartGroup": "Accounts",
        "chartName": "Jan",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 1 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "40",
        "DataPoint": "Overdue, Jan",
        "chartGroup": "Accounts",
        "chartName": "Jan",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 1 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "41",
        "DataPoint": "Payable, Feb",
        "chartGroup": "Accounts",
        "chartName": "Feb",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "42",
        "DataPoint": "Receivable, Feb",
        "chartGroup": "Accounts",
        "chartName": "Feb",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 2 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "42B",
        "DataPoint": "Overdue, Feb",
        "chartGroup": "Accounts",
        "chartName": "Feb",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 2 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "73",
        "DataPoint": "Payable, Mar",
        "chartGroup": "Accounts",
        "chartName": "Mar",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "74",
        "DataPoint": "Receivable, Mar",
        "chartGroup": "Accounts",
        "chartName": "Mar",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 3 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "74B",
        "DataPoint": "Overdue, Mar",
        "chartGroup": "Accounts",
        "chartName": "Mar",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 3 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "75",
        "DataPoint": "Payable, Apr",
        "chartGroup": "Accounts",
        "chartName": "Apr",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "76",
        "DataPoint": "Receivable, Apr",
        "chartGroup": "Accounts",
        "chartName": "Apr",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 4 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "76B",
        "DataPoint": "Overdue, Apr",
        "chartGroup": "Accounts",
        "chartName": "Apr",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 4 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "77",
        "DataPoint": "Payable, May",
        "chartGroup": "Accounts",
        "chartName": "May",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "78",
        "DataPoint": "Receivable, May",
        "chartGroup": "Accounts",
        "chartName": "May",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 5 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "78B",
        "DataPoint": "Overdue, May",
        "chartGroup": "Accounts",
        "chartName": "May",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 5 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "79",
        "DataPoint": "Payable, Jun",
        "chartGroup": "Accounts",
        "chartName": "Jun",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "80",
        "DataPoint": "Receivable, Jun",
        "chartGroup": "Accounts",
        "chartName": "Jun",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 6 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "80B",
        "DataPoint": "Overdue, Jun",
        "chartGroup": "Accounts",
        "chartName": "Jun",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 6 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "81",
        "DataPoint": "Payable, Jul",
        "chartGroup": "Accounts",
        "chartName": "Jul",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "82",
        "DataPoint": "Receivable, Jul",
        "chartGroup": "Accounts",
        "chartName": "Jul",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 7 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "82B",
        "DataPoint": "Overdue, Jul",
        "chartGroup": "Accounts",
        "chartName": "Jul",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 7 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "83",
        "DataPoint": "Payable, Aug",
        "chartGroup": "Accounts",
        "chartName": "Aug",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "84",
        "DataPoint": "Receivable, Aug",
        "chartGroup": "Accounts",
        "chartName": "Aug",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 8 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "84B",
        "DataPoint": "Overdue, Aug",
        "chartGroup": "Accounts",
        "chartName": "Aug",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 8 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "85",
        "DataPoint": "Payable, Sep",
        "chartGroup": "Accounts",
        "chartName": "Sep",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "86",
        "DataPoint": "Receivable, Sep",
        "chartGroup": "Accounts",
        "chartName": "Sep",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 9 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "86B",
        "DataPoint": "Overdue, Sep",
        "chartGroup": "Accounts",
        "chartName": "Sep",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 9 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "87",
        "DataPoint": "Payable, Oct",
        "chartGroup": "Accounts",
        "chartName": "Oct",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "88",
        "DataPoint": "Receivable, Oct",
        "chartGroup": "Accounts",
        "chartName": "Oct",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 10 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "88B",
        "DataPoint": "Overdue, Oct",
        "chartGroup": "Accounts",
        "chartName": "Oct",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 10 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "89",
        "DataPoint": "Payable, Nov",
        "chartGroup": "Accounts",
        "chartName": "Nov",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "90",
        "DataPoint": "Receivable, Nov",
        "chartGroup": "Accounts",
        "chartName": "Nov",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 11 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "90B",
        "DataPoint": "Overdue, Nov",
        "chartGroup": "Accounts",
        "chartName": "Nov",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 11 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "91",
        "DataPoint": "Payable, Dec",
        "chartGroup": "Accounts",
        "chartName": "Dec",
        "variableName": "Payable",
        "serverName": "P21",
        "tableName": "dbo.placeholder_ap",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No AP table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "92",
        "DataPoint": "Receivable, Dec",
        "chartGroup": "Accounts",
        "chartName": "Dec",
        "variableName": "Receivable",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND MONTH(InvoiceDate) = 12 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "92B",
        "DataPoint": "Overdue, Dec",
        "chartGroup": "Accounts",
        "chartName": "Dec",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE Status = 'Open' AND DueDate < GETDATE() AND MONTH(InvoiceDate) = 12 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "17",
        "DataPoint": "New Customers, Jan",
        "chartGroup": "Customer Metrics",
        "chartName": "Jan",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 1 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 1, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 1, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "17B",
        "DataPoint": "Prospects, Jan",
        "chartGroup": "Customer Metrics",
        "chartName": "Jan",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "18",
        "DataPoint": "New Customers, Feb",
        "chartGroup": "Customer Metrics",
        "chartName": "Feb",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 2 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 2, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 2, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "18B",
        "DataPoint": "Prospects, Feb",
        "chartGroup": "Customer Metrics",
        "chartName": "Feb",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "19",
        "DataPoint": "New Customers, Mar",
        "chartGroup": "Customer Metrics",
        "chartName": "Mar",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 3 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 3, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 3, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "19B",
        "DataPoint": "Prospects, Mar",
        "chartGroup": "Customer Metrics",
        "chartName": "Mar",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "20",
        "DataPoint": "New Customers, Apr",
        "chartGroup": "Customer Metrics",
        "chartName": "Apr",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 4 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 4, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 4, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "20B",
        "DataPoint": "Prospects, Apr",
        "chartGroup": "Customer Metrics",
        "chartName": "Apr",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "21",
        "DataPoint": "New Customers, May",
        "chartGroup": "Customer Metrics",
        "chartName": "May",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 5 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 5, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 5, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "21B",
        "DataPoint": "Prospects, May",
        "chartGroup": "Customer Metrics",
        "chartName": "May",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "22",
        "DataPoint": "New Customers, Jun",
        "chartGroup": "Customer Metrics",
        "chartName": "Jun",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 6 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 6, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 6, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "22B",
        "DataPoint": "Prospects, Jun",
        "chartGroup": "Customer Metrics",
        "chartName": "Jun",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "23",
        "DataPoint": "New Customers, Jul",
        "chartGroup": "Customer Metrics",
        "chartName": "Jul",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 7 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 7, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 7, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "23B",
        "DataPoint": "Prospects, Jul",
        "chartGroup": "Customer Metrics",
        "chartName": "Jul",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "24",
        "DataPoint": "New Customers, Aug",
        "chartGroup": "Customer Metrics",
        "chartName": "Aug",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 8 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 8, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 8, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "24B",
        "DataPoint": "Prospects, Aug",
        "chartGroup": "Customer Metrics",
        "chartName": "Aug",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "25",
        "DataPoint": "New Customers, Sep",
        "chartGroup": "Customer Metrics",
        "chartName": "Sep",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 9 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 9, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 9, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "25B",
        "DataPoint": "Prospects, Sep",
        "chartGroup": "Customer Metrics",
        "chartName": "Sep",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "26",
        "DataPoint": "New Customers, Oct",
        "chartGroup": "Customer Metrics",
        "chartName": "Oct",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 10 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 10, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 10, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "26B",
        "DataPoint": "Prospects, Oct",
        "chartGroup": "Customer Metrics",
        "chartName": "Oct",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "27",
        "DataPoint": "New Customers, Nov",
        "chartGroup": "Customer Metrics",
        "chartName": "Nov",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 11 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 11, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 11, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "27B",
        "DataPoint": "Prospects, Nov",
        "chartGroup": "Customer Metrics",
        "chartName": "Nov",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "28",
        "DataPoint": "New Customers, Dec",
        "chartGroup": "Customer Metrics",
        "chartName": "Dec",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(DISTINCT CustomerID) as value FROM dbo.SalesOrderHeader h1 WITH (NOLOCK) WHERE MONTH(OrderDate) = 12 AND YEAR(OrderDate) = YEAR(GETDATE()) AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrderHeader h2 WITH (NOLOCK) WHERE h2.CustomerID = h1.CustomerID AND h2.OrderDate >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), 12, 1)) AND h2.OrderDate < DATEFROMPARTS(YEAR(GETDATE()), 12, 1))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "28B",
        "DataPoint": "Prospects, Dec",
        "chartGroup": "Customer Metrics",
        "chartName": "Dec",
        "variableName": "Prospects",
        "serverName": "P21",
        "tableName": "dbo.placeholder_crm",
        "calculation": "number",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No CRM prospects table in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "27",
        "DataPoint": "Amount Due, Current (0-30 days)",
        "chartGroup": "AR Aging",
        "chartName": "Amount Due",
        "variableName": "Current (0-30 days)",
        "serverName": "P21",
        "tableName": "dbo.ar_open_items",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(day, -30, GETDATE()) AND paid = 'N'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "28",
        "DataPoint": "Amount Due, Current (0-30 days)",
        "chartGroup": "AR Aging",
        "chartName": "Amount Due",
        "variableName": "Current (0-30 days)",
        "serverName": "P21",
        "tableName": "dbo.ar_open_items",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE paid = 'N'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "29",
        "DataPoint": "Amount Due, Current (0-30 days)",
        "chartGroup": "AR Aging",
        "chartName": "Amount Due",
        "variableName": "Current (0-30 days)",
        "serverName": "P21",
        "tableName": "dbo.ar_open_items",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE paid = 'N'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "30",
        "DataPoint": "Amount Due, Current (0-30 days)",
        "chartGroup": "AR Aging",
        "chartName": "Amount Due",
        "variableName": "Current (0-30 days)",
        "serverName": "P21",
        "tableName": "dbo.ar_open_items",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE paid = 'N'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "31",
        "DataPoint": "Amount Due, Current (0-30 days)",
        "chartGroup": "AR Aging",
        "chartName": "Amount Due",
        "variableName": "Current (0-30 days)",
        "serverName": "P21",
        "tableName": "dbo.ar_open_items",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE paid = 'N'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "32",
        "DataPoint": "Orders, Today",
        "chartGroup": "Daily Orders",
        "chartName": "Orders",
        "variableName": "Today",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 0",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "33",
        "DataPoint": "Orders, Today",
        "chartGroup": "Daily Orders",
        "chartName": "Orders",
        "variableName": "Today",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 1",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "34",
        "DataPoint": "Orders, Today",
        "chartGroup": "Daily Orders",
        "chartName": "Orders",
        "variableName": "Today",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 1",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "35",
        "DataPoint": "Orders, Today",
        "chartGroup": "Daily Orders",
        "chartName": "Orders",
        "variableName": "Today",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 1",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "36",
        "DataPoint": "Orders, Today",
        "chartGroup": "Daily Orders",
        "chartName": "Orders",
        "variableName": "Today",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 1",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "39",
        "DataPoint": "Overdue, Oct",
        "chartGroup": "Accounts",
        "chartName": "Oct",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.ar_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 10 AND YEAR(due_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "40",
        "DataPoint": "Overdue, Nov",
        "chartGroup": "Accounts",
        "chartName": "Nov",
        "variableName": "Overdue",
        "serverName": "P21",
        "tableName": "dbo.ar_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 11 AND YEAR(due_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "42",
        "DataPoint": "New Customers, Jan",
        "chartGroup": "Customer Metrics",
        "chartName": "Jan",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.customer",
        "calculation": "number",
        "sqlExpression": "\n      SELECT COUNT(DISTINCT c.customer_id) AS value \n      FROM dbo.customer c WITH (NOLOCK)\n      WHERE c.date_created >= '2025-01-01' \n      AND c.date_created <= '2025-01-31'\n      AND NOT EXISTS (\n        SELECT 1 \n        FROM dbo.oe_hdr o WITH (NOLOCK) \n        WHERE o.customer_id = c.customer_id \n        AND o.order_date < '2025-01-01' \n        AND o.order_date >= '2024-02-01'\n      )\n    ",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "43",
        "DataPoint": "New Customers, Feb",
        "chartGroup": "Customer Metrics",
        "chartName": "Feb",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.customer",
        "calculation": "number",
        "sqlExpression": "\n      SELECT COUNT(DISTINCT c.customer_id) AS value \n      FROM dbo.customer c WITH (NOLOCK)\n      WHERE c.date_created >= '2025-02-01' \n      AND c.date_created <= '2025-02-28'\n      AND NOT EXISTS (\n        SELECT 1 \n        FROM dbo.oe_hdr o WITH (NOLOCK) \n        WHERE o.customer_id = c.customer_id \n        AND o.order_date < '2025-02-01' \n        AND o.order_date >= '2024-03-01'\n      )\n    ",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "44",
        "DataPoint": "New Customers, Mar",
        "chartGroup": "Customer Metrics",
        "chartName": "Mar",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.customer",
        "calculation": "number",
        "sqlExpression": "\n      SELECT COUNT(DISTINCT c.customer_id) AS value \n      FROM dbo.customer c WITH (NOLOCK)\n      WHERE c.date_created >= '2025-03-01' \n      AND c.date_created <= '2025-03-31'\n      AND NOT EXISTS (\n        SELECT 1 \n        FROM dbo.oe_hdr o WITH (NOLOCK) \n        WHERE o.customer_id = c.customer_id \n        AND o.order_date < '2025-03-01' \n        AND o.order_date >= '2024-04-01'\n      )\n    ",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "45",
        "DataPoint": "New Customers, Apr",
        "chartGroup": "Customer Metrics",
        "chartName": "Apr",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.customer",
        "calculation": "number",
        "sqlExpression": "\n      SELECT COUNT(DISTINCT c.customer_id) AS value \n      FROM dbo.customer c WITH (NOLOCK)\n      WHERE c.date_created >= '2025-04-01' \n      AND c.date_created <= '2025-04-30'\n      AND NOT EXISTS (\n        SELECT 1 \n        FROM dbo.oe_hdr o WITH (NOLOCK) \n        WHERE o.customer_id = c.customer_id \n        AND o.order_date < '2025-04-01' \n        AND o.order_date >= '2024-05-01'\n      )\n    ",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "46",
        "DataPoint": "New Customers, May",
        "chartGroup": "Customer Metrics",
        "chartName": "May",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.customer",
        "calculation": "number",
        "sqlExpression": "\n      SELECT COUNT(DISTINCT c.customer_id) AS value \n      FROM dbo.customer c WITH (NOLOCK)\n      WHERE c.date_created >= '2025-05-01' \n      AND c.date_created <= '2025-05-31'\n      AND NOT EXISTS (\n        SELECT 1 \n        FROM dbo.oe_hdr o WITH (NOLOCK) \n        WHERE o.customer_id = c.customer_id \n        AND o.order_date < '2025-05-01' \n        AND o.order_date >= '2024-06-01'\n      )\n    ",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "47",
        "DataPoint": "New Customers, Jun",
        "chartGroup": "Customer Metrics",
        "chartName": "Jun",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.customer",
        "calculation": "number",
        "sqlExpression": "\n      SELECT COUNT(DISTINCT c.customer_id) AS value \n      FROM dbo.customer c WITH (NOLOCK)\n      WHERE c.date_created >= '2025-06-01' \n      AND c.date_created <= '2025-06-30'\n      AND NOT EXISTS (\n        SELECT 1 \n        FROM dbo.oe_hdr o WITH (NOLOCK) \n        WHERE o.customer_id = c.customer_id \n        AND o.order_date < '2025-06-01' \n        AND o.order_date >= '2024-07-01'\n      )\n    ",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "48",
        "DataPoint": "New Customers, Jul",
        "chartGroup": "Customer Metrics",
        "chartName": "Jul",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.customer",
        "calculation": "number",
        "sqlExpression": "\n      SELECT COUNT(DISTINCT c.customer_id) AS value \n      FROM dbo.customer c WITH (NOLOCK)\n      WHERE c.date_created >= '2025-07-01' \n      AND c.date_created <= '2025-07-31'\n      AND NOT EXISTS (\n        SELECT 1 \n        FROM dbo.oe_hdr o WITH (NOLOCK) \n        WHERE o.customer_id = c.customer_id \n        AND o.order_date < '2025-07-01' \n        AND o.order_date >= '2024-08-01'\n      )\n    ",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "49",
        "DataPoint": "New Customers, Aug",
        "chartGroup": "Customer Metrics",
        "chartName": "Aug",
        "variableName": "New Customers",
        "serverName": "P21",
        "tableName": "dbo.customer",
        "calculation": "number",
        "sqlExpression": "\n      SELECT COUNT(DISTINCT c.customer_id) AS value \n      FROM dbo.customer c WITH (NOLOCK)\n      WHERE c.date_created >= '2025-08-01' \n      AND c.date_created <= '2025-08-31'\n      AND NOT EXISTS (\n        SELECT 1 \n        FROM dbo.oe_hdr o WITH (NOLOCK) \n        WHERE o.customer_id = c.customer_id \n        AND o.order_date < '2025-08-01' \n        AND o.order_date >= '2024-09-01'\n      )\n    ",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "66",
        "DataPoint": "Inventory Value",
        "chartGroup": "Inventory",
        "chartName": "Total Value",
        "variableName": "Inventory Value",
        "serverName": "P21",
        "tableName": "dbo.[Item Master], dbo.InventoryLocations",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(im.StandardCost * (il.QuantityOnHand - il.QuantityAllocated)), 0) as value FROM dbo.[Item Master] im WITH (NOLOCK) JOIN dbo.InventoryLocations il WITH (NOLOCK) ON im.ItemID = il.ItemID",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "67",
        "DataPoint": "Inventory Units",
        "chartGroup": "Inventory",
        "chartName": "Total Units",
        "variableName": "Inventory Units",
        "serverName": "P21",
        "tableName": "dbo.InventoryLocations",
        "calculation": "number",
        "sqlExpression": "SELECT ISNULL(SUM(QuantityOnHand - QuantityAllocated), 0) as value FROM dbo.InventoryLocations WITH (NOLOCK)",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "73",
        "DataPoint": "P21, Jan",
        "chartGroup": "Historical Data",
        "chartName": "Jan",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 1 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "74",
        "DataPoint": "P21, Feb",
        "chartGroup": "Historical Data",
        "chartName": "Feb",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 2 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "75",
        "DataPoint": "P21, Mar",
        "chartGroup": "Historical Data",
        "chartName": "Mar",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 3 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "76",
        "DataPoint": "P21, Apr",
        "chartGroup": "Historical Data",
        "chartName": "Apr",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 4 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "77",
        "DataPoint": "P21, May",
        "chartGroup": "Historical Data",
        "chartName": "May",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 5 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "78",
        "DataPoint": "P21, Jun",
        "chartGroup": "Historical Data",
        "chartName": "Jun",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 6 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "79",
        "DataPoint": "P21, Jul",
        "chartGroup": "Historical Data",
        "chartName": "Jul",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 7 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "80",
        "DataPoint": "P21, Aug",
        "chartGroup": "Historical Data",
        "chartName": "Aug",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 8 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "81",
        "DataPoint": "P21, Sep",
        "chartGroup": "Historical Data",
        "chartName": "Sep",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 9 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "82",
        "DataPoint": "P21, Oct",
        "chartGroup": "Historical Data",
        "chartName": "Oct",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 10 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "83",
        "DataPoint": "P21, Nov",
        "chartGroup": "Historical Data",
        "chartName": "Nov",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 11 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "84",
        "DataPoint": "P21, Dec",
        "chartGroup": "Historical Data",
        "chartName": "Dec",
        "variableName": "P21",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 12 AND YEAR(order_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "85",
        "DataPoint": "POR, Jan",
        "chartGroup": "Historical Data",
        "chartName": "Jan",
        "variableName": "POR",
        "serverName": "POR",
        "tableName": "PurchaseOrderDetail",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 1 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "86",
        "DataPoint": "POR, Feb",
        "chartGroup": "Historical Data",
        "chartName": "Feb",
        "variableName": "POR",
        "serverName": "POR",
        "tableName": "PurchaseOrderDetail",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 2 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "87",
        "DataPoint": "POR, Mar",
        "chartGroup": "Historical Data",
        "chartName": "Mar",
        "variableName": "POR",
        "serverName": "POR",
        "tableName": "PurchaseOrderDetail",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 3 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "100",
        "DataPoint": "Total, Apr",
        "chartGroup": "Historical Data",
        "chartName": "Apr",
        "variableName": "Total",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 4 AND YEAR(order_date) = YEAR(GETDATE())) AS value",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "101",
        "DataPoint": "Total, May",
        "chartGroup": "Historical Data",
        "chartName": "May",
        "variableName": "Total",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 5 AND YEAR(order_date) = YEAR(GETDATE())) AS value",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "102",
        "DataPoint": "Total, Jun",
        "chartGroup": "Historical Data",
        "chartName": "Jun",
        "variableName": "Total",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 6 AND YEAR(order_date) = YEAR(GETDATE())) AS value",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "103",
        "DataPoint": "Total, Jul",
        "chartGroup": "Historical Data",
        "chartName": "Jul",
        "variableName": "Total",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 7 AND YEAR(order_date) = YEAR(GETDATE())) AS value",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "104",
        "DataPoint": "Total, Aug",
        "chartGroup": "Historical Data",
        "chartName": "Aug",
        "variableName": "Total",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 8 AND YEAR(order_date) = YEAR(GETDATE())) AS value",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "105",
        "DataPoint": "Total, Sep",
        "chartGroup": "Historical Data",
        "chartName": "Sep",
        "variableName": "Total",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 9 AND YEAR(order_date) = YEAR(GETDATE())) AS value",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "106",
        "DataPoint": "Total, Oct",
        "chartGroup": "Historical Data",
        "chartName": "Oct",
        "variableName": "Total",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 10 AND YEAR(order_date) = YEAR(GETDATE())) AS value",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "107",
        "DataPoint": "Total, Nov",
        "chartGroup": "Historical Data",
        "chartName": "Nov",
        "variableName": "Total",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 11 AND YEAR(order_date) = YEAR(GETDATE())) AS value",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "108",
        "DataPoint": "Total, Dec",
        "chartGroup": "Historical Data",
        "chartName": "Dec",
        "variableName": "Total",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 12 AND YEAR(order_date) = YEAR(GETDATE())) AS value",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "117",
        "DataPoint": "Value, Total Orders",
        "chartGroup": "Key Metrics",
        "chartName": "Value",
        "variableName": "Total Orders",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "118",
        "DataPoint": "Value, Open Orders (/day)",
        "chartGroup": "Key Metrics",
        "chartName": "Value",
        "variableName": "Open Orders (/day)",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -7, GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "119",
        "DataPoint": "Value, All Open Orders",
        "chartGroup": "Key Metrics",
        "chartName": "Value",
        "variableName": "All Open Orders",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "120",
        "DataPoint": "Value, Daily Revenue",
        "chartGroup": "Key Metrics",
        "chartName": "Value",
        "variableName": "Daily Revenue",
        "serverName": "P21",
        "tableName": "dbo.invoice_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT SUM(invoice_amt) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "121",
        "DataPoint": "Value, Open Invoices",
        "chartGroup": "Key Metrics",
        "chartName": "Value",
        "variableName": "Open Invoices",
        "serverName": "P21",
        "tableName": "dbo.invoice_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "122",
        "DataPoint": "Value, OrdersBackloged",
        "chartGroup": "Key Metrics",
        "chartName": "Value",
        "variableName": "OrdersBackloged",
        "serverName": "P21",
        "tableName": "dbo.oe_hdr",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "124",
        "DataPoint": "Inventory, Columbus",
        "chartGroup": "Site Distribution",
        "chartName": "Inventory",
        "variableName": "Columbus",
        "serverName": "P21",
        "tableName": "dbo.item_warehouse",
        "calculation": "number",
        "sqlExpression": "SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE location_id = '1'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "125",
        "DataPoint": "Inventory, Addison",
        "chartGroup": "Site Distribution",
        "chartName": "Inventory",
        "variableName": "Addison",
        "serverName": "P21",
        "tableName": "dbo.item_warehouse",
        "calculation": "number",
        "sqlExpression": "SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE location_id = '2'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "126",
        "DataPoint": "Inventory, Lake City",
        "chartGroup": "Site Distribution",
        "chartName": "Inventory",
        "variableName": "Lake City",
        "serverName": "P21",
        "tableName": "dbo.item_warehouse",
        "calculation": "number",
        "sqlExpression": "SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE location_id = '3'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "127",
        "DataPoint": "New Rentals, Jan",
        "chartGroup": "POR Overview",
        "chartName": "Jan",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 1 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "128",
        "DataPoint": "New Rentals, Feb",
        "chartGroup": "POR Overview",
        "chartName": "Feb",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 2 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "129",
        "DataPoint": "New Rentals, Mar",
        "chartGroup": "POR Overview",
        "chartName": "Mar",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 3 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "130",
        "DataPoint": "New Rentals, Apr",
        "chartGroup": "POR Overview",
        "chartName": "Apr",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 4 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "131",
        "DataPoint": "New Rentals, May",
        "chartGroup": "POR Overview",
        "chartName": "May",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 5 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "132",
        "DataPoint": "New Rentals, Jun",
        "chartGroup": "POR Overview",
        "chartName": "Jun",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 6 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "133",
        "DataPoint": "New Rentals, Jul",
        "chartGroup": "POR Overview",
        "chartName": "Jul",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 7 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "134",
        "DataPoint": "New Rentals, Aug",
        "chartGroup": "POR Overview",
        "chartName": "Aug",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 8 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "135",
        "DataPoint": "New Rentals, Sep",
        "chartGroup": "POR Overview",
        "chartName": "Sep",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 9 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "136",
        "DataPoint": "New Rentals, Oct",
        "chartGroup": "POR Overview",
        "chartName": "Oct",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 10 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "137",
        "DataPoint": "New Rentals, Nov",
        "chartGroup": "POR Overview",
        "chartName": "Nov",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 11 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "138",
        "DataPoint": "New Rentals, Dec",
        "chartGroup": "POR Overview",
        "chartName": "Dec",
        "variableName": "New Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 12 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "139",
        "DataPoint": "Open Rentals, Jan",
        "chartGroup": "POR Overview",
        "chartName": "Jan",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 1",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "140",
        "DataPoint": "Open Rentals, Feb",
        "chartGroup": "POR Overview",
        "chartName": "Feb",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 2",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "141",
        "DataPoint": "Open Rentals, Mar",
        "chartGroup": "POR Overview",
        "chartName": "Mar",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 3",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "142",
        "DataPoint": "Open Rentals, Apr",
        "chartGroup": "POR Overview",
        "chartName": "Apr",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 4",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "143",
        "DataPoint": "Open Rentals, May",
        "chartGroup": "POR Overview",
        "chartName": "May",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 5",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "144",
        "DataPoint": "Open Rentals, Jun",
        "chartGroup": "POR Overview",
        "chartName": "Jun",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 6",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "145",
        "DataPoint": "Open Rentals, Jul",
        "chartGroup": "POR Overview",
        "chartName": "Jul",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 7",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "146",
        "DataPoint": "Open Rentals, Aug",
        "chartGroup": "POR Overview",
        "chartName": "Aug",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 8",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "147",
        "DataPoint": "Open Rentals, Sep",
        "chartGroup": "POR Overview",
        "chartName": "Sep",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 9",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "148",
        "DataPoint": "Open Rentals, Oct",
        "chartGroup": "POR Overview",
        "chartName": "Oct",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 10",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "149",
        "DataPoint": "Open Rentals, Nov",
        "chartGroup": "POR Overview",
        "chartName": "Nov",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 11",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "150",
        "DataPoint": "Open Rentals, Dec",
        "chartGroup": "POR Overview",
        "chartName": "Dec",
        "variableName": "Open Rentals",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 12",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "151",
        "DataPoint": "Rental Value, Jan",
        "chartGroup": "POR Overview",
        "chartName": "Jan",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 1",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "152",
        "DataPoint": "Rental Value, Feb",
        "chartGroup": "POR Overview",
        "chartName": "Feb",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 2",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "153",
        "DataPoint": "Rental Value, Mar",
        "chartGroup": "POR Overview",
        "chartName": "Mar",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 3",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "154",
        "DataPoint": "Rental Value, Apr",
        "chartGroup": "POR Overview",
        "chartName": "Apr",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 4",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "155",
        "DataPoint": "Rental Value, May",
        "chartGroup": "POR Overview",
        "chartName": "May",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 5",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "156",
        "DataPoint": "Rental Value, Jun",
        "chartGroup": "POR Overview",
        "chartName": "Jun",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 6",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "157",
        "DataPoint": "Rental Value, Jul",
        "chartGroup": "POR Overview",
        "chartName": "Jul",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 7",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "158",
        "DataPoint": "Rental Value, Aug",
        "chartGroup": "POR Overview",
        "chartName": "Aug",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 8",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "159",
        "DataPoint": "Rental Value, Sep",
        "chartGroup": "POR Overview",
        "chartName": "Sep",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 9",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "160",
        "DataPoint": "Rental Value, Oct",
        "chartGroup": "POR Overview",
        "chartName": "Oct",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 10",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "161",
        "DataPoint": "Rental Value, Nov",
        "chartGroup": "POR Overview",
        "chartName": "Nov",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 11",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "162",
        "DataPoint": "Rental Value, Dec",
        "chartGroup": "POR Overview",
        "chartName": "Dec",
        "variableName": "Rental Value",
        "serverName": "POR",
        "tableName": "Contracts",
        "calculation": "number",
        "sqlExpression": "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 12",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "163",
        "DataPoint": "Orders, Today",
        "chartGroup": "Daily Orders",
        "chartName": "Today",
        "variableName": "Orders",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE DATEDIFF(day, OrderDate, GETDATE()) = 0",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "164",
        "DataPoint": "Orders, Yesterday",
        "chartGroup": "Daily Orders",
        "chartName": "Yesterday",
        "variableName": "Orders",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE DATEDIFF(day, OrderDate, GETDATE()) = 1",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "165",
        "DataPoint": "Orders, 2 Days Ago",
        "chartGroup": "Daily Orders",
        "chartName": "2 Days Ago",
        "variableName": "Orders",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE DATEDIFF(day, OrderDate, GETDATE()) = 2",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "166",
        "DataPoint": "Orders, 3 Days Ago",
        "chartGroup": "Daily Orders",
        "chartName": "3 Days Ago",
        "variableName": "Orders",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE DATEDIFF(day, OrderDate, GETDATE()) = 3",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "167",
        "DataPoint": "Orders, 4 Days Ago",
        "chartGroup": "Daily Orders",
        "chartName": "4 Days Ago",
        "variableName": "Orders",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE DATEDIFF(day, OrderDate, GETDATE()) = 4",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "168",
        "DataPoint": "Orders, 5 Days Ago",
        "chartGroup": "Daily Orders",
        "chartName": "5 Days Ago",
        "variableName": "Orders",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE DATEDIFF(day, OrderDate, GETDATE()) = 5",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "169",
        "DataPoint": "Orders, 6 Days Ago",
        "chartGroup": "Daily Orders",
        "chartName": "6 Days Ago",
        "variableName": "Orders",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE DATEDIFF(day, OrderDate, GETDATE()) = 6",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "54",
        "DataPoint": "Sales Total, Jan",
        "chartGroup": "Historical Data",
        "chartName": "Jan",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 1 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "54B",
        "DataPoint": "Rental Total, Jan",
        "chartGroup": "Historical Data",
        "chartName": "Jan",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "55",
        "DataPoint": "Sales Total, Feb",
        "chartGroup": "Historical Data",
        "chartName": "Feb",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 2 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "55B",
        "DataPoint": "Rental Total, Feb",
        "chartGroup": "Historical Data",
        "chartName": "Feb",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "56",
        "DataPoint": "Sales Total, Mar",
        "chartGroup": "Historical Data",
        "chartName": "Mar",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 3 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "56B",
        "DataPoint": "Rental Total, Mar",
        "chartGroup": "Historical Data",
        "chartName": "Mar",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "57",
        "DataPoint": "Sales Total, Apr",
        "chartGroup": "Historical Data",
        "chartName": "Apr",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 4 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "57B",
        "DataPoint": "Rental Total, Apr",
        "chartGroup": "Historical Data",
        "chartName": "Apr",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "58",
        "DataPoint": "Sales Total, May",
        "chartGroup": "Historical Data",
        "chartName": "May",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 5 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "58B",
        "DataPoint": "Rental Total, May",
        "chartGroup": "Historical Data",
        "chartName": "May",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "59",
        "DataPoint": "Sales Total, Jun",
        "chartGroup": "Historical Data",
        "chartName": "Jun",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 6 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "59B",
        "DataPoint": "Rental Total, Jun",
        "chartGroup": "Historical Data",
        "chartName": "Jun",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "60",
        "DataPoint": "Sales Total, Jul",
        "chartGroup": "Historical Data",
        "chartName": "Jul",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 7 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "60B",
        "DataPoint": "Rental Total, Jul",
        "chartGroup": "Historical Data",
        "chartName": "Jul",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "61",
        "DataPoint": "Sales Total, Aug",
        "chartGroup": "Historical Data",
        "chartName": "Aug",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 8 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "61B",
        "DataPoint": "Rental Total, Aug",
        "chartGroup": "Historical Data",
        "chartName": "Aug",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "62",
        "DataPoint": "Sales Total, Sep",
        "chartGroup": "Historical Data",
        "chartName": "Sep",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 9 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "62B",
        "DataPoint": "Rental Total, Sep",
        "chartGroup": "Historical Data",
        "chartName": "Sep",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "63",
        "DataPoint": "Sales Total, Oct",
        "chartGroup": "Historical Data",
        "chartName": "Oct",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 10 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "63B",
        "DataPoint": "Rental Total, Oct",
        "chartGroup": "Historical Data",
        "chartName": "Oct",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "64",
        "DataPoint": "Sales Total, Nov",
        "chartGroup": "Historical Data",
        "chartName": "Nov",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 11 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "64B",
        "DataPoint": "Rental Total, Nov",
        "chartGroup": "Historical Data",
        "chartName": "Nov",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "65",
        "DataPoint": "Sales Total, Dec",
        "chartGroup": "Historical Data",
        "chartName": "Dec",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = 12 AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "65B",
        "DataPoint": "Rental Total, Dec",
        "chartGroup": "Historical Data",
        "chartName": "Dec",
        "variableName": "Rental Total",
        "serverName": "P21",
        "tableName": "dbo.placeholder_rental",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No P21 rental amount source in schema",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "68",
        "DataPoint": "Orders Today",
        "chartGroup": "Key Metrics",
        "chartName": "Orders",
        "variableName": "Orders Today",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE DATEDIFF(day, OrderDate, GETDATE()) = 0",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "69",
        "DataPoint": "Rental Contracts Today",
        "chartGroup": "Key Metrics",
        "chartName": "Rentals",
        "variableName": "Rental Contracts Today",
        "serverName": "POR",
        "tableName": "RentalContracts",
        "calculation": "number",
        "sqlExpression": "SELECT Count(*) as value FROM RentalContracts WHERE DateValue(ContractDate) = Date()",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "70",
        "DataPoint": "Total Sales Today",
        "chartGroup": "Key Metrics",
        "chartName": "Sales",
        "variableName": "Total Sales Today",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE DATEDIFF(day, InvoiceDate, GETDATE()) = 0",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "71",
        "DataPoint": "Total Rental Today",
        "chartGroup": "Key Metrics",
        "chartName": "Rentals",
        "variableName": "Total Rental Today",
        "serverName": "POR",
        "tableName": "Payments",
        "calculation": "dollar",
        "sqlExpression": "SELECT Nz(Sum(Amount), 0) as value FROM Payments WHERE DateValue(PaymentDate) = Date()",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "72",
        "DataPoint": "Rentals, Columbus",
        "chartGroup": "Site Distribution",
        "chartName": "Columbus",
        "variableName": "Rentals",
        "serverName": "POR",
        "tableName": "RentalContracts",
        "calculation": "number",
        "sqlExpression": "SELECT Nz(Count(*), 0) as value FROM RentalContracts WHERE SiteName = 'Columbus'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "73",
        "DataPoint": "Sales, Columbus",
        "chartGroup": "Site Distribution",
        "chartName": "Columbus",
        "variableName": "Sales",
        "serverName": "POR",
        "tableName": "Placeholder",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No POR Sales table for Site Distribution",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "74",
        "DataPoint": "Rentals, Addison",
        "chartGroup": "Site Distribution",
        "chartName": "Addison",
        "variableName": "Rentals",
        "serverName": "POR",
        "tableName": "RentalContracts",
        "calculation": "number",
        "sqlExpression": "SELECT Nz(Count(*), 0) as value FROM RentalContracts WHERE SiteName = 'Addison'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "75",
        "DataPoint": "Sales, Addison",
        "chartGroup": "Site Distribution",
        "chartName": "Addison",
        "variableName": "Sales",
        "serverName": "POR",
        "tableName": "Placeholder",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No POR Sales table for Site Distribution",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "76",
        "DataPoint": "Rentals, Lake City",
        "chartGroup": "Site Distribution",
        "chartName": "Lake City",
        "variableName": "Rentals",
        "serverName": "POR",
        "tableName": "RentalContracts",
        "calculation": "number",
        "sqlExpression": "SELECT Nz(Count(*), 0) as value FROM RentalContracts WHERE SiteName = 'Lake City'",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "77",
        "DataPoint": "Sales, Lake City",
        "chartGroup": "Site Distribution",
        "chartName": "Lake City",
        "variableName": "Sales",
        "serverName": "POR",
        "tableName": "Placeholder",
        "calculation": "dollar",
        "sqlExpression": "SELECT 0 as value -- Placeholder: No POR Sales table for Site Distribution",
        "value": "0",
        "lastUpdated": ""
    },
    // Group 7: Key Metrics (P21) - Corrected based on 7 individual metrics in specs
    {
        "id": "68", // Total Orders (Current Month)
        "DataPoint": "Total Orders This Month",
        "chartGroup": "Key Metrics",
        "chartName": "Total Orders",
        "variableName": "Order_count",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE MONTH(OrderDate) = MONTH(GETDATE()) AND YEAR(OrderDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "69", // Open Orders per Day
        "DataPoint": "Open Orders Today",
        "chartGroup": "Key Metrics",
        "chartName": "Open Orders Day",
        "variableName": "Order_count_day",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE OrderStatus = 'Open' AND DATEDIFF(day, OrderDate, GETDATE()) = 0", // Assumes OrderStatus='Open'
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "70", // All Open Orders (Last 12 Months)
        "DataPoint": "All Open Orders (12m)",
        "chartGroup": "Key Metrics",
        "chartName": "All Open Orders",
        "variableName": "Order_count_total",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE OrderStatus = 'Open' AND OrderDate >= DATEADD(year, -1, GETDATE())", // Assumes OrderStatus='Open'
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "71", // Daily Revenue
        "DataPoint": "Revenue Today",
        "chartGroup": "Key Metrics",
        "chartName": "Daily Revenue",
        "variableName": "Revenue_day",
        "serverName": "P21",
        "tableName": "dbo.Invoices", // Using Invoices instead of SOMAST
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE DATEDIFF(day, InvoiceDate, GETDATE()) = 0",
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "72", // Open Invoices (Last 12 Months)
        "DataPoint": "Open Invoices (12m)",
        "chartGroup": "Key Metrics",
        "chartName": "Open Invoices",
        "variableName": "Invoice_count_total",
        "serverName": "P21",
        "tableName": "dbo.Invoices", // Using Invoices instead of ARINV
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.Invoices WITH (NOLOCK) WHERE InvoiceStatus = 'Open' AND InvoiceDate >= DATEADD(year, -1, GETDATE())", // Assumes InvoiceStatus='Open'
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "73", // Orders Backlogged Overview (Last 12 Months)
        "DataPoint": "Backlogged Orders (12m)",
        "chartGroup": "Key Metrics",
        "chartName": "Backlog Orders",
        "variableName": "Backlog_order_count",
        "serverName": "P21",
        "tableName": "dbo.SalesOrderHeader",
        "calculation": "number",
        "sqlExpression": "SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE OrderStatus = 'Backlogged' AND OrderDate >= DATEADD(year, -1, GETDATE())", // Assumes OrderStatus='Backlogged'
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "74", // Total Sales Monthly Overview (Current Month)
        "DataPoint": "Net Sales This Month",
        "chartGroup": "Key Metrics",
        "chartName": "Total Sales Month",
        "variableName": "Net_Sales",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE MONTH(InvoiceDate) = MONTH(GETDATE()) AND YEAR(InvoiceDate) = YEAR(GETDATE())",
        "value": "0",
        "lastUpdated": ""
    },
    // Group 8: Site Distribution (P21) - Corrected based on 3 sites in specs
    {
        "id": "75", // Sales Columbus (Current Month)
        "DataPoint": "Sales, Columbus",
        "chartGroup": "Site Distribution",
        "chartName": "Columbus",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices", // Using Invoices instead of SOMAST
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE SiteName = 'Columbus' AND MONTH(InvoiceDate) = MONTH(GETDATE()) AND YEAR(InvoiceDate) = YEAR(GETDATE())", // Assumes SiteName column
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "76", // Sales Addison (Current Month)
        "DataPoint": "Sales, Addison",
        "chartGroup": "Site Distribution",
        "chartName": "Addison",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE SiteName = 'Addison' AND MONTH(InvoiceDate) = MONTH(GETDATE()) AND YEAR(InvoiceDate) = YEAR(GETDATE())", // Assumes SiteName column
        "value": "0",
        "lastUpdated": ""
    },
    {
        "id": "77", // Sales Lake City (Current Month)
        "DataPoint": "Sales, Lake City",
        "chartGroup": "Site Distribution",
        "chartName": "Lake City",
        "variableName": "Sales Total",
        "serverName": "P21",
        "tableName": "dbo.Invoices",
        "calculation": "dollar",
        "sqlExpression": "SELECT ISNULL(SUM(Amount), 0) as value FROM dbo.Invoices WITH (NOLOCK) WHERE SiteName = 'Lake City' AND MONTH(InvoiceDate) = MONTH(GETDATE()) AND YEAR(InvoiceDate) = YEAR(GETDATE())", // Assumes SiteName column
        "value": "0",
        "lastUpdated": ""
    },
    {
        // --- Generate Group 9 Data ---Web Orders
        //Requires 12 copies each adjusted for monthOffset 
        "id": "78" `,
    "DataPoint": `, Web, Orders, $
    }, { month }, $, { year } `,
    "chartGroup": "Web Orders",
    "chartName": `, Web, Orders, M - $, { monthOffset } `,
    "variableName": "Web_Order_count",
    "serverName": "P21",
    "tableName": "dbo.SalesOrderHeader",
    "calculation": "number",
    "sqlExpression": `, SELECT, COUNT( * ), FROM, dbo.SalesOrderHeader, WITH(NOLOCK), WHERE, Source = 'Tallman.com', AND, DATEDIFF(month, OrderDate, column, "value", "0", "lastUpdated", "")
];
{
    "id";
    "79",
        "DataPoint";
    `Web Orders ${month} ${year}`,
        "chartGroup";
    "Web Orders",
        "chartName";
    `Web Orders M-${monthOffset}`,
        "variableName";
    "Web_Order_count",
        "serverName";
    "P21",
        "tableName";
    "dbo.SalesOrderHeader",
        "calculation";
    "number",
        "sqlExpression";
    `SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE Source = 'Tallman.com' AND DATEDIFF(month-1, OrderDate, column)
    "value": "0",
    "lastUpdated": ""

  },
  {
    "id": "80",
    "DataPoint": `;
    Web;
    Orders;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "Web Orders",
    "chartName": `;
    Web;
    Orders;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Web_Order_count",
    "serverName": "P21",
    "tableName": "dbo.SalesOrderHeader",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    COUNT( * );
    FROM;
    dbo.SalesOrderHeader;
    WITH(NOLOCK);
    WHERE;
    Source = 'Tallman.com';
    AND;
    DATEDIFF(month - 2, OrderDate, column, "value", "0", "lastUpdated", "");
}
{
    "id";
    "81",
        "DataPoint";
    `Web Orders ${month} ${year}`,
        "chartGroup";
    "Web Orders",
        "chartName";
    `Web Orders M-${monthOffset}`,
        "variableName";
    "Web_Order_count",
        "serverName";
    "P21",
        "tableName";
    "dbo.SalesOrderHeader",
        "calculation";
    "number",
        "sqlExpression";
    `SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE Source = 'Tallman.com' AND DATEDIFF(month-3, OrderDate, column)
    "value": "0",
    "lastUpdated": ""
},
{

    "id": "82",
    "DataPoint": `;
    Web;
    Orders;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "Web Orders",
    "chartName": `;
    Web;
    Orders;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Web_Order_count",
    "serverName": "P21",
    "tableName": "dbo.SalesOrderHeader",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    COUNT( * );
    FROM;
    dbo.SalesOrderHeader;
    WITH(NOLOCK);
    WHERE;
    Source = 'Tallman.com';
    AND;
    DATEDIFF(month - 4, OrderDate, column);
    "value";
    "0",
        "lastUpdated";
    "";
}
{
    "id";
    "83",
        "DataPoint";
    `Web Orders ${month} ${year}`,
        "chartGroup";
    "Web Orders",
        "chartName";
    `Web Orders M-${monthOffset}`,
        "variableName";
    "Web_Order_count",
        "serverName";
    "P21",
        "tableName";
    "dbo.SalesOrderHeader",
        "calculation";
    "number",
        "sqlExpression";
    `SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE Source = 'Tallman.com' AND DATEDIFF(month-5, OrderDate, column)
    "value": "0",
    "lastUpdated": ""
},
{

    "id": "84",
    "DataPoint": `;
    Web;
    Orders;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "Web Orders",
    "chartName": `;
    Web;
    Orders;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Web_Order_count",
    "serverName": "P21",
    "tableName": "dbo.SalesOrderHeader",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    COUNT( * );
    FROM;
    dbo.SalesOrderHeader;
    WITH(NOLOCK);
    WHERE;
    Source = 'Tallman.com';
    AND;
    DATEDIFF(month - 6, OrderDate, column);
    "value";
    "0",
        "lastUpdated";
    "";
}
{
    "id";
    "85",
        "DataPoint";
    `Web Orders ${month} ${year}`,
        "chartGroup";
    "Web Orders",
        "chartName";
    `Web Orders M-${monthOffset}`,
        "variableName";
    "Web_Order_count",
        "serverName";
    "P21",
        "tableName";
    "dbo.SalesOrderHeader",
        "calculation";
    "number",
        "sqlExpression";
    `SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE Source = 'Tallman.com' AND DATEDIFF(month-7, OrderDate, column)
    "value": "0",
    "lastUpdated": ""

 },
 {

    "id": "86",
    "DataPoint": `;
    Web;
    Orders;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "Web Orders",
    "chartName": `;
    Web;
    Orders;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Web_Order_count",
    "serverName": "P21",
    "tableName": "dbo.SalesOrderHeader",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    COUNT( * );
    FROM;
    dbo.SalesOrderHeader;
    WITH(NOLOCK);
    WHERE;
    Source = 'Tallman.com';
    AND;
    DATEDIFF(month - 8, OrderDate, column);
    "value";
    "0",
        "lastUpdated";
    "";
}
{
    "id";
    "87",
        "DataPoint";
    `Web Orders ${month} ${year}`,
        "chartGroup";
    "Web Orders",
        "chartName";
    `Web Orders M-${monthOffset}`,
        "variableName";
    "Web_Order_count",
        "serverName";
    "P21",
        "tableName";
    "dbo.SalesOrderHeader",
        "calculation";
    "number",
        "sqlExpression";
    `SELECT COUNT(*) as value FROM dbo.SalesOrderHeader WITH (NOLOCK) WHERE Source = 'Tallman.com' AND DATEDIFF(month-9, OrderDate, column)
  "value": "0",
  "lastUpdated": ""

},
{
  "id": "88",
  "DataPoint": `;
    Web;
    Orders;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "Web Orders",
  "chartName": `;
    Web;
    Orders;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "Web_Order_count",
  "serverName": "P21",
  "tableName": "dbo.SalesOrderHeader",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    COUNT( * );
    FROM;
    dbo.SalesOrderHeader;
    WITH(NOLOCK);
    WHERE;
    Source = 'Tallman.com';
    AND;
    DATEDIFF(month - 10, OrderDate, GETDATE()) = $;
    {
        monthOffset;
    }
    `, // Assumes Source column
  "value": "0",
  "lastUpdated": ""
},
{

  "id": "89",
  "DataPoint": `;
    Web;
    Orders;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "Web Orders",
  "chartName": `;
    Web;
    Orders;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "Web_Order_count",
  "serverName": "P21",
  "tableName": "dbo.SalesOrderHeader",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    COUNT( * );
    FROM;
    dbo.SalesOrderHeader;
    WITH(NOLOCK);
    WHERE;
    Source = 'Tallman.com';
    AND;
    DATEDIFF(month - 11, OrderDate, GETDATE()) = $;
    {
        monthOffset;
    }
    `, // Assumes Source column
  "value": "0",
  "lastUpdated": ""
},
{

// --- Generate Group 10 Data for New Rentals--- 
 //Requires 12 copies each adjusted for monthOffset


    "id": "90",
    "DataPoint": `;
    New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "New Rental Order count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
    "value": "0",
    "lastUpdated": ""
},
{ 

  "id": "91",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{ 
  "id": "92",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{ 
  "id": "93",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{ 
  "id":       "94",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{ 
  "id": "95",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{ 
  "id": "96",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{ 
  "id": "97",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{ 
  "id": "98",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{ 
  "id": "99",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{ 
  "id": "100",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{ 
  "id": "101",
  "DataPoint": `)
        New;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
  "chartGroup": "POR Overview",
  "chartName": `;
    New;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
  "variableName": "New Rental Order count",
  "serverName": "POR",
  "tableName": "RentalContracts",
  "calculation": "number",
  "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    --Spec;
    requires;
    filtering;
    for ( * new  * customers; this; month. `,
  "value": "0",
  "lastUpdated": ""
},
{    
 // --- Generate Group 10 Data for Open Rentals--- 
 //Requires 12 copies each adjusted for monthOffset 


    "id": "102",
    "DataPoint": `)
        Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
  

    "id": "103",
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "104",
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "105",
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "106",
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "107",
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "108",
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "109",
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "110",
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": 1
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": 1
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": 1
    "DataPoint": `;
    Open;
    Rentals;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Open;
    Rentals;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "Open_Rental_count",
    "serverName": "POR",
    "tableName": "RentalContracts",
    "calculation": "number",
    "sqlExpression": `;
    SELECT;
    Count( * );
    FROM;
    RentalContracts;
    WHERE;
    Status;
    IN('Open', 'Active', 'Out');
    AND;
    DATEDIFF('m', ContractDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  {     
    
 // --- Generate Group 10 Data for Rental Value--- 
 //Requires 12 copies each adjusted for monthOffset

    "id": "130", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 

    "id": "131", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "132", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "133", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "134", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "135", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id":   "136", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "137", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "138", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "139", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "140", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
  { 
    "id": "141", // IDs 114-125
    "DataPoint": `;
    Rental;
    Value;
    $;
    {
        month;
    }
    $;
    {
        year;
    }
    `,
    "chartGroup": "POR Overview",
    "chartName": `;
    Rental;
    Value;
    M - $;
    {
        monthOffset;
    }
    `,
    "variableName": "rental_sales_value",
    "serverName": "POR",
    "tableName": "Payments",
    "calculation": "dollar",
    "sqlExpression": `;
    SELECT;
    Nz(Sum(Amount), 0);
    FROM;
    Payments;
    WHERE;
    DATEDIFF('m', PaymentDate, Date()) = $;
    {
        monthOffset;
    }
    `,
    "value": "0",
    "lastUpdated": ""
  },
]  






// Test data (if needed for development/testing)
// export const testServerConfigs: ServerConfig[] = [
//   {
//     id: "142", 
//     server_name: 'Test P21 Server', 
//     host: 'test-p21-host', 
//     port: 1433, 
//     database: 'test-p21-db', 
//     username: 'testuser', 
//     password: 'testpass', 
//     is_active: 1, 
//     connection_type: 'sqlserver', 
//     server: 'test-p21-server-address',
//     created_at: new Date().toISOString(), 
//     updated_at: new Date().toISOString(),
//     config: {}
//   },
//   {
//     id: "143",
//     server_name: 'Test POR Server', 
//     host: 'test-por-host', // Assuming host is relevant, might be DSN name for ODBC
//     port: 0, // Port might not be applicable for ODBC/MDB
//     database: 'C:/path/to/test/por.mdb', // Path to MDB or DSN
//     username: '',
//     password: '',
//     is_active: 1,
//     connection_type: 'odbc', // Or 'mdb' depending on connection method
//     server: 'Test POR DSN', // DSN name or identifier
//     created_at: new Date().toISOString(),
//     updated_at: new Date().toISOString(),
//     config: { dsn: 'Test POR DSN' } // Example ODBC config
//   }
// ];

// You might load actual configs from environment variables or a secure store in a real app
// For example:
// if (process.env.NODE_ENV !== 'production') {
//   serverConfigs.push(...testServerConfigs);
// } else {
//   // Load production configs securely
// }
    ;
}
export {};
