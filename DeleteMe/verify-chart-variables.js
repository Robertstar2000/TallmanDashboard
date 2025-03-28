// Script to verify all chart variables are correctly set up
const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const db = new Database('./data/dashboard.db');

try {
  console.log('Connected to the database at', path.resolve('./data/dashboard.db'));
  console.log('\n=== CHART VARIABLES VERIFICATION ===\n');
  
  // Define the expected structure
  const expectedStructure = {
    'AR Aging': {
      variables: ['Amount Due'],
      count: 5 // 5 buckets
    },
    'Accounts': {
      variables: ['Payable', 'Receivable', 'Overdue'],
      count: 36 // 3 variables x 12 months
    },
    'Customer Metrics': {
      variables: ['New', 'Prospects'],
      count: 24 // 2 variables x 12 months
    },
    'Daily Orders': {
      variables: ['Orders'],
      dayNames: ['Today', 'Today-1', 'Today-2', 'Today-3', 'Today-4', 'Today-5', 'Today-6'],
      count: 7 // 1 variable x 7 days
    },
    'Historical Data': {
      variables: ['P21', 'POR', 'Total {P21+POR}'],
      count: 36 // 3 variables x 12 months
    },
    'Inventory': {
      variables: ['In Stock', 'On Order'],
      count: 8 // 2 variables x 4 departments
    },
    'Key Metrics': {
      count: 7 // 7 separate metrics
    },
    'Site Distribution': {
      variables: ['Columbus', 'Addison', 'Lake City'],
      count: 3 // 1 value for 3 locations
    },
    'POR Overview': {
      variables: ['New Rentals', 'Open Rentals', 'Rental Value'],
      count: 36 // 3 variables x 12 months
    },
    'Web Orders': {
      variables: ['Orders'],
      count: 12 // 1 variable x 12 months
    }
  };
  
  // Get all chart groups
  const chartGroups = db.prepare('SELECT DISTINCT chart_group FROM chart_data ORDER BY chart_group').all();
  console.log(`Found ${chartGroups.length} chart groups in the database:\n`);
  
  // Check each chart group
  let totalRows = 0;
  let missingGroups = [];
  let extraGroups = [];
  
  // First identify missing or extra groups
  const dbGroups = chartGroups.map(g => g.chart_group);
  const expectedGroups = Object.keys(expectedStructure);
  
  for (const group of expectedGroups) {
    if (!dbGroups.includes(group)) {
      missingGroups.push(group);
    }
  }
  
  for (const group of dbGroups) {
    if (!expectedGroups.includes(group)) {
      extraGroups.push(group);
    }
  }
  
  if (missingGroups.length > 0) {
    console.log(`⚠️ Missing chart groups: ${missingGroups.join(', ')}`);
  }
  
  if (extraGroups.length > 0) {
    console.log(`ℹ️ Extra chart groups found: ${extraGroups.join(', ')}`);
  }
  
  // Now check each group in detail
  for (const group of chartGroups) {
    const groupName = group.chart_group;
    const expected = expectedStructure[groupName];
    
    // Get all rows for this group
    const rows = db.prepare('SELECT * FROM chart_data WHERE chart_group = ? ORDER BY id').all(groupName);
    totalRows += rows.length;
    
    console.log(`\n## ${groupName} ##`);
    console.log(`Found ${rows.length} rows`);
    
    if (expected) {
      // Check count
      if (rows.length !== expected.count) {
        console.log(`⚠️ Expected ${expected.count} rows, found ${rows.length}`);
      } else {
        console.log(`✅ Row count matches expected (${expected.count})`);
      }
      
      // Check variables
      if (expected.variables) {
        const dbVariables = [...new Set(rows.map(r => r.variable_name))];
        console.log(`Variables: ${dbVariables.join(', ')}`);
        
        const missingVars = expected.variables.filter(v => !dbVariables.includes(v));
        const extraVars = dbVariables.filter(v => !expected.variables.includes(v));
        
        if (missingVars.length > 0) {
          console.log(`⚠️ Missing variables: ${missingVars.join(', ')}`);
        }
        
        if (extraVars.length > 0) {
          console.log(`ℹ️ Extra variables: ${extraVars.join(', ')}`);
        }
        
        if (missingVars.length === 0 && extraVars.length === 0) {
          console.log(`✅ All expected variables present`);
        }
      }
      
      // Special check for Daily Orders day names
      if (groupName === 'Daily Orders' && expected.dayNames) {
        const chartNames = [...new Set(rows.map(r => r.chart_name))];
        console.log(`Day names: ${chartNames.join(', ')}`);
        
        const missingDays = expected.dayNames.filter(d => !chartNames.includes(d));
        const extraDays = chartNames.filter(d => !expected.dayNames.includes(d));
        
        if (missingDays.length > 0) {
          console.log(`⚠️ Missing days: ${missingDays.join(', ')}`);
        }
        
        if (extraDays.length > 0) {
          console.log(`ℹ️ Extra days: ${extraDays.join(', ')}`);
        }
        
        if (missingDays.length === 0 && extraDays.length === 0) {
          console.log(`✅ All expected day names present`);
        }
      }
    } else {
      console.log(`⚠️ No expected structure defined for this group`);
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total rows in database: ${totalRows}`);
  console.log(`Expected total rows: 174`);
  
  if (totalRows === 174) {
    console.log(`✅ Total row count matches expected`);
  } else {
    console.log(`⚠️ Total row count differs from expected`);
  }
  
  console.log('\nVerification completed!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  // Close the database connection
  db.close();
  console.log('Database connection closed');
}
