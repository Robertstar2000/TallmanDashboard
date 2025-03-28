// Script to synchronize initial-data.ts with the database changes
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Connect to the database
const db = new Database('./data/dashboard.db');

try {
  console.log('Connected to the database at', path.resolve('./data/dashboard.db'));
  console.log('\n=== SYNCHRONIZING INITIAL DATA WITH DATABASE ===\n');
  
  // Get all chart data from the database
  const chartData = db.prepare('SELECT * FROM chart_data ORDER BY chart_group, id').all();
  console.log(`Found ${chartData.length} rows in the database`);
  
  // Group the data by chart_group
  const groupedData = {};
  for (const row of chartData) {
    if (!groupedData[row.chart_group]) {
      groupedData[row.chart_group] = [];
    }
    groupedData[row.chart_group].push(row);
  }
  
  // Path to the initial-data.ts file
  const initialDataPath = path.resolve('./lib/db/initial-data.ts');
  
  // Create a backup of the file
  const backupPath = `${initialDataPath}.backup-${Date.now()}.ts`;
  fs.copyFileSync(initialDataPath, backupPath);
  console.log(`Created backup of initial-data.ts at ${backupPath}`);
  
  // Read the file
  let initialData = fs.readFileSync(initialDataPath, 'utf8');
  
  // Process each chart group
  for (const [groupName, rows] of Object.entries(groupedData)) {
    console.log(`\nProcessing ${groupName} (${rows.length} rows)...`);
    
    // Find the section for this chart group in the file
    const sectionStartPattern = new RegExp(`\\/\\/ ${groupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    const sectionStartMatch = initialData.match(sectionStartPattern);
    
    if (sectionStartMatch) {
      // Find the start of the next section or the export statement
      const nextSectionPattern = /\/\/ [A-Za-z ]+ |export const/g;
      nextSectionPattern.lastIndex = sectionStartMatch.index + sectionStartMatch[0].length;
      const nextSectionMatch = nextSectionPattern.exec(initialData);
      
      if (nextSectionMatch) {
        // Generate the new section content
        let newSectionContent = `// ${groupName}\n`;
        
        for (const row of rows) {
          // Convert database row to TypeScript object
          newSectionContent += `  {\n`;
          newSectionContent += `    id: '${row.id}',\n`;
          newSectionContent += `    chartName: '${row.chart_name || groupName}',\n`;
          newSectionContent += `    chartGroup: '${row.chart_group}',\n`;
          newSectionContent += `    variableName: '${row.variable_name}',\n`;
          newSectionContent += `    serverName: '${row.server_name || 'P21'}',\n`;
          newSectionContent += `    value: '${row.value || '0'}',\n`;
          
          // Handle SQL expressions
          const sqlExpression = row.sql_expression || 'SELECT 0';
          const productionSqlExpression = row.production_sql_expression || 'SELECT 0';
          
          newSectionContent += `    sqlExpression: \`${sqlExpression}\`,\n`;
          newSectionContent += `    productionSqlExpression: \`${productionSqlExpression}\`,\n`;
          
          // Add table name if present
          if (row.db_table_name) {
            newSectionContent += `    tableName: '${row.db_table_name}',\n`;
          }
          
          newSectionContent += `  },\n`;
        }
        
        // Replace the section in the file
        const sectionToReplace = initialData.substring(sectionStartMatch.index, nextSectionMatch.index);
        initialData = initialData.replace(sectionToReplace, newSectionContent);
        
        console.log(`Updated ${groupName} section in initial-data.ts`);
      } else {
        console.error(`Could not find the end of the ${groupName} section in initial-data.ts`);
      }
    } else {
      console.error(`Could not find the ${groupName} section in initial-data.ts`);
    }
  }
  
  // Write the updated file
  fs.writeFileSync(initialDataPath, initialData);
  console.log(`\nSuccessfully updated ${initialDataPath} with database changes`);
  
  console.log('\nInitial data synchronization completed!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  // Close the database connection
  db.close();
  console.log('Database connection closed');
}
