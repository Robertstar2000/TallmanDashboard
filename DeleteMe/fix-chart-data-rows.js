// Script to add missing rows to the chart_data table
// This ensures each chart has the correct number of rows for each variable

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Connect to the database
const dbPath = path.join(process.cwd(), 'tallman.db');
console.log(`Connecting to database at: ${dbPath}`);
const db = new Database(dbPath);

// Define the chart structure requirements
const chartRequirements = {
  'Key Metrics': {
    variables: ['Total Orders', 'Revenue', 'Average Order Value', 'Customer Satisfaction', 'Inventory Turnover', 'On-Time Delivery', 'Return Rate'],
    count: 7 // 7 separate metrics
  },
  'Historical Data': {
    variables: ['P21', 'POR', 'Total'],
    months: 12, // 3 variables for 12 months = 36 rows
    count: 36
  },
  'Accounts': {
    variables: ['Payable', 'Receivable', 'Overdue'],
    months: 12, // 3 variables for 12 months = 36 rows
    count: 36
  },
  'Customer Metrics': {
    variables: ['New Customers', 'Prospects'],
    months: 12, // 2 variables for 12 months = 24 rows
    count: 24
  },
  'Inventory': {
    variables: ['In Stock', 'On Order'],
    departments: ['100', '101', '102', '107'], // 2 variables for 4 departments = 8 rows
    count: 8
  },
  'POR Overview': {
    variables: ['New Rentals', 'Open Rentals', 'Rental Value'],
    months: 12, // 3 variables for 12 months = 36 rows
    count: 36
  },
  'Site Distribution': {
    variables: ['Columbus Inventory', 'Addison Inventory', 'Lake City Inventory'],
    count: 3 // 1 value for 3 locations
  },
  'AR Aging': {
    variables: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
    count: 5 // 5 aging buckets
  },
  'Daily Orders': {
    variables: ['Orders'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], // 1 variable for 7 days = 7 rows
    count: 7
  },
  'Web Orders': {
    variables: ['Orders', 'Revenue'],
    months: 12, // 2 variables for 12 months = 24 rows
    count: 24
  }
};

// Month names for reference
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Get current chart data
const currentChartData = db.prepare(`
  SELECT 
    id,
    chart_name,
    chart_group,
    variable_name,
    server_name,
    db_table_name,
    sql_expression,
    production_sql_expression,
    value,
    transformer,
    last_updated
  FROM chart_data
`).all();

console.log(`Found ${currentChartData.length} existing rows in chart_data table`);

// Group by chart_group
const dataByGroup = {};
currentChartData.forEach(row => {
  const group = row.chart_group || row.chart_name || 'Unknown';
  if (!dataByGroup[group]) {
    dataByGroup[group] = [];
  }
  dataByGroup[group].push(row);
});

// Log current counts
console.log('\nCurrent row counts by chart group:');
Object.keys(dataByGroup).forEach(group => {
  console.log(`- ${group}: ${dataByGroup[group].length} rows`);
});

// Prepare statement for inserting new rows
const insertStmt = db.prepare(`
  INSERT INTO chart_data (
    chart_name,
    chart_group,
    variable_name,
    server_name,
    db_table_name,
    sql_expression,
    production_sql_expression,
    value,
    transformer,
    last_updated
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

// Begin transaction
const transaction = db.transaction(() => {
  // Process each chart group
  Object.keys(chartRequirements).forEach(chartGroup => {
    const requirement = chartRequirements[chartGroup];
    const existingRows = dataByGroup[chartGroup] || [];
    
    console.log(`\nProcessing ${chartGroup}:`);
    console.log(`- Required: ${requirement.count} rows`);
    console.log(`- Existing: ${existingRows.length} rows`);
    
    // Skip if we already have enough rows
    if (existingRows.length >= requirement.count) {
      console.log(`- Skipping: Already has enough rows`);
      return;
    }
    
    // Determine what rows we need to add
    const rowsToAdd = [];
    
    if (chartGroup === 'Key Metrics') {
      // For Key Metrics, ensure we have all 7 metrics
      const existingVars = new Set(existingRows.map(row => row.variable_name));
      requirement.variables.forEach(varName => {
        if (!existingVars.has(varName)) {
          rowsToAdd.push({
            chartName: chartGroup,
            chartGroup: chartGroup,
            variableName: varName,
            serverName: 'P21',
            tableName: 'metrics',
            sqlExpression: `SELECT COUNT(*) FROM orders WHERE status = 'completed'`,
            productionSqlExpression: `SELECT COUNT(*) FROM orders WHERE status = 'completed'`,
            value: '0',
            transformer: ''
          });
        }
      });
    } 
    else if (chartGroup === 'Historical Data') {
      // For Historical Data, ensure we have 3 variables for 12 months
      const existingCombos = new Set();
      existingRows.forEach(row => {
        // Extract month from variable name or use a default
        let month = 'Unknown';
        for (const m of months) {
          if (row.variable_name && row.variable_name.includes(m)) {
            month = m;
            break;
          }
        }
        existingCombos.add(`${month}-${row.variable_name}`);
      });
      
      // Add missing combinations
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        requirement.variables.forEach(varName => {
          const combo = `${month}-${varName}`;
          if (!existingCombos.has(combo)) {
            rowsToAdd.push({
              chartName: chartGroup,
              chartGroup: chartGroup,
              variableName: `${month} ${varName}`,
              serverName: varName === 'P21' ? 'P21' : (varName === 'POR' ? 'POR' : 'P21'),
              tableName: 'historical_data',
              sqlExpression: `SELECT COUNT(*) FROM orders WHERE MONTH(order_date) = ${i+1}`,
              productionSqlExpression: `SELECT COUNT(*) FROM orders WHERE MONTH(order_date) = ${i+1}`,
              value: '0',
              transformer: ''
            });
          }
        });
      }
    }
    else if (chartGroup === 'Accounts') {
      // For Accounts, ensure we have 3 variables for 12 months
      const existingCombos = new Set();
      existingRows.forEach(row => {
        // Extract month from variable name or use a default
        let month = 'Unknown';
        for (const m of months) {
          if (row.variable_name && row.variable_name.includes(m)) {
            month = m;
            break;
          }
        }
        existingCombos.add(`${month}-${row.variable_name}`);
      });
      
      // Add missing combinations
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        requirement.variables.forEach(varName => {
          const combo = `${month}-${varName}`;
          if (!existingCombos.has(combo)) {
            rowsToAdd.push({
              chartName: chartGroup,
              chartGroup: chartGroup,
              variableName: `${month} ${varName}`,
              serverName: 'P21',
              tableName: 'accounts',
              sqlExpression: `SELECT SUM(amount) FROM ${varName.toLowerCase()} WHERE MONTH(date) = ${i+1}`,
              productionSqlExpression: `SELECT SUM(amount) FROM ${varName.toLowerCase()} WHERE MONTH(date) = ${i+1}`,
              value: '0',
              transformer: ''
            });
          }
        });
      }
    }
    else if (chartGroup === 'Customer Metrics') {
      // For Customer Metrics, ensure we have 2 variables for 12 months
      const existingCombos = new Set();
      existingRows.forEach(row => {
        // Extract month from variable name or use a default
        let month = 'Unknown';
        for (const m of months) {
          if (row.variable_name && row.variable_name.includes(m)) {
            month = m;
            break;
          }
        }
        existingCombos.add(`${month}-${row.variable_name}`);
      });
      
      // Add missing combinations
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        requirement.variables.forEach(varName => {
          const combo = `${month}-${varName}`;
          if (!existingCombos.has(combo)) {
            rowsToAdd.push({
              chartName: chartGroup,
              chartGroup: chartGroup,
              variableName: `${month} ${varName}`,
              serverName: 'P21',
              tableName: 'customers',
              sqlExpression: `SELECT COUNT(*) FROM customers WHERE MONTH(created_date) = ${i+1} AND type = '${varName === 'New Customers' ? 'new' : 'prospect'}'`,
              productionSqlExpression: `SELECT COUNT(*) FROM customers WHERE MONTH(created_date) = ${i+1} AND type = '${varName === 'New Customers' ? 'new' : 'prospect'}'`,
              value: '0',
              transformer: ''
            });
          }
        });
      }
    }
    else if (chartGroup === 'Inventory') {
      // For Inventory, ensure we have 2 variables for 4 departments
      const existingCombos = new Set();
      existingRows.forEach(row => {
        // Extract department from variable name or use a default
        let dept = 'Unknown';
        for (const d of requirement.departments) {
          if (row.variable_name && row.variable_name.includes(d)) {
            dept = d;
            break;
          }
        }
        existingCombos.add(`${dept}-${row.variable_name}`);
      });
      
      // Add missing combinations
      requirement.departments.forEach(dept => {
        requirement.variables.forEach(varName => {
          const combo = `${dept}-${varName}`;
          if (!existingCombos.has(combo)) {
            rowsToAdd.push({
              chartName: chartGroup,
              chartGroup: chartGroup,
              variableName: `${dept} ${varName}`,
              serverName: 'P21',
              tableName: 'inventory',
              sqlExpression: `SELECT COUNT(*) FROM inventory WHERE department = '${dept}' AND status = '${varName === 'In Stock' ? 'in_stock' : 'on_order'}'`,
              productionSqlExpression: `SELECT COUNT(*) FROM inventory WHERE department = '${dept}' AND status = '${varName === 'In Stock' ? 'in_stock' : 'on_order'}'`,
              value: '0',
              transformer: ''
            });
          }
        });
      });
    }
    else if (chartGroup === 'POR Overview') {
      // For POR Overview, ensure we have 3 variables for 12 months
      const existingCombos = new Set();
      existingRows.forEach(row => {
        // Extract month from variable name or use a default
        let month = 'Unknown';
        for (const m of months) {
          if (row.variable_name && row.variable_name.includes(m)) {
            month = m;
            break;
          }
        }
        existingCombos.add(`${month}-${row.variable_name}`);
      });
      
      // Add missing combinations
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        requirement.variables.forEach(varName => {
          const combo = `${month}-${varName}`;
          if (!existingCombos.has(combo)) {
            rowsToAdd.push({
              chartName: chartGroup,
              chartGroup: chartGroup,
              variableName: `${month} ${varName}`,
              serverName: 'POR',
              tableName: 'por_overview',
              sqlExpression: `SELECT COUNT(*) FROM rentals WHERE MONTH(date) = ${i+1} AND status = '${varName.toLowerCase().replace(/ /g, '_')}'`,
              productionSqlExpression: `SELECT COUNT(*) FROM rentals WHERE MONTH(date) = ${i+1} AND status = '${varName.toLowerCase().replace(/ /g, '_')}'`,
              value: '0',
              transformer: ''
            });
          }
        });
      }
    }
    else if (chartGroup === 'Site Distribution') {
      // For Site Distribution, ensure we have 3 locations
      const existingVars = new Set(existingRows.map(row => row.variable_name));
      requirement.variables.forEach(varName => {
        if (!existingVars.has(varName)) {
          rowsToAdd.push({
            chartName: chartGroup,
            chartGroup: chartGroup,
            variableName: varName,
            serverName: 'P21',
            tableName: 'inventory',
            sqlExpression: `SELECT COUNT(*) FROM inventory WHERE location = '${varName.split(' ')[0]}'`,
            productionSqlExpression: `SELECT COUNT(*) FROM inventory WHERE location = '${varName.split(' ')[0]}'`,
            value: '0',
            transformer: ''
          });
        }
      });
    }
    else if (chartGroup === 'AR Aging') {
      // For AR Aging, ensure we have 5 aging buckets
      const existingVars = new Set(existingRows.map(row => row.variable_name));
      requirement.variables.forEach(varName => {
        if (!existingVars.has(varName)) {
          rowsToAdd.push({
            chartName: chartGroup,
            chartGroup: chartGroup,
            variableName: varName,
            serverName: 'P21',
            tableName: 'ar_aging',
            sqlExpression: `SELECT SUM(amount) FROM ar_aging WHERE age_bucket = '${varName.replace(/ Days/g, '').replace(/\+/g, 'plus')}'`,
            productionSqlExpression: `SELECT SUM(amount) FROM ar_aging WHERE age_bucket = '${varName.replace(/ Days/g, '').replace(/\+/g, 'plus')}'`,
            value: '0',
            transformer: ''
          });
        }
      });
    }
    else if (chartGroup === 'Daily Orders') {
      // For Daily Orders, ensure we have 7 days
      const existingVars = new Set(existingRows.map(row => row.variable_name));
      requirement.days.forEach((day, index) => {
        const varName = `${day} Orders`;
        if (!existingVars.has(varName)) {
          rowsToAdd.push({
            chartName: chartGroup,
            chartGroup: chartGroup,
            variableName: varName,
            serverName: 'P21',
            tableName: 'orders',
            sqlExpression: `SELECT COUNT(*) FROM orders WHERE DAYOFWEEK(order_date) = ${index + 1}`,
            productionSqlExpression: `SELECT COUNT(*) FROM orders WHERE DAYOFWEEK(order_date) = ${index + 1}`,
            value: '0',
            transformer: ''
          });
        }
      });
    }
    else if (chartGroup === 'Web Orders') {
      // For Web Orders, ensure we have 2 variables for 12 months
      const existingCombos = new Set();
      existingRows.forEach(row => {
        // Extract month from variable name or use a default
        let month = 'Unknown';
        for (const m of months) {
          if (row.variable_name && row.variable_name.includes(m)) {
            month = m;
            break;
          }
        }
        existingCombos.add(`${month}-${row.variable_name}`);
      });
      
      // Add missing combinations
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        requirement.variables.forEach(varName => {
          const combo = `${month}-${varName}`;
          if (!existingCombos.has(combo)) {
            rowsToAdd.push({
              chartName: chartGroup,
              chartGroup: chartGroup,
              variableName: `${month} ${varName}`,
              serverName: 'P21',
              tableName: 'web_orders',
              sqlExpression: `SELECT ${varName === 'Orders' ? 'COUNT(*)' : 'SUM(total)'} FROM web_orders WHERE MONTH(order_date) = ${i+1}`,
              productionSqlExpression: `SELECT ${varName === 'Orders' ? 'COUNT(*)' : 'SUM(total)'} FROM web_orders WHERE MONTH(order_date) = ${i+1}`,
              value: '0',
              transformer: ''
            });
          }
        });
      }
    }
    
    // Insert the new rows
    if (rowsToAdd.length > 0) {
      console.log(`- Adding ${rowsToAdd.length} new rows`);
      
      rowsToAdd.forEach(row => {
        insertStmt.run(
          row.chartName,
          row.chartGroup,
          row.variableName,
          row.serverName,
          row.tableName,
          row.sqlExpression,
          row.productionSqlExpression,
          row.value,
          row.transformer
        );
      });
    } else {
      console.log(`- No new rows needed`);
    }
  });
  
  console.log('\nTransaction completed successfully');
});

// Execute the transaction
try {
  transaction();
  console.log('\nDatabase update completed successfully');
  
  // Get updated counts
  const updatedCounts = db.prepare(`
    SELECT chart_group, COUNT(*) as count
    FROM chart_data
    GROUP BY chart_group
  `).all();
  
  console.log('\nUpdated row counts by chart group:');
  updatedCounts.forEach(row => {
    console.log(`- ${row.chart_group || 'Unknown'}: ${row.count} rows`);
  });
  
} catch (error) {
  console.error('Error updating database:', error);
}

// Close the database connection
db.close();
