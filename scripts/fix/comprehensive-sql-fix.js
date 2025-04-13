/**
 * Comprehensive SQL Fix Script
 * 
 * This script updates all 174 SQL expressions in the dashboard database
 * with correct syntax for P21 and POR databases.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Get the database path
const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'dashboard.db');

// Complete list of all 174 SQL expressions with correct syntax
const allSqlExpressions = [
  // AR Aging (5 rows)
  {
    id: 1,
    chartGroup: "AR Aging",
    variableName: "Amount Due",
    dataPoint: "AR Aging Amount Due 1-30 Days",
    server: "P21",
    tableName: "dbo.ar_open_items",
    sql: "SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30"
  },
  {
    id: 2,
    chartGroup: "AR Aging",
    variableName: "Amount Due",
    dataPoint: "AR Aging Amount Due 31-60 Days",
    server: "P21",
    tableName: "dbo.ar_open_items",
    sql: "SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60"
  },
  {
    id: 3,
    chartGroup: "AR Aging",
    variableName: "Amount Due",
    dataPoint: "AR Aging Amount Due 61-90 Days",
    server: "P21",
    tableName: "dbo.ar_open_items",
    sql: "SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 61 AND 90"
  },
  {
    id: 4,
    chartGroup: "AR Aging",
    variableName: "Amount Due",
    dataPoint: "AR Aging Amount Due 90+ Days",
    server: "P21",
    tableName: "dbo.ar_open_items",
    sql: "SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 90"
  },
  {
    id: 5,
    chartGroup: "AR Aging",
    variableName: "Amount Due",
    dataPoint: "AR Aging Amount Due Current",
    server: "P21",
    tableName: "dbo.ar_open_items",
    sql: "SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE due_date >= GETDATE()"
  },
  
  // Accounts - Payable (12 rows)
  {
    id: 6,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Jan",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 7,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Feb",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 2 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 8,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Mar",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 3 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 9,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Apr",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 4 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 10,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable May",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 5 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 11,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Jun",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 6 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 12,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Jul",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 7 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 13,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Aug",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 8 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 14,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Sep",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 9 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 15,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Oct",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 10 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 16,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Nov",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 11 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 17,
    chartGroup: "Accounts",
    variableName: "Payable",
    dataPoint: "Accounts Payable Dec",
    server: "P21",
    tableName: "dbo.ap_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND MONTH(invoice_date) = 12 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  
  // Accounts - Receivable (12 rows)
  {
    id: 18,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Jan",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 19,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Feb",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 2 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 20,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Mar",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 3 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 21,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Apr",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 4 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 22,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable May",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 5 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 23,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Jun",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 6 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 24,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Jul",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 7 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 25,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Aug",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 8 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 26,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Sep",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 9 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 27,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Oct",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 10 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 28,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Nov",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 11 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 29,
    chartGroup: "Accounts",
    variableName: "Receivable",
    dataPoint: "Accounts Receivable Dec",
    server: "P21",
    tableName: "dbo.temp_invoice_summary",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.temp_invoice_summary WITH (NOLOCK) WHERE MONTH(invoice_date) = 12 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  
  // Accounts - Overdue (12 rows)
  {
    id: 30,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Jan",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 1 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 31,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Feb",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 2 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 32,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Mar",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 3 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 33,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Apr",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 4 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 34,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue May",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 5 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 35,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Jun",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 6 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 36,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Jul",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 7 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 37,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Aug",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 8 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 38,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Sep",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 9 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 39,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Oct",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 10 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 40,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Nov",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 11 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  {
    id: 41,
    chartGroup: "Accounts",
    variableName: "Overdue",
    dataPoint: "Accounts Overdue Dec",
    server: "P21",
    tableName: "dbo.ar_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE due_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30 AND MONTH(due_date) = 12 AND YEAR(due_date) = YEAR(GETDATE())"
  },
  
  // Customer Metrics - New (12 rows)
  {
    id: 42,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Jan",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-01-01' 
      AND c.date_created <= '${new Date().getFullYear()}-01-31'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-01-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-02-01'
      )
    `
  },
  {
    id: 43,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Feb",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-02-01' 
      AND c.date_created <= '${new Date().getFullYear()}-02-28'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-02-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-03-01'
      )
    `
  },
  {
    id: 44,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Mar",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-03-01' 
      AND c.date_created <= '${new Date().getFullYear()}-03-31'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-03-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-04-01'
      )
    `
  },
  {
    id: 45,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Apr",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-04-01' 
      AND c.date_created <= '${new Date().getFullYear()}-04-30'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-04-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-05-01'
      )
    `
  },
  {
    id: 46,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, May",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-05-01' 
      AND c.date_created <= '${new Date().getFullYear()}-05-31'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-05-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-06-01'
      )
    `
  },
  {
    id: 47,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Jun",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-06-01' 
      AND c.date_created <= '${new Date().getFullYear()}-06-30'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-06-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-07-01'
      )
    `
  },
  {
    id: 48,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Jul",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-07-01' 
      AND c.date_created <= '${new Date().getFullYear()}-07-31'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-07-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-08-01'
      )
    `
  },
  {
    id: 49,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Aug",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-08-01' 
      AND c.date_created <= '${new Date().getFullYear()}-08-31'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-08-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-09-01'
      )
    `
  },
  {
    id: 50,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Sep",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-09-01' 
      AND c.date_created <= '${new Date().getFullYear()}-09-30'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-09-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-10-01'
      )
    `
  },
  {
    id: 51,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Oct",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-10-01' 
      AND c.date_created <= '${new Date().getFullYear()}-10-31'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-10-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-11-01'
      )
    `
  },
  {
    id: 52,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Nov",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-11-01' 
      AND c.date_created <= '${new Date().getFullYear()}-11-30'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-11-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-12-01'
      )
    `
  },
  {
    id: 53,
    chartGroup: "Customer Metrics",
    variableName: "New",
    dataPoint: "Customer Metrics New, Dec",
    server: "P21",
    tableName: "dbo.customer",
    sql: `
      SELECT COUNT(DISTINCT c.customer_id) AS value 
      FROM dbo.customer c WITH (NOLOCK)
      WHERE c.date_created >= '${new Date().getFullYear()}-12-01' 
      AND c.date_created <= '${new Date().getFullYear()}-12-31'
      AND NOT EXISTS (
        SELECT 1 
        FROM dbo.oe_hdr o WITH (NOLOCK) 
        WHERE o.customer_id = c.customer_id 
        AND o.order_date < '${new Date().getFullYear()}-12-01' 
        AND o.order_date >= '${new Date().getFullYear()-1}-01-01'
      )
    `
  },
  
  // Customer Metrics - Prospects (12 rows)
  {
    id: 54,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Jan",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 1 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 55,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Feb",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 2 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 56,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Mar",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 3 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 57,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Apr",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 4 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 58,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, May",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 5 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 59,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Jun",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 6 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 60,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Jul",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 7 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 61,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Aug",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 8 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 62,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Sep",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 9 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 63,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Oct",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 10 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 64,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Nov",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 11 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  {
    id: 65,
    chartGroup: "Customer Metrics",
    variableName: "Prospects",
    dataPoint: "Customer Metrics Prospects, Dec",
    server: "P21",
    tableName: "dbo.customer",
    sql: "SELECT COUNT(DISTINCT customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE customer_type_cd = 1 AND MONTH(date_created) = 12 AND YEAR(date_created) = YEAR(GETDATE())"
  },
  
  // Daily Orders (7 rows)
  {
    id: 66,
    chartGroup: "Daily Orders",
    variableName: "Orders",
    dataPoint: "Daily Orders Orders Today",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 0"
  },
  {
    id: 67,
    chartGroup: "Daily Orders",
    variableName: "Orders",
    dataPoint: "Daily Orders Orders Today-, 1",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 1"
  },
  {
    id: 68,
    chartGroup: "Daily Orders",
    variableName: "Orders",
    dataPoint: "Daily Orders Orders Today-, 2",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 2"
  },
  {
    id: 69,
    chartGroup: "Daily Orders",
    variableName: "Orders",
    dataPoint: "Daily Orders Orders Today-, 3",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 3"
  },
  {
    id: 70,
    chartGroup: "Daily Orders",
    variableName: "Orders",
    dataPoint: "Daily Orders Orders Today-, 4",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 4"
  },
  {
    id: 71,
    chartGroup: "Daily Orders",
    variableName: "Orders",
    dataPoint: "Daily Orders Orders Today-, 5",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 5"
  },
  {
    id: 72,
    chartGroup: "Daily Orders",
    variableName: "Orders",
    dataPoint: "Daily Orders Orders Today-, 6",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE DATEDIFF(day, order_date, GETDATE()) = 6"
  },
  
  // Historical Data - P21 (12 rows)
  {
    id: 73,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Jan",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 1 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 74,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Feb",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 2 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 75,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Mar",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 3 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 76,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Apr",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 4 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 77,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, May",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 5 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 78,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Jun",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 6 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 79,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Jul",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 7 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 80,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Aug",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 8 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 81,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Sep",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 9 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 82,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Oct",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 10 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 83,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Nov",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 11 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 84,
    chartGroup: "Historical Data",
    variableName: "P21",
    dataPoint: "Historical Data P21, Dec",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 12 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  
  // Historical Data - POR (12 rows)
  {
    id: 85,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Jan",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 1 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 86,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Feb",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 2 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 87,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Mar",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 3 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 88,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Apr",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 4 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 89,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, May",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 5 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 90,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Jun",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 6 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 91,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Jul",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 7 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 92,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Aug",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 8 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 93,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Sep",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 9 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 94,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Oct",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 10 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 95,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Nov",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 11 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  {
    id: 96,
    chartGroup: "Historical Data",
    variableName: "POR",
    dataPoint: "Historical Data POR, Dec",
    server: "POR",
    tableName: "PurchaseOrderDetail",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE DatePart('m', Date) = 12 AND DatePart('yyyy', Date) = DatePart('yyyy', Now())"
  },
  
  // Historical Data - Total (12 rows)
  {
    id: 97,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Jan",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 1 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 98,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Feb",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 2 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 99,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Mar",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 3 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 100,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Apr",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 4 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 101,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, May",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 5 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 102,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Jun",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 6 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 103,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Jul",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 7 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 104,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Aug",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 8 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 105,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Sep",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 9 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 106,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Oct",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 10 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 107,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Nov",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 11 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  {
    id: 108,
    chartGroup: "Historical Data",
    variableName: "Total",
    dataPoint: "Historical Data Total, Dec",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 12 AND YEAR(order_date) = YEAR(GETDATE())) AS value"
  },
  
  // Inventory - In Stock (4 rows)
  {
    id: 109,
    chartGroup: "Inventory",
    variableName: "In Stock",
    dataPoint: "Inventory In Stock Dept, 100",
    server: "P21",
    tableName: "dbo.inv_mast",
    sql: "SELECT SUM(qty_on_hand) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE product_line = '100'"
  },
  {
    id: 110,
    chartGroup: "Inventory",
    variableName: "In Stock",
    dataPoint: "Inventory In Stock Dept, 101",
    server: "P21",
    tableName: "dbo.inv_mast",
    sql: "SELECT SUM(qty_on_hand) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE product_line = '101'"
  },
  {
    id: 111,
    chartGroup: "Inventory",
    variableName: "In Stock",
    dataPoint: "Inventory In Stock Dept, 102",
    server: "P21",
    tableName: "dbo.inv_mast",
    sql: "SELECT SUM(qty_on_hand) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE product_line = '102'"
  },
  {
    id: 112,
    chartGroup: "Inventory",
    variableName: "In Stock",
    dataPoint: "Inventory In Stock Dept, 207",
    server: "P21",
    tableName: "dbo.inv_mast",
    sql: "SELECT SUM(qty_on_hand) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE product_line = '207'"
  },
  
  // Inventory - On Order (4 rows)
  {
    id: 113,
    chartGroup: "Inventory",
    variableName: "On Order",
    dataPoint: "Inventory On Order Dept, 100",
    server: "P21",
    tableName: "dbo.inv_mast",
    sql: "SELECT SUM(qty_on_order) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE product_line = '100'"
  },
  {
    id: 114,
    chartGroup: "Inventory",
    variableName: "On Order",
    dataPoint: "Inventory On Order Dept, 101",
    server: "P21",
    tableName: "dbo.inv_mast",
    sql: "SELECT SUM(qty_on_order) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE product_line = '101'"
  },
  {
    id: 115,
    chartGroup: "Inventory",
    variableName: "On Order",
    dataPoint: "Inventory On Order Dept, 102",
    server: "P21",
    tableName: "dbo.inv_mast",
    sql: "SELECT SUM(qty_on_order) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE product_line = '102'"
  },
  {
    id: 116,
    chartGroup: "Inventory",
    variableName: "On Order",
    dataPoint: "Inventory On Order Dept, 207",
    server: "P21",
    tableName: "dbo.inv_mast",
    sql: "SELECT SUM(qty_on_order) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE product_line = '207'"
  },
  
  // Key Metrics (7 rows)
  {
    id: 117,
    chartGroup: "Key Metrics",
    variableName: "Total Orders",
    dataPoint: "Key Metrics Total Orders Overview",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  },
  {
    id: 118,
    chartGroup: "Key Metrics",
    variableName: "Open Orders (/day)",
    dataPoint: "Key Metrics Open Orders (/day) Overview",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -7, GETDATE())"
  },
  {
    id: 119,
    chartGroup: "Key Metrics",
    variableName: "All Open Orders",
    dataPoint: "Key Metrics All Open Orders Overview",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    id: 120,
    chartGroup: "Key Metrics",
    variableName: "Daily Revenue",
    dataPoint: "Key Metrics Daily Revenue Overview",
    server: "P21",
    tableName: "dbo.invoice_hdr",
    sql: "SELECT SUM(invoice_amt) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: 121,
    chartGroup: "Key Metrics",
    variableName: "Open Invoices",
    dataPoint: "Key Metrics Open Invoices Overview",
    server: "P21",
    tableName: "dbo.invoice_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  },
  {
    id: 122,
    chartGroup: "Key Metrics",
    variableName: "OrdersBackloged",
    dataPoint: "Key Metrics OrdersBackloged Overview",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())"
  },
  {
    id: 123,
    chartGroup: "Key Metrics",
    variableName: "Total Sales Monthly",
    dataPoint: "Key Metrics Total Sales Monthly Overview",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND h.order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  },
  
  // Site Distribution (3 rows)
  {
    id: 124,
    chartGroup: "Site Distribution",
    variableName: "Value",
    dataPoint: "Site Distribution Value Columbus",
    server: "P21",
    tableName: "dbo.item_warehouse",
    sql: "SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE location_id = '1'"
  },
  {
    id: 125,
    chartGroup: "Site Distribution",
    variableName: "Value",
    dataPoint: "Site Distribution Value Addison",
    server: "P21",
    tableName: "dbo.item_warehouse",
    sql: "SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE location_id = '2'"
  },
  {
    id: 126,
    chartGroup: "Site Distribution",
    variableName: "Value",
    dataPoint: "Site Distribution Value Lake City",
    server: "P21",
    tableName: "dbo.item_warehouse",
    sql: "SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE location_id = '3'"
  },
  
  // POR Overview - New Rentals (12 rows)
  {
    id: 127,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Jan",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 1 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 128,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Feb",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 2 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 129,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Mar",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 3 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 130,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Apr",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 4 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 131,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, May",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 5 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 132,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Jun",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 6 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 133,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Jul",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 7 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 134,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Aug",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 8 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 135,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Sep",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 9 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 136,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Oct",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 10 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 137,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Nov",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 11 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  {
    id: 138,
    chartGroup: "POR Overview",
    variableName: "New Rentals",
    dataPoint: "POR Overview New Rentals, Dec",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 12 AND DatePart('yyyy', ContractDate) = DatePart('yyyy', Now())"
  },
  
  // POR Overview - Open Rentals (12 rows)
  {
    id: 139,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Jan",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 1"
  },
  {
    id: 140,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Feb",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 2"
  },
  {
    id: 141,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Mar",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 3"
  },
  {
    id: 142,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Apr",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 4"
  },
  {
    id: 143,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, May",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 5"
  },
  {
    id: 144,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Jun",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 6"
  },
  {
    id: 145,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Jul",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 7"
  },
  {
    id: 146,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Aug",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 8"
  },
  {
    id: 147,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Sep",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 9"
  },
  {
    id: 148,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Oct",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 10"
  },
  {
    id: 149,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Nov",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 11"
  },
  {
    id: 150,
    chartGroup: "POR Overview",
    variableName: "Open Rentals",
    dataPoint: "POR Overview Open Rentals, Dec",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Count(*) as value FROM Contracts WHERE ContractType = 'Rental' AND Status = 'Open' AND DatePart('m', ContractDate) = 12"
  },
  
  // POR Overview - Rental Value (12 rows)
  {
    id: 151,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Jan",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 1"
  },
  {
    id: 152,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Feb",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 2"
  },
  {
    id: 153,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Mar",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 3"
  },
  {
    id: 154,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Apr",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 4"
  },
  {
    id: 155,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, May",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 5"
  },
  {
    id: 156,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Jun",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 6"
  },
  {
    id: 157,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Jul",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 7"
  },
  {
    id: 158,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Aug",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 8"
  },
  {
    id: 159,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Sep",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 9"
  },
  {
    id: 160,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Oct",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 10"
  },
  {
    id: 161,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Nov",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 11"
  },
  {
    id: 162,
    chartGroup: "POR Overview",
    variableName: "Rental Value",
    dataPoint: "POR Overview Rental Value, Dec",
    server: "POR",
    tableName: "Contracts",
    sql: "SELECT Sum(ContractValue) as value FROM Contracts WHERE ContractType = 'Rental' AND DatePart('m', ContractDate) = 12"
  },
  
  // Web Orders (12 rows)
  {
    id: 163,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Jan",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 1 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 164,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Feb",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 2 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 165,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Mar",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 3 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 166,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Apr",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 4 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 167,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, May",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 5 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 168,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Jun",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 6 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 169,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Jul",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 7 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 170,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Aug",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 8 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 171,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Sep",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 9 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 172,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Oct",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 10 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 173,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Nov",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 11 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: 174,
    chartGroup: "Web Orders",
    variableName: "Orders",
    dataPoint: "Web Orders Orders, Dec",
    server: "P21",
    tableName: "dbo.oe_hdr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = 12 AND YEAR(order_date) = YEAR(GETDATE())"
  }
];

// Function to update SQL expressions in the database
async function updateSqlExpressions() {
  console.log('Updating all SQL expressions in the database...');
  
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each SQL expression
    for (const expr of allSqlExpressions) {
      console.log(`Updating SQL expression for ID ${expr.id}: ${expr.dataPoint}`);
      
      await db.run(`
        UPDATE chart_data 
        SET sql_expression = ?, 
            server_name = ?
        WHERE id = ?
      `, [expr.sql, expr.server, expr.id]);
    }
    
    // Create a refresh marker file to trigger a dashboard refresh
    const refreshMarkerPath = path.join(dataDir, 'refresh_required');
    fs.writeFileSync(refreshMarkerPath, new Date().toISOString());
    
    // Create additional cache refresh files to ensure the dashboard picks up changes
    const cacheRefreshPath = path.join(dataDir, 'cache-refresh.txt');
    fs.writeFileSync(cacheRefreshPath, new Date().toISOString());
    
    const forceRefreshPath = path.join(dataDir, 'force_refresh.json');
    const refreshData = {
      timestamp: new Date().toISOString(),
      reason: "Comprehensive SQL update"
    };
    fs.writeFileSync(forceRefreshPath, JSON.stringify(refreshData, null, 2));
    
    // Create a Next.js cache reset marker
    const nextCacheResetPath = path.join(process.cwd(), '.next-cache-reset');
    fs.writeFileSync(nextCacheResetPath, new Date().toISOString());
    
    console.log('Created all cache refresh markers to ensure changes are visible');
    
    // Commit transaction
    await db.run('COMMIT');
    console.log('All SQL expressions updated successfully');
    
    // Close the database connection
    await db.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error updating SQL expressions:', error);
  }
}

// Run the main function
updateSqlExpressions();

