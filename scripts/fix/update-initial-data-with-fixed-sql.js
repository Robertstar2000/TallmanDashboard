// Script to update the initial data with fixed SQL expressions that have been validated
const fs = require('fs');
const path = require('path');

// Define the fixed SQL expressions that have been validated to work
const fixedSqlExpressions = [
  // AR Aging - P21 SQL expressions
  {
    id: "1",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(SUM(amount_due), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = 'Current'"
  },
  {
    id: "2",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(SUM(amount_due), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = '1-30 Days'"
  },
  {
    id: "3",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(SUM(amount_due), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = '31-60 Days'"
  },
  {
    id: "4",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(SUM(amount_due), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = '61-90 Days'"
  },
  {
    id: "5",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(SUM(amount_due), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = 'Over 90 Days'"
  },
  
  // Accounts - P21 SQL expressions (examples for different months)
  {
    id: "6",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM dbo.ap_invoices WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: "7",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(SUM(ar_amount), 0) as value FROM dbo.ar_headers WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())"
  },
  {
    id: "8",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(SUM(ar_amount), 0) as value FROM dbo.ar_headers WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE()) AND DATEDIFF(day, invoice_date, GETDATE()) > 30"
  },
  
  // Customer Metrics - P21 SQL expressions (examples)
  {
    id: "43",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(COUNT(*), 0) as value FROM dbo.customer WITH (NOLOCK) WHERE prospect_flag = 'Y' AND MONTH(created_date) = 1 AND YEAR(created_date) = YEAR(GETDATE())"
  },
  {
    id: "44",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(COUNT(*), 0) as value FROM dbo.customer WITH (NOLOCK) WHERE prospect_flag = 'N' AND MONTH(created_date) = 1 AND YEAR(created_date) = YEAR(GETDATE())"
  },
  
  // Daily Orders - P21 SQL expressions
  {
    id: "67",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(COUNT(*), 0) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  {
    id: "68",
    serverName: "P21",
    sqlExpression: "SELECT ISNULL(COUNT(*), 0) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  
  // POR SQL expressions (examples)
  {
    id: "124",
    serverName: "POR",
    sqlExpression: "SELECT Count(*) as value FROM Inventory WHERE Location = 'Columbus'"
  },
  {
    id: "125",
    serverName: "POR",
    sqlExpression: "SELECT Count(*) as value FROM Inventory WHERE Location = 'Addison'"
  },
  {
    id: "126",
    serverName: "POR",
    sqlExpression: "SELECT Count(*) as value FROM Inventory WHERE Location = 'Lake City'"
  },
  {
    id: "134",
    serverName: "POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "135",
    serverName: "POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "136",
    serverName: "POR",
    sqlExpression: "SELECT Sum(Nz(RentalValue, 0)) as value FROM Rentals WHERE Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())"
  }
];

// Function to update the initial data files
async function updateInitialData() {
  try {
    console.log('Starting to update initial data files with fixed SQL expressions...');
    
    // Get the paths to the data files
    const completeChartDataPath = path.join(__dirname, 'lib', 'db', 'complete-chart-data.ts');
    
    // Read the complete chart data file
    let completeChartData = fs.readFileSync(completeChartDataPath, 'utf8');
    
    // Update each SQL expression
    let updateCount = 0;
    
    for (const fixedSql of fixedSqlExpressions) {
      const { id, serverName, sqlExpression } = fixedSql;
      
      // Create a regex pattern to find the row with the matching ID
      const idPattern = new RegExp(`"id":\\s*"${id}"[^}]*"serverName":\\s*"${serverName}"[^}]*"sqlExpression":\\s*"[^"]*"`, 'g');
      
      // Create the replacement with the fixed SQL
      const replacement = (match) => {
        return match.replace(/"sqlExpression":\s*"[^"]*"/, `"sqlExpression": "${sqlExpression.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      };
      
      // Check if the pattern exists in the file
      if (idPattern.test(completeChartData)) {
        // Reset the regex lastIndex
        idPattern.lastIndex = 0;
        
        // Replace the SQL expression
        const updatedContent = completeChartData.replace(idPattern, replacement);
        
        // Check if anything was actually changed
        if (updatedContent !== completeChartData) {
          completeChartData = updatedContent;
          updateCount++;
          console.log(`Updated SQL expression for row ID ${id} (${serverName})`);
        }
      } else {
        console.log(`Row with ID ${id} and server ${serverName} not found in the data file`);
      }
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(completeChartDataPath, completeChartData, 'utf8');
    
    console.log(`\nUpdated ${updateCount} SQL expressions in the data files`);
    console.log('Update complete!');
  } catch (error) {
    console.error('Error updating initial data:', error);
  }
}

// Run the update function
updateInitialData();
