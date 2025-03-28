const fs = require('fs');
const path = require('path');

// Create reports directory if it doesn't exist
const reportDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir);
}

// Function to log messages to console
function log(message) {
  console.log(message);
}

// Generate a timestamp for the report file
const timestamp = new Date().toISOString().replace(/:/g, '-');
const reportFile = path.join(reportDir, `sql-test-report-${timestamp}.txt`);

// Sample data representing SQL test results
const sampleData = [
  // AR Aging
  {
    chartGroup: 'AR Aging',
    name: 'AR Aging - Current - Amount Due',
    serverName: 'P21',
    success: true,
    isNonZero: true,
    testResult: 12500.75,
    sqlExpression: 'SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = 0'
  },
  {
    chartGroup: 'AR Aging',
    name: 'AR Aging - 30 Days - Amount Due',
    serverName: 'P21',
    success: true,
    isNonZero: true,
    testResult: 8750.25,
    sqlExpression: 'SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = 1'
  },
  
  // Accounts
  {
    chartGroup: 'Accounts',
    name: 'Accounts - January - Payable',
    serverName: 'P21',
    success: true,
    isNonZero: true,
    testResult: 45000.50,
    sqlExpression: 'SELECT SUM(amount_due) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
  },
  {
    chartGroup: 'Accounts',
    name: 'Accounts - January - Receivable',
    serverName: 'P21',
    success: true,
    isNonZero: true,
    testResult: 62500.25,
    sqlExpression: 'SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
  },
  
  // Customer Metrics
  {
    chartGroup: 'Customer Metrics',
    name: 'Customer Metrics - January - New',
    serverName: 'P21',
    success: true,
    isNonZero: true,
    testResult: 15,
    sqlExpression: 'SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(creation_date) = 1 AND YEAR(creation_date) = YEAR(GETDATE())'
  },
  {
    chartGroup: 'Customer Metrics',
    name: 'Customer Metrics - January - Prospects',
    serverName: 'P21',
    success: true,
    isNonZero: true,
    testResult: 25,
    sqlExpression: 'SELECT COUNT(*) as value FROM dbo.prospect WITH (NOLOCK) WHERE MONTH(creation_date) = 1 AND YEAR(creation_date) = YEAR(GETDATE())'
  },
  
  // POR Overview
  {
    chartGroup: 'POR Overview',
    name: 'POR Overview - January - New Rentals',
    serverName: 'POR',
    success: true,
    isNonZero: true,
    testResult: 30,
    sqlExpression: 'SELECT Count(*) as value FROM Rentals WHERE Status = "New" AND Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())'
  },
  {
    chartGroup: 'POR Overview',
    name: 'POR Overview - January - Open Rentals',
    serverName: 'POR',
    success: true,
    isNonZero: true,
    testResult: 45,
    sqlExpression: 'SELECT Count(*) as value FROM Rentals WHERE Status = "Open" AND Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())'
  },
  
  // Key Metrics
  {
    chartGroup: 'Key Metrics',
    name: 'Key Metrics - Total Orders',
    serverName: 'P21',
    success: true,
    isNonZero: true,
    testResult: 1250,
    sqlExpression: 'SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())'
  },
  {
    chartGroup: 'Key Metrics',
    name: 'Key Metrics - Total Revenue',
    serverName: 'P21',
    success: true,
    isNonZero: true,
    testResult: 750000.50,
    sqlExpression: 'SELECT SUM(order_amt) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())'
  }
];

// Function to generate a detailed report
function generateDetailedReport(rows) {
  const reportStream = fs.createWriteStream(reportFile, { flags: 'w' });
  
  reportStream.write(`SQL TEST REPORT - ${new Date().toLocaleString()}\n`);
  reportStream.write(`=================================================\n\n`);
  
  // Group rows by chart group
  const groupedRows = {};
  rows.forEach(row => {
    const chartGroup = row.chartGroup || 'Unknown';
    if (!groupedRows[chartGroup]) {
      groupedRows[chartGroup] = [];
    }
    groupedRows[chartGroup].push(row);
  });
  
  // Write report for each chart group
  Object.keys(groupedRows).sort().forEach(chartGroup => {
    reportStream.write(`CHART GROUP: ${chartGroup}\n`);
    reportStream.write(`-------------------------------------------------\n`);
    
    groupedRows[chartGroup].forEach(row => {
      const status = row.success ? (row.isNonZero ? 'SUCCESS (NON-ZERO)' : 'SUCCESS (ZERO)') : 'FAILED';
      const value = row.testResult ? JSON.stringify(row.testResult) : 'N/A';
      
      reportStream.write(`Row: ${row.name}\n`);
      reportStream.write(`Server: ${row.serverName}\n`);
      reportStream.write(`Status: ${status}\n`);
      reportStream.write(`Value: ${value}\n`);
      reportStream.write(`SQL: ${row.sqlExpression}\n`);
      if (row.error) {
        reportStream.write(`Error: ${row.error}\n`);
      }
      reportStream.write(`-------------------------------------------------\n`);
    });
    
    reportStream.write(`\n`);
  });
  
  // Write summary statistics
  const successCount = rows.filter(r => r.success).length;
  const failureCount = rows.filter(r => !r.success).length;
  const nonZeroCount = rows.filter(r => r.isNonZero).length;
  const zeroCount = rows.filter(r => r.success && !r.isNonZero).length;
  
  reportStream.write(`SUMMARY STATISTICS\n`);
  reportStream.write(`=================================================\n`);
  reportStream.write(`Total rows processed: ${rows.length}\n`);
  reportStream.write(`Successful queries: ${successCount} (${Math.round(successCount / rows.length * 100)}%)\n`);
  reportStream.write(`Failed queries: ${failureCount} (${Math.round(failureCount / rows.length * 100)}%)\n`);
  reportStream.write(`Non-zero results: ${nonZeroCount} (${Math.round(nonZeroCount / rows.length * 100)}%)\n`);
  reportStream.write(`Zero results: ${zeroCount} (${Math.round(zeroCount / rows.length * 100)}%)\n`);
  
  reportStream.end();
  
  log(`Detailed report saved to: ${reportFile}`);
  return reportFile;
}

// Function to generate a simple one-line-per-row report
function generateSimpleReport(rows) {
  const simpleReportFile = path.join(reportDir, `sql-test-simple-report-${timestamp}.txt`);
  const reportStream = fs.createWriteStream(simpleReportFile, { flags: 'w' });
  
  // Write header
  reportStream.write(`SQL TEST SIMPLE REPORT - ${new Date().toLocaleString()}\n`);
  reportStream.write(`=================================================\n\n`);
  reportStream.write(`FORMAT: [Chart Group] | [Row Name] | [Status] | [Value]\n\n`);
  
  // Write each row on a single line
  rows.forEach(row => {
    const chartGroup = row.chartGroup || 'Unknown';
    const status = row.success ? (row.isNonZero ? 'SUCCESS (NON-ZERO)' : 'SUCCESS (ZERO)') : 'FAILED';
    const value = row.testResult ? JSON.stringify(row.testResult) : 'N/A';
    
    reportStream.write(`${chartGroup} | ${row.name} | ${status} | ${value}\n`);
  });
  
  // Write summary
  reportStream.write(`\n=================================================\n`);
  const successCount = rows.filter(r => r.success).length;
  const failureCount = rows.filter(r => !r.success).length;
  const nonZeroCount = rows.filter(r => r.isNonZero).length;
  const zeroCount = rows.filter(r => r.success && !r.isNonZero).length;
  
  reportStream.write(`Total: ${rows.length} | Success: ${successCount} | Failed: ${failureCount} | Non-Zero: ${nonZeroCount} | Zero: ${zeroCount}\n`);
  
  reportStream.end();
  
  log(`Simple report saved to: ${simpleReportFile}`);
  return simpleReportFile;
}

// Generate the reports
const detailedReportFile = generateDetailedReport(sampleData);
const simpleReportFile = generateSimpleReport(sampleData);

log('\nReport generation complete!');
log(`Detailed report saved at: ${detailedReportFile}`);
log(`Simple report saved at: ${simpleReportFile}`);
