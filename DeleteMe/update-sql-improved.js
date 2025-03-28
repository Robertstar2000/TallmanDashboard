const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const initialDataPath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
console.log('Reading initial-data.ts...');
let fileContent = fs.readFileSync(initialDataPath, 'utf8');

// Define SQL expressions for each chart group and variable
const sqlExpressions = {
  'AR Aging': {
    'Current': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE DATEDIFF(day, DUE_DATE, GETDATE()) <= 0",
    '1-30 Days': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE DATEDIFF(day, DUE_DATE, GETDATE()) BETWEEN 1 AND 30",
    '31-60 Days': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE DATEDIFF(day, DUE_DATE, GETDATE()) BETWEEN 31 AND 60",
    '61-90 Days': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE DATEDIFF(day, DUE_DATE, GETDATE()) BETWEEN 61 AND 90",
    '90+ Days': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE DATEDIFF(day, DUE_DATE, GETDATE()) > 90"
  },
  'Accounts': {
    'Payable (January)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 1 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (February)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 2 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (March)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 3 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (April)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 4 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (May)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 5 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (June)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 6 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (July)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 7 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (August)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 8 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (September)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 9 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (October)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 10 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (November)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 11 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Payable (December)': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 12 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (January)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 1 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (February)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 2 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (March)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 3 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (April)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 4 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (May)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 5 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (June)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 6 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (July)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 7 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (August)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 8 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (September)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 9 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (October)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 10 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (November)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 11 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Receivable (December)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 12 AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'Overdue (January)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 1 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (February)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 2 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (March)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 3 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (April)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 4 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (May)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 5 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (June)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 6 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (July)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 7 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (August)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 8 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (September)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 9 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (October)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 10 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (November)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 11 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
    'Overdue (December)': "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = 12 AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0"
  },
  'Customer Metrics': {
    'New': "SELECT COUNT(*) as value FROM CUSTOMER_MST WHERE DATEDIFF(day, CREATED_DATE, GETDATE()) <= 30",
    'Prospects': "SELECT COUNT(*) as value FROM CUSTOMER_MST WHERE PROSPECT_FLAG = 'Y'"
  },
  'Daily Orders': {
    'Orders': "SELECT COUNT(*) as value FROM OE_HDR WHERE DATEDIFF(day, ORDER_DATE, GETDATE()) <= 7"
  },
  'Historical Data': {
    'P21': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM INVOICE_HDR WHERE MONTH(INVOICE_DATE) = MONTH(GETDATE()) AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
    'POR': "SELECT COALESCE(SUM(RENTAL_VALUE), 0) as value FROM RENTAL_ITEMS WHERE MONTH(RENTAL_DATE) = MONTH(GETDATE()) AND YEAR(RENTAL_DATE) = YEAR(GETDATE())",
    'Total': "SELECT (SELECT COALESCE(SUM(INVOICE_AMT), 0) FROM INVOICE_HDR WHERE MONTH(INVOICE_DATE) = MONTH(GETDATE()) AND YEAR(INVOICE_DATE) = YEAR(GETDATE())) + (SELECT COALESCE(SUM(RENTAL_VALUE), 0) FROM RENTAL_ITEMS WHERE MONTH(RENTAL_DATE) = MONTH(GETDATE()) AND YEAR(RENTAL_DATE) = YEAR(GETDATE())) as value"
  },
  'Inventory': {
    'In Stock': "SELECT COALESCE(SUM(QTY_ON_HAND), 0) as value FROM INV_MAST im JOIN PRODUCT_LINE pl ON im.PROD_LINE = pl.PROD_LINE WHERE pl.DESCRIPTION LIKE '%Plumbing%'",
    'On Order': "SELECT COALESCE(SUM(QTY_ON_ORDER), 0) as value FROM INV_MAST im JOIN PRODUCT_LINE pl ON im.PROD_LINE = pl.PROD_LINE WHERE pl.DESCRIPTION LIKE '%Plumbing%'"
  },
  'Key Metrics': {
    'Total Orders': "SELECT COUNT(*) as value FROM OE_HDR WHERE DATEDIFF(day, ORDER_DATE, GETDATE()) <= 30",
    'Gross Revenue': "SELECT COALESCE(SUM(INVOICE_AMT), 0) as value FROM INVOICE_HDR WHERE DATEDIFF(day, INVOICE_DATE, GETDATE()) <= 30",
    'Net Profit': "SELECT COALESCE(SUM(INVOICE_AMT * 0.2), 0) as value FROM INVOICE_HDR WHERE DATEDIFF(day, INVOICE_DATE, GETDATE()) <= 30",
    'Average Order Value': "SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE COALESCE(SUM(INVOICE_AMT), 0) / COUNT(*) END as value FROM INVOICE_HDR WHERE DATEDIFF(day, INVOICE_DATE, GETDATE()) <= 30",
    'Return Rate': "SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE (SELECT COUNT(*) FROM INVOICE_HDR WHERE INVOICE_AMT < 0 AND DATEDIFF(day, INVOICE_DATE, GETDATE()) <= 30) * 100.0 / COUNT(*) END as value FROM INVOICE_HDR WHERE DATEDIFF(day, INVOICE_DATE, GETDATE()) <= 30",
    'Inventory Value': "SELECT COALESCE(SUM(QTY_ON_HAND * UNIT_COST), 0) as value FROM INV_MAST",
    'Backorder Value': "SELECT COALESCE(SUM(QTY_ON_BACKORDER * UNIT_COST), 0) as value FROM INV_MAST"
  },
  'Site Distribution': {
    'Columbus': "SELECT COALESCE(SUM(QTY_ON_HAND), 0) as value FROM INV_MAST im JOIN LOCATION_MST lm ON im.LOCATION_ID = lm.LOC_ID WHERE lm.LOC_NAME = 'Columbus'",
    'Addison': "SELECT COALESCE(SUM(QTY_ON_HAND), 0) as value FROM INV_MAST im JOIN LOCATION_MST lm ON im.LOCATION_ID = lm.LOC_ID WHERE lm.LOC_NAME = 'Addison'",
    'Lake City': "SELECT COALESCE(SUM(QTY_ON_HAND), 0) as value FROM INV_MAST im JOIN LOCATION_MST lm ON im.LOCATION_ID = lm.LOC_ID WHERE lm.LOC_NAME = 'Lake City'"
  },
  'POR Overview': {
    'New Rentals': "SELECT COUNT(*) as value FROM RENTAL_ITEMS WHERE DATEDIFF(day, RENTAL_DATE, GETDATE()) <= 30",
    'Open Rentals': "SELECT COUNT(*) as value FROM RENTAL_ITEMS WHERE RETURN_DATE IS NULL",
    'Rental Value': "SELECT COALESCE(SUM(RENTAL_VALUE), 0) as value FROM RENTAL_ITEMS WHERE DATEDIFF(day, RENTAL_DATE, GETDATE()) <= 30"
  },
  'Web Orders': {
    'Orders': "SELECT COUNT(*) as value FROM OE_HDR WHERE ORDER_SOURCE = 'WEB' AND DATEDIFF(day, ORDER_DATE, GETDATE()) <= 30"
  }
};

// Function to update SQL expressions for a specific chart group
function updateChartGroup(chartGroup) {
  console.log(`\nProcessing chart group: ${chartGroup}`);
  let updatedCount = 0;
  
  // Split the file content into lines
  const lines = fileContent.split('\n');
  
  // Process the file line by line
  for (let i = 0; i < lines.length; i++) {
    // Check if this line contains the chart group
    if (lines[i].includes(`chartGroup: '${chartGroup}'`) || lines[i].includes(`chartGroup: "${chartGroup}"`)) {
      // Find the variable name in the next few lines
      let variableName = null;
      let j = i + 1;
      while (j < i + 10 && j < lines.length) {
        if (lines[j].includes('variableName:')) {
          const match = lines[j].match(/variableName:\s*['"]([^'"]+)['"]/);
          if (match) {
            variableName = match[1];
            break;
          }
        }
        j++;
      }
      
      if (variableName) {
        // Find the productionSqlExpression line
        let sqlLineIndex = null;
        j = i + 1;
        while (j < i + 20 && j < lines.length) {
          if (lines[j].includes('productionSqlExpression:')) {
            sqlLineIndex = j;
            break;
          }
          j++;
        }
        
        if (sqlLineIndex !== null) {
          // Determine the SQL expression to use
          let newSqlExpression = null;
          
          // For chart groups with exact variable names
          if (sqlExpressions[chartGroup][variableName]) {
            newSqlExpression = sqlExpressions[chartGroup][variableName];
          } 
          // For chart groups with variable names that include department/month
          else {
            // Extract the base variable name (before any parentheses)
            const baseVariableName = variableName.split(' (')[0];
            if (sqlExpressions[chartGroup][baseVariableName]) {
              newSqlExpression = sqlExpressions[chartGroup][baseVariableName];
            }
          }
          
          if (newSqlExpression) {
            // Determine the quote style used in the original line
            let quoteStyle = '"';
            if (lines[sqlLineIndex].includes("'")) {
              quoteStyle = "'";
            } else if (lines[sqlLineIndex].includes('`')) {
              quoteStyle = '`';
            }
            
            // Create the new line with the updated SQL expression
            const indentation = lines[sqlLineIndex].match(/^\s*/)[0];
            lines[sqlLineIndex] = `${indentation}productionSqlExpression: ${quoteStyle}${newSqlExpression}${quoteStyle},`;
            
            console.log(`  Updated row for '${variableName}'`);
            updatedCount++;
          } else {
            console.log(`  Could not find SQL expression for '${variableName}'`);
          }
        }
      }
    }
  }
  
  // Rejoin the lines
  fileContent = lines.join('\n');
  
  console.log(`Updated ${updatedCount} rows in ${chartGroup}`);
  return updatedCount;
}

// Update SQL expressions for each chart group
let totalUpdatedCount = 0;

totalUpdatedCount += updateChartGroup('AR Aging');
totalUpdatedCount += updateChartGroup('Accounts');
totalUpdatedCount += updateChartGroup('Customer Metrics');
totalUpdatedCount += updateChartGroup('Daily Orders');
totalUpdatedCount += updateChartGroup('Historical Data');
totalUpdatedCount += updateChartGroup('Inventory');
totalUpdatedCount += updateChartGroup('Key Metrics');
totalUpdatedCount += updateChartGroup('Site Distribution');
totalUpdatedCount += updateChartGroup('POR Overview');
totalUpdatedCount += updateChartGroup('Web Orders');

// Write the updated content back to the file
fs.writeFileSync(initialDataPath, fileContent, 'utf8');

console.log(`\nSuccessfully updated ${totalUpdatedCount} rows in initial-data.ts`);
