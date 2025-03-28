// Script to update data transformers to match the new chart structure
const fs = require('fs');
const path = require('path');

// Path to the data transformers file
const transformersPath = path.join(process.cwd(), 'lib', 'db', 'data-transformers.ts');
const backupPath = path.join(process.cwd(), 'lib', 'db', `data-transformers.backup-${Date.now()}.ts`);

// Define the updated chart structure
const chartStructure = {
  'AR Aging': {
    variables: ['Amount Due'],
    categories: ['1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Current'],
    totalRows: 5
  },
  'Accounts': {
    variables: ['Payable', 'Receivable', 'Overdue'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalRows: 36
  },
  'Customer Metrics': {
    variables: ['New', 'Prospects'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalRows: 24
  },
  'Daily Orders': {
    variables: ['Orders'],
    days: ['Today', 'Today-1', 'Today-2', 'Today-3', 'Today-4', 'Today-5', 'Today-6'],
    totalRows: 7
  },
  'Historical Data': {
    variables: ['P21', 'POR', 'Total {P21+POR}'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalRows: 36
  },
  'Inventory': {
    variables: ['In Stock', 'On Order'],
    departments: ['Department 1', 'Department 2', 'Department 3', 'Department 4'],
    totalRows: 8
  },
  'Key Metrics': {
    variables: ['Total Orders', 'Open Orders', 'Total Sales Monthly', 'Daily Revenue', 'Turnover Rate', 'Open Invoices', 'Payable'],
    totalRows: 7
  },
  'Site Distribution': {
    variables: ['Value'],
    locations: ['Columbus', 'Addison', 'Lake City'],
    totalRows: 3
  },
  'POR Overview': {
    variables: ['New Rentals', 'Open Rentals', 'Rental Value'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalRows: 36
  },
  'Web Orders': {
    variables: ['Orders'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalRows: 12
  }
};

// Function to update the transformers file
function updateTransformers() {
  try {
    // Create a backup of the current file
    fs.copyFileSync(transformersPath, backupPath);
    console.log(`Created backup of data-transformers.ts at ${backupPath}`);
    
    // Read the current file
    let content = fs.readFileSync(transformersPath, 'utf8');
    
    // Update the transformHistoricalData function
    content = updateHistoricalDataTransformer(content);
    
    // Update the transformCustomers function
    content = updateCustomerMetricsTransformer(content);
    
    // Update the transformDailyOrders function
    content = updateDailyOrdersTransformer(content);
    
    // Update the transformSiteDistribution function
    content = updateSiteDistributionTransformer(content);
    
    // Write the updated content back to the file
    fs.writeFileSync(transformersPath, content);
    console.log(`Successfully updated ${transformersPath}`);
    
    return true;
  } catch (error) {
    console.error(`Error updating transformers: ${error.message}`);
    return false;
  }
}

// Function to update the Historical Data transformer
function updateHistoricalDataTransformer(content) {
  // Find the transformHistoricalData function
  const historicalDataRegex = /(function\s+transformHistoricalData\s*\([^)]*\)\s*{[\s\S]*?)(return\s+Object\.values\(monthlyData\);[\s\S]*?})/;
  
  // Replace the function with the updated version
  return content.replace(historicalDataRegex, (match, start, end) => {
    return `${start}
    // Updated to use P21, POR, and Total {P21+POR} variables
    const filteredData = rawData.filter(item => {
      if (!item) return false;
      return item.chartGroup === 'Historical Data';
    });

    if (!filteredData.length) {
      console.warn('No historical data found');
      return [];
    }

    console.log(\`Found \${filteredData.length} historical data items\`);

    // Group data by month
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize monthly data structure
    months.forEach(month => {
      monthlyData[month] = {
        id: \`historical-\${month}\`,
        date: month,
        p21: 0,
        por: 0,
        total: 0
      };
    });

    // Populate data from filtered rows
    filteredData.forEach(item => {
      const month = item.timeframe || '';
      
      if (month && monthlyData[month]) {
        if (item.variableName === 'P21') {
          monthlyData[month].p21 = parseFloat(item.value) || 0;
        } else if (item.variableName === 'POR') {
          monthlyData[month].por = parseFloat(item.value) || 0;
        } else if (item.variableName === 'Total {P21+POR}') {
          monthlyData[month].total = parseFloat(item.value) || 0;
        }
        
        // Calculate total if not explicitly provided
        if (monthlyData[month].total === 0) {
          monthlyData[month].total = monthlyData[month].p21 + monthlyData[month].por;
        }
      }
    });

    ${end}`;
  });
}

// Function to update the Customer Metrics transformer
function updateCustomerMetricsTransformer(content) {
  // Find the transformCustomers function
  const customersRegex = /(function\s+transformCustomers\s*\([^)]*\)\s*{[\s\S]*?)(return\s+result;[\s\S]*?})/;
  
  // Replace the function with the updated version
  return content.replace(customersRegex, (match, start, end) => {
    return `${start}
    // Updated to use New and Prospects variables
    const filteredData = rawData.filter(item => {
      if (!item) return false;
      return item.chartGroup === 'Customer Metrics';
    });

    if (!filteredData.length) {
      console.warn('No customer metrics data found');
      return [];
    }

    const result = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize monthly data structure
    months.forEach(month => {
      result.push({
        id: \`customer-\${month}\`,
        date: month,
        new: 0,
        prospects: 0
      });
    });

    // Populate data from filtered rows
    filteredData.forEach(item => {
      const month = item.timeframe || '';
      const monthData = result.find(m => m.date === month);
      
      if (monthData) {
        if (item.variableName === 'New') {
          monthData.new = parseInt(item.value) || 0;
        } else if (item.variableName === 'Prospects') {
          monthData.prospects = parseInt(item.value) || 0;
        }
      }
    });

    ${end}`;
  });
}

// Function to update the Daily Orders transformer
function updateDailyOrdersTransformer(content) {
  // Find the transformDailyOrders function
  const dailyOrdersRegex = /(function\s+transformDailyOrders\s*\([^)]*\)\s*{[\s\S]*?)(return\s+result;[\s\S]*?})/;
  
  // Replace the function with the updated version
  return content.replace(dailyOrdersRegex, (match, start, end) => {
    return `${start}
    // Updated to use Today through Today-6 variables
    const filteredData = rawData.filter(item => {
      if (!item) return false;
      return item.chartGroup === 'Daily Orders';
    });

    if (!filteredData.length) {
      console.warn('No daily orders data found');
      return [];
    }

    const result = [];
    const days = ['Today', 'Today-1', 'Today-2', 'Today-3', 'Today-4', 'Today-5', 'Today-6'];

    // Initialize daily data structure
    days.forEach(day => {
      result.push({
        id: \`daily-\${day}\`,
        day: day,
        orders: 0
      });
    });

    // Populate data from filtered rows
    filteredData.forEach(item => {
      const day = item.timeframe || '';
      const dayData = result.find(d => d.day === day);
      
      if (dayData && item.variableName === 'Orders') {
        dayData.orders = parseInt(item.value) || 0;
      }
    });

    ${end}`;
  });
}

// Function to update the Site Distribution transformer
function updateSiteDistributionTransformer(content) {
  // Find the transformSiteDistribution function
  const siteDistributionRegex = /(function\s+transformSiteDistribution\s*\([^)]*\)\s*{[\s\S]*?)(return\s+result;[\s\S]*?})/;
  
  // Replace the function with the updated version
  return content.replace(siteDistributionRegex, (match, start, end) => {
    return `${start}
    // Updated to use Columbus, Addison, and Lake City locations
    const filteredData = rawData.filter(item => {
      if (!item) return false;
      return item.chartGroup === 'Site Distribution';
    });

    if (!filteredData.length) {
      console.warn('No site distribution data found');
      return [];
    }

    const result = {
      id: 'site-distribution',
      columbus: 0,
      addison: 0,
      lakeCity: 0
    };

    // Populate data from filtered rows
    filteredData.forEach(item => {
      if (item.category === 'Columbus' && item.variableName === 'Value') {
        result.columbus = parseInt(item.value) || 0;
      } else if (item.category === 'Addison' && item.variableName === 'Value') {
        result.addison = parseInt(item.value) || 0;
      } else if (item.category === 'Lake City' && item.variableName === 'Value') {
        result.lakeCity = parseInt(item.value) || 0;
      }
    });

    // Convert to array format if needed
    const resultArray = [result];

    ${end}`;
  });
}

// Run the update process
console.log('Updating data transformers to match the new chart structure...');
const success = updateTransformers();

if (success) {
  console.log('Data transformers updated successfully!');
} else {
  console.error('Failed to update data transformers');
}
