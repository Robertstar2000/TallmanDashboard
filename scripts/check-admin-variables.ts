/**
 * Check Admin Variables
 * 
 * This script checks the admin_variables table to verify that
 * the POR Overview queries have been properly integrated.
 */

import { executeWrite } from '../lib/db/sqlite';

interface AdminVariable {
  id: number;
  name: string;
  value: string;
  category: string;
  chart_group: string;
  chart_name: string;
  variable_name: string;
  server_name: string;
  sql_expression: string;
  production_sql_expression: string;
  table_name: string;
}

async function checkAdminVariables() {
  try {
    console.log('Checking admin variables...');
    
    // Get all admin variables
    const sql = 'SELECT * FROM admin_variables';
    const result = await executeWrite(sql);
    const adminVars = Array.isArray(result) ? result as AdminVariable[] : [];
    
    if (adminVars.length > 0) {
      console.log(`Found ${adminVars.length} admin variables`);
      
      // Group by chart_group
      const groupedVars: Record<string, AdminVariable[]> = adminVars.reduce((groups: Record<string, AdminVariable[]>, variable: AdminVariable) => {
        const group = variable.chart_group || 'Ungrouped';
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(variable);
        return groups;
      }, {});
      
      // Display variables by group
      for (const [group, variables] of Object.entries(groupedVars)) {
        console.log(`\n${group} (${variables.length} variables):`);
        
        variables.forEach((variable: AdminVariable) => {
          console.log(`  - ${variable.variable_name || variable.name}`);
          console.log(`    Server: ${variable.server_name}`);
          console.log(`    SQL: ${variable.sql_expression}`);
          console.log(`    Production SQL: ${variable.production_sql_expression}`);
          console.log(`    Value: ${variable.value}`);
          console.log();
        });
      }
    } else {
      console.log('No admin variables found');
    }
  } catch (error) {
    console.error('Error checking admin variables:', error instanceof Error ? error.message : String(error));
  }
}

// Run the check
checkAdminVariables().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
