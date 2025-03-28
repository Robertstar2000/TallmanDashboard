import { executeWrite } from './sqlite';
import { AdminVariable } from '@/lib/types/dashboard';
import { executeQuery } from './query-executor';
import { executeP21Query } from '@/lib/services/p21';

// Default admin data for testing
export const defaultAdminData: AdminVariable[] = [
  {
    id: '1',
    name: 'Total Orders',
    value: '150',
    category: 'Metrics',
    chartGroup: 'Dashboard',
    chartName: 'Orders',
    variableName: 'orders',
    server: 'P21',
    serverName: 'P21',
    productionSqlExpression: 'SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK)',
    tableName: 'oe_hdr'
  },
  {
    id: '2',
    name: 'Average Order Value',
    value: '2500',
    category: 'Metrics',
    chartGroup: 'Dashboard',
    chartName: 'Orders',
    variableName: 'avg_order',
    server: 'P21',
    serverName: 'P21',
    productionSqlExpression: 'SELECT ISNULL(AVG(order_amt), 0) FROM dbo.oe_hdr WITH (NOLOCK)',
    tableName: 'oe_hdr'
  },
  {
    id: '3',
    name: 'Total Invoices',
    value: '120',
    category: 'Metrics',
    chartGroup: 'Dashboard',
    chartName: 'Invoices',
    variableName: 'invoices',
    server: 'P21',
    serverName: 'P21',
    productionSqlExpression: 'SELECT COUNT(*) FROM dbo.invoice_hdr WITH (NOLOCK)',
    tableName: 'invoice_hdr'
  },
  {
    id: '4',
    name: 'Average Invoice Value',
    value: '2200',
    category: 'Metrics',
    chartGroup: 'Dashboard',
    chartName: 'Invoices',
    variableName: 'avg_invoice',
    server: 'P21',
    serverName: 'P21',
    productionSqlExpression: 'SELECT ISNULL(AVG(invoice_amt), 0) FROM dbo.invoice_hdr WITH (NOLOCK)',
    tableName: 'invoice_hdr'
  },
  {
    id: '5',
    name: 'Total Inventory Items',
    value: '5000',
    category: 'Metrics',
    chartGroup: 'Dashboard',
    chartName: 'Inventory',
    variableName: 'inventory_items',
    server: 'P21',
    serverName: 'P21',
    productionSqlExpression: 'SELECT COUNT(*) FROM dbo.inv_mast WITH (NOLOCK)',
    tableName: 'inv_mast'
  },
  {
    id: '6',
    name: 'Total Customers',
    value: '1200',
    category: 'Metrics',
    chartGroup: 'Dashboard',
    chartName: 'Customers',
    variableName: 'customers',
    server: 'P21',
    serverName: 'P21',
    productionSqlExpression: 'SELECT COUNT(*) FROM dbo.customer WITH (NOLOCK)',
    tableName: 'customer'
  },
  {
    id: '7',
    name: 'Open Orders',
    value: '45',
    category: 'Metrics',
    chartGroup: 'Dashboard',
    chartName: 'Orders',
    variableName: 'open_orders',
    server: 'P21',
    serverName: 'P21',
    productionSqlExpression: 'SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_status = \'O\'',
    tableName: 'oe_hdr'
  },
  {
    id: '8',
    name: 'Total Order Lines',
    value: '750',
    category: 'Metrics',
    chartGroup: 'Dashboard',
    chartName: 'Orders',
    variableName: 'order_lines',
    server: 'P21',
    serverName: 'P21',
    productionSqlExpression: 'SELECT COUNT(*) FROM dbo.oe_line WITH (NOLOCK)',
    tableName: 'oe_line'
  },
  {
    id: '9',
    name: 'Total Invoice Lines',
    value: '600',
    category: 'Metrics',
    chartGroup: 'Dashboard',
    chartName: 'Invoices',
    variableName: 'invoice_lines',
    server: 'P21',
    serverName: 'P21',
    productionSqlExpression: 'SELECT COUNT(*) FROM dbo.invoice_line WITH (NOLOCK)',
    tableName: 'invoice_line'
  },
  {
    id: '10',
    name: 'Active Inventory Items',
    value: '4200',
    category: 'Metrics',
    chartGroup: 'Dashboard',
    chartName: 'Inventory',
    variableName: 'active_inventory',
    server: 'P21',
    serverName: 'P21',
    productionSqlExpression: 'SELECT COUNT(*) FROM dbo.inv_mast WITH (NOLOCK) WHERE status = \'A\'',
    tableName: 'inv_mast'
  }
];

export async function updateAdminVariable(variable: AdminVariable): Promise<void> {
  const sql = `
    INSERT OR REPLACE INTO admin_variables (name, value, category)
    VALUES (?, ?, ?)
  `;
  await executeWrite(sql, [variable.name, variable.value, variable.category]);
}

export async function getAdminVariables(): Promise<AdminVariable[]> {
  const sql = 'SELECT * FROM admin_variables';
  const results = await executeWrite(sql);
  return Array.isArray(results) ? results.map(row => ({
    id: row.id?.toString(),
    name: row.name,
    value: row.value,
    category: row.category,
    variableName: row.variable_name,
    serverName: row.server_name,
    server: row.server_name || 'P21', // Use server_name as server or default to P21
    productionSqlExpression: row.sql_expression || '',
    tableName: row.table_name,
    chartGroup: row.chart_group || 'Default',
    chartName: row.chart_name || 'Default',
    subGroup: row.sub_group
  })) : [];
}

export async function resetAdminVariables(): Promise<void> {
  const sql = 'DELETE FROM admin_variables';
  await executeWrite(sql);
}

// For backward compatibility
export const getDashboardVariables = getAdminVariables;

export const updateDashboardVariable = async (id: string, field: string, value: string | number): Promise<void> => {
  // For backward compatibility - create a minimal variable if it doesn't exist
  const variable: AdminVariable = {
    id,
    name: id,
    value: '',
    category: 'Default',
    chartGroup: 'Dashboard',
    chartName: 'Default',
    variableName: id,
    server: 'P21',
    productionSqlExpression: '',
    tableName: ''
  };
  await updateAdminVariable(variable);
};

/**
 * Execute a test query for the admin spreadsheet
 * @param variable The admin variable containing the SQL expression to execute
 * @returns The result of the query as a string, or "0" if there's an error
 */
export async function executeTestQuery(variable: AdminVariable): Promise<string> {
  try {
    if (!variable.productionSqlExpression) {
      console.log(`No SQL expression for variable ${variable.id}, returning 0`);
      return "0";
    }

    const result = await executeQuery({
      server: variable.server || variable.serverName || 'P21',
      sql: variable.productionSqlExpression,
      tableName: variable.tableName,
      testMode: true,
      rowId: variable.id
    });

    if (result.success && result.value !== undefined) {
      return result.value.toString();
    }

    console.log(`Test query execution failed for ${variable.id}: ${result.error || 'Unknown error'}`);
    return "0";
  } catch (error) {
    console.error(`Error executing test query for ${variable.id}:`, error);
    return "0";
  }
}

/**
 * Execute a production query for the admin spreadsheet
 * @param variable The admin variable containing the SQL expression to execute
 * @returns The result of the query as a string, or "0" if there's an error
 */
export async function executeProductionQuery(variable: AdminVariable): Promise<string> {
  try {
    // Get the SQL expression
    const sqlExpression = variable.productionSqlExpression?.trim();
    
    if (!sqlExpression) {
      console.log(`No production SQL expression for ${variable.id}`);
      return "0";
    }
    
    // Determine the server type
    const serverType = variable.serverName?.toUpperCase();
    
    if (!serverType) {
      console.log(`No server type for ${variable.id}`);
      return "0";
    }
    
    // Execute the query based on server type
    console.log(`Executing query for ${variable.id} on server ${serverType}`);
    
    // For P21 queries, ensure they have a 'value' column
    let formattedSql = sqlExpression;
    
    if (serverType === 'P21') {
      console.log(`Formatting P21 query for ${variable.id}`);
      
      // Check if the query has a column named 'value'
      const hasValueColumn = formattedSql.toUpperCase().includes('AS VALUE') || 
                             formattedSql.toUpperCase().includes(' VALUE,') || 
                             formattedSql.toUpperCase().includes(' VALUE ') || 
                             formattedSql.toUpperCase().includes(' VALUE)');
      
      // Format the query if needed
      if (!hasValueColumn && 
          (formattedSql.toUpperCase().includes('COUNT(') || 
           formattedSql.toUpperCase().includes('SUM(') || 
           formattedSql.toUpperCase().includes('AVG(') || 
           formattedSql.toUpperCase().includes('MIN(') || 
           formattedSql.toUpperCase().includes('MAX('))) {
        
        const lastParenIndex = formattedSql.lastIndexOf(')');
        if (lastParenIndex > 0 && lastParenIndex === formattedSql.length - 1) {
          formattedSql = formattedSql.substring(0, lastParenIndex) + ') AS value';
        }
      }
      
      console.log(`Formatted P21 query: ${formattedSql}`);
    }
    
    // Add row ID as a SQL comment for better tracking
    const sqlWithRowId = `${formattedSql} -- ROW_ID: ${variable.id}`;
    
    // Execute the query using the unified query executor
    const result = await executeQuery({
      server: serverType,
      sql: sqlWithRowId,
      tableName: variable.tableName,
      rowId: variable.id
    });
    
    if (result.success && result.value !== undefined) {
      const valueStr = result.value.toString();
      console.log(`Query result for ${variable.id}: ${valueStr}`);
      return valueStr;
    } else {
      console.error(`Query execution error for ${variable.id}:`, result.error);
      return "0";
    }
  } catch (error) {
    console.error(`Unexpected error in executeProductionQuery for ${variable.id}:`, error);
    return "0";
  }
}