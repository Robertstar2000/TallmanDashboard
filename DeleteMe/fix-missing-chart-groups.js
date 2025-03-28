/**
 * Script to fix missing chart groups and ensure all have the correct number of rows
 * This script:
 * 1. Ensures all chart groups have the correct number of rows
 * 2. Fixes case sensitivity issues with chart group names
 * 3. Creates proper SQL expressions for both test and production environments
 */

const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Create a backup of the current file
const backupPath = `${filePath}.backup-chart-fix-${Date.now()}`;
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Extract the initialSpreadsheetData array
const dataStartIndex = content.indexOf('export const initialSpreadsheetData');
const dataEndIndex = content.indexOf('// Chart group settings');

if (dataStartIndex === -1 || dataEndIndex === -1) {
  console.error('Could not find the initialSpreadsheetData array in the file');
  process.exit(1);
}

// Parse the data section
let dataSection = content.substring(dataStartIndex, dataEndIndex);

// Define the expected chart groups and their row counts
const expectedChartGroups = {
  'Key Metrics': 7,
  'Site Distribution': 3,
  'Accounts': 36,
  'Customer Metrics': 24,
  'Historical Data': 36,
  'Inventory': 8,
  'POR Overview': 36,
  'Daily Orders': 7,
  'Web Orders': 12,
  'AR Aging': 5
};

// Fix case sensitivity issues in chart group names
function fixChartGroupNames(dataSection) {
  // Map of lowercase chart group names to their correct case
  const chartGroupCaseMap = {
    'key metrics': 'Key Metrics',
    'site distribution': 'Site Distribution',
    'accounts': 'Accounts',
    'customer metrics': 'Customer Metrics',
    'historical data': 'Historical Data',
    'inventory': 'Inventory',
    'por overview': 'POR Overview',
    'daily orders': 'Daily Orders',
    'web orders': 'Web Orders',
    'ar aging': 'AR Aging'
  };
  
  // Fix chart group names
  Object.entries(chartGroupCaseMap).forEach(([lowercase, correct]) => {
    const regex = new RegExp(`chartGroup:\\s*["']${lowercase}["']`, 'gi');
    dataSection = dataSection.replace(regex, `chartGroup: "${correct}"`);
  });
  
  return dataSection;
}

// Count the number of rows for each chart group
function countChartGroupRows(dataSection) {
  const chartGroups = {};
  const rows = dataSection.match(/chartGroup:\s*["']([^"']+)["']/g) || [];
  
  rows.forEach(match => {
    const chartGroup = match.match(/["']([^"']+)["']/)[1];
    chartGroups[chartGroup] = (chartGroups[chartGroup] || 0) + 1;
  });
  
  return chartGroups;
}

// Define SQL expressions for each chart group
const sqlExpressions = {
  // POR Overview
  'POR Overview': {
    'New Rentals': {
      test: "SELECT COUNT(*) as value FROM por_rentals WHERE status = 'new' AND strftime('%m', created_at) = ? AND strftime('%Y', created_at) = strftime('%Y', 'now')",
      p21: null, // Not applicable for P21
      por: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = ? AND Year(CreatedDate) = Year(Date())"
    },
    'Open Rentals': {
      test: "SELECT COUNT(*) as value FROM por_rentals WHERE status = 'open' AND strftime('%m', created_at) = ? AND strftime('%Y', created_at) = strftime('%Y', 'now')",
      p21: null, // Not applicable for P21
      por: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = ? AND Year(CreatedDate) = Year(Date())"
    },
    'Rental Value': {
      test: "SELECT SUM(value) as value FROM por_rentals WHERE strftime('%m', created_at) = ? AND strftime('%Y', created_at) = strftime('%Y', 'now')",
      p21: null, // Not applicable for P21
      por: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = ? AND Year(CreatedDate) = Year(Date())"
    }
  },
  
  // Web Orders
  'Web Orders': {
    'Orders': {
      test: "SELECT COUNT(*) as value FROM orders WHERE source = 'web' AND strftime('%m', order_date) = ? AND strftime('%Y', order_date) = strftime('%Y', 'now')",
      p21: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE ORDER_SOURCE = 'WEB' AND MONTH(order_date) = ? AND YEAR(order_date) = YEAR(GETDATE())",
      por: "SELECT Count(*) as value FROM PurchaseOrder WHERE OrderSource = 'Web' AND Month(OrderDate) = ? AND Year(OrderDate) = Year(Date())"
    }
  },
  
  // AR Aging
  'AR Aging': {
    'Current': {
      test: "SELECT SUM(amount) as value FROM ar_aging WHERE days_overdue = 0",
      p21: "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, DUE_DATE, GETDATE()) <= 0",
      por: "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) <= 0"
    },
    '1-30 Days': {
      test: "SELECT SUM(amount) as value FROM ar_aging WHERE days_overdue BETWEEN 1 AND 30",
      p21: "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, DUE_DATE, GETDATE()) BETWEEN 1 AND 30",
      por: "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 1 AND 30"
    },
    '31-60 Days': {
      test: "SELECT SUM(amount) as value FROM ar_aging WHERE days_overdue BETWEEN 31 AND 60",
      p21: "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, DUE_DATE, GETDATE()) BETWEEN 31 AND 60",
      por: "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 31 AND 60"
    },
    '61-90 Days': {
      test: "SELECT SUM(amount) as value FROM ar_aging WHERE days_overdue BETWEEN 61 AND 90",
      p21: "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, DUE_DATE, GETDATE()) BETWEEN 61 AND 90",
      por: "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 61 AND 90"
    },
    '90+ Days': {
      test: "SELECT SUM(amount) as value FROM ar_aging WHERE days_overdue > 90",
      p21: "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, DUE_DATE, GETDATE()) > 90",
      por: "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) > 90"
    }
  }
};

// Generate template rows for missing chart groups
function generateTemplateRows(chartGroup, currentCount, expectedCount) {
  const newRows = [];
  const lastId = getLastId(dataSection);
  let nextId = parseInt(lastId) + 1;
  
  // Define variables for each chart group
  const variables = {
    'POR Overview': ['New Rentals', 'Open Rentals', 'Rental Value'],
    'Web Orders': ['Orders'],
    'AR Aging': ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days']
  };
  
  // Define server names for each chart group
  const serverNames = {
    'POR Overview': 'POR',
    'Web Orders': 'P21',
    'AR Aging': 'P21'
  };
  
  if (!variables[chartGroup]) {
    console.error(`No variables defined for chart group "${chartGroup}"`);
    return newRows;
  }
  
  // For chart groups with monthly data
  if (chartGroup === 'POR Overview' || chartGroup === 'Web Orders') {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNumbers = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    variables[chartGroup].forEach(variable => {
      months.forEach((month, index) => {
        // Skip if we already have enough rows
        if (newRows.length + currentCount >= expectedCount) return;
        
        const monthNumber = monthNumbers[index];
        const serverName = serverNames[chartGroup];
        const testSql = sqlExpressions[chartGroup][variable].test.replace('?', monthNumber);
        let productionSql = '';
        
        if (serverName === 'P21' && sqlExpressions[chartGroup][variable].p21) {
          productionSql = sqlExpressions[chartGroup][variable].p21.replace('?', monthNumber);
        } else if (serverName === 'POR' && sqlExpressions[chartGroup][variable].por) {
          productionSql = sqlExpressions[chartGroup][variable].por.replace('?', monthNumber);
        } else {
          productionSql = `SELECT 0 as value -- Not applicable for ${serverName}`;
        }
        
        newRows.push(`    {
      id: '${nextId++}',
      name: "${chartGroup} - ${variable} - ${month}",
      chartName: "${chartGroup}",
      variableName: "${variable}",
      serverName: '${serverName}',
      value: "0",
      chartGroup: "${chartGroup}",
      calculation: "COUNT(*)",
      sqlExpression: "${testSql}",
      productionSqlExpression: "${productionSql}",
      tableName: "${serverName === 'POR' ? 'Rentals' : 'oe_hdr'}"
    }`);
      });
    });
  } 
  // For AR Aging which doesn't have monthly data
  else if (chartGroup === 'AR Aging') {
    variables[chartGroup].forEach(variable => {
      // Skip if we already have enough rows
      if (newRows.length + currentCount >= expectedCount) return;
      
      const serverName = serverNames[chartGroup];
      const testSql = sqlExpressions[chartGroup][variable].test;
      let productionSql = '';
      
      if (serverName === 'P21' && sqlExpressions[chartGroup][variable].p21) {
        productionSql = sqlExpressions[chartGroup][variable].p21;
      } else if (serverName === 'POR' && sqlExpressions[chartGroup][variable].por) {
        productionSql = sqlExpressions[chartGroup][variable].por;
      } else {
        productionSql = `SELECT 0 as value -- Not applicable for ${serverName}`;
      }
      
      newRows.push(`    {
      id: '${nextId++}',
      name: "${chartGroup} - ${variable}",
      chartName: "${chartGroup}",
      variableName: "${variable}",
      serverName: '${serverName}',
      value: "0",
      chartGroup: "${chartGroup}",
      calculation: "SUM(amount)",
      sqlExpression: "${testSql}",
      productionSqlExpression: "${productionSql}",
      tableName: "ar_open_items"
    }`);
    });
  }
  
  return newRows;
}

// Get the last ID used in the data section
function getLastId(dataSection) {
  const idMatches = dataSection.match(/id:\s*['"](\d+)['"]/g) || [];
  if (idMatches.length === 0) return '0';
  
  const lastIdMatch = idMatches[idMatches.length - 1];
  const lastId = lastIdMatch.match(/['"](\d+)['"]/)[1];
  return lastId;
}

// Fix the Web Orders count (should be 12, not 24)
function fixWebOrdersCount(dataSection) {
  // Count current Web Orders rows
  const webOrdersRows = (dataSection.match(/chartGroup:\s*["']Web Orders["']/g) || []).length;
  
  if (webOrdersRows > 12) {
    console.log(`Fixing Web Orders count: ${webOrdersRows} -> 12`);
    
    // Extract all rows
    const rowRegex = /{\s*id:\s*['"]([^'"]+)['"]\s*,[\s\S]*?}/g;
    const rows = [];
    let match;
    
    while ((match = rowRegex.exec(dataSection)) !== null) {
      const row = match[0];
      const chartGroupMatch = row.match(/chartGroup:\s*["']([^"']+)["']/);
      const chartGroup = chartGroupMatch ? chartGroupMatch[1] : '';
      
      if (chartGroup === 'Web Orders') {
        const variableNameMatch = row.match(/variableName:\s*["']([^"']+)["']/);
        const variableName = variableNameMatch ? variableNameMatch[1] : '';
        
        // Keep only the first occurrence of each month
        if (!rows.some(r => r.chartGroup === 'Web Orders' && r.variableName === variableName)) {
          rows.push({ row, chartGroup, variableName });
        }
      } else {
        rows.push({ row, chartGroup });
      }
    }
    
    // Rebuild the data section with only the first 12 Web Orders rows
    let newDataSection = dataSection.substring(0, dataSection.indexOf('[') + 1);
    rows.forEach((row, index) => {
      newDataSection += row.row;
      if (index < rows.length - 1) {
        newDataSection += ',\n';
      }
    });
    newDataSection += '\n];\n';
    
    return newDataSection;
  }
  
  return dataSection;
}

// Fix chart group names
dataSection = fixChartGroupNames(dataSection);

// Fix Web Orders count
dataSection = fixWebOrdersCount(dataSection);

// Count current rows for each chart group
const currentCounts = countChartGroupRows(dataSection);
console.log('Current chart group counts:');
Object.entries(currentCounts).forEach(([group, count]) => {
  console.log(`${group}: ${count} rows`);
});

// Add missing rows for each chart group
let missingRowsAdded = false;
Object.entries(expectedChartGroups).forEach(([chartGroup, expectedCount]) => {
  const currentCount = currentCounts[chartGroup] || 0;
  
  if (currentCount < expectedCount) {
    console.log(`Adding ${expectedCount - currentCount} rows for chart group "${chartGroup}"`);
    
    const newRows = generateTemplateRows(chartGroup, currentCount, expectedCount);
    if (newRows.length > 0) {
      // Find the closing bracket of the array
      const arrayEndIndex = dataSection.lastIndexOf('];');
      if (arrayEndIndex !== -1) {
        // Insert the new rows before the closing bracket
        dataSection = dataSection.substring(0, arrayEndIndex) + 
                     (dataSection[arrayEndIndex - 1] === '}' ? ',\n' : '') +
                     newRows.join(',\n') + 
                     dataSection.substring(arrayEndIndex);
        missingRowsAdded = true;
      }
    }
  }
});

if (missingRowsAdded) {
  // Replace the data section in the content
  const updatedContent = content.substring(0, dataStartIndex) + dataSection + content.substring(dataEndIndex);
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log('Added missing rows to initial-data.ts');
  
  // Count the updated rows for each chart group
  const updatedCounts = countChartGroupRows(dataSection);
  console.log('\nUpdated chart group counts:');
  Object.entries(updatedCounts).forEach(([group, count]) => {
    console.log(`${group}: ${count} rows`);
  });
  
  // Verify that all chart groups have the expected number of rows
  console.log('\nVerifying chart group row counts:');
  let allCorrect = true;
  Object.entries(expectedChartGroups).forEach(([group, expectedCount]) => {
    const actualCount = updatedCounts[group] || 0;
    const isCorrect = actualCount === expectedCount;
    console.log(`${group}: ${actualCount}/${expectedCount} rows ${isCorrect ? '✓' : '✗'}`);
    if (!isCorrect) allCorrect = false;
  });
  
  if (allCorrect) {
    console.log('\n✅ All chart groups have the correct number of rows');
  } else {
    console.log('\n⚠️ Some chart groups still do not have the expected number of rows');
  }
} else {
  console.log('No missing rows added to initial-data.ts');
}
