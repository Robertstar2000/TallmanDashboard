// Script to update P21 table names in the admin database
import { executeWrite } from '../lib/db/sqlite.js';
import fs from 'fs';
import path from 'path';

// Table mapping for common P21 tables
const p21TableMapping = {
  'orders': 'oe_hdr',
  'order_lines': 'oe_line',
  'invoices': 'invoice_hdr',
  'invoice_lines': 'invoice_line',
  'inventory': 'inv_mast',
  'inventory_locations': 'inv_loc',
  'customers': 'customer',
  'vendors': 'vendor',
  'salesreps': 'salesrep',
  'products': 'inv_mast'
};

// Additional P21 tables with their correct names
const additionalP21Tables = {
  'oe_hdr': 'oe_hdr',
  'oe_line': 'oe_line',
  'oe_hdr_salesrep': 'oe_hdr_salesrep',
  'oe_line_salesrep': 'oe_line_salesrep',
  'oe_hdr_notepad': 'oe_hdr_notepad',
  'oe_line_notepad': 'oe_line_notepad',
  'oe_line_schedule': 'oe_line_schedule',
  'oe_line_serial': 'oe_line_serial',
  'oe_line_lot': 'oe_line_lot',
  'oe_hdr_status': 'oe_hdr_status',
  'oe_contacts_customer': 'oe_contacts_customer',
  'invoice_hdr': 'invoice_hdr',
  'invoice_line': 'invoice_line',
  'invoice_hdr_salesrep': 'invoice_hdr_salesrep',
  'invoice_line_salesrep': 'invoice_line_salesrep',
  'invoice_hdr_notepad': 'invoice_hdr_notepad',
  'invoice_line_notepad': 'invoice_line_notepad',
  'invoice_line_taxes': 'invoice_line_taxes',
  'invoice_batch': 'invoice_batch',
  'inv_mast': 'inv_mast',
  'inv_loc': 'inv_loc',
  'inv_lot': 'inv_lot',
  'inv_serial': 'inv_serial',
  'inv_tran': 'inv_tran',
  'inv_bin': 'inv_bin',
  'inv_xref': 'inv_xref',
  'inv_on_hand': 'inv_on_hand',
  'inv_period_usage': 'inv_period_usage',
  'inv_sub': 'inv_sub',
  'customer': 'customer',
  'customer_notepad': 'customer_notepad',
  'customer_ship_to': 'customer_ship_to',
  'customer_contact': 'customer_contact',
  'customer_class': 'customer_class',
  'customer_order_history': 'customer_order_history',
  'customer_oe_info': 'customer_oe_info',
  'vendor': 'vendor',
  'vendor_notepad': 'vendor_notepad',
  'vendor_contact': 'vendor_contact',
  'vendor_class': 'vendor_class',
  'vendor_item': 'vendor_item',
  'vendor_address': 'vendor_address'
};

// Combine all table mappings
const allTableMappings = { ...p21TableMapping, ...additionalP21Tables };

async function updateP21TableNames() {
  try {
    console.log('Updating P21 table names in admin database...');

    // Get all admin variables
    const getVariablesQuery = 'SELECT * FROM admin_variables WHERE server_name = "P21"';
    const variables = await executeWrite(getVariablesQuery);
    
    if (!Array.isArray(variables) || variables.length === 0) {
      console.log('No P21 variables found in the admin database.');
      return;
    }
    
    console.log(`Found ${variables.length} P21 variables to update.`);
    
    // Update each variable with the correct table name
    for (const variable of variables) {
      // Skip if no SQL expression
      if (!variable.sql_expression) {
        console.log(`Skipping variable ${variable.id}: No SQL expression`);
        continue;
      }
      
      // Extract table name from SQL expression
      const fromMatch = variable.sql_expression.match(/FROM\s+(\w+)/i);
      if (!fromMatch || !fromMatch[1]) {
        console.log(`Skipping variable ${variable.id}: Could not extract table name from SQL expression`);
        continue;
      }
      
      const currentTableName = fromMatch[1];
      const correctTableName = allTableMappings[currentTableName.toLowerCase()] || currentTableName;
      
      // Update the table name in the database
      const updateTableNameQuery = `
        UPDATE admin_variables 
        SET table_name = ? 
        WHERE id = ?
      `;
      await executeWrite(updateTableNameQuery, [correctTableName, variable.id]);
      
      // Update the SQL expression to use the correct table name
      const updatedSqlExpression = variable.sql_expression.replace(
        new RegExp(`FROM\\s+${currentTableName}`, 'i'),
        `FROM ${correctTableName}`
      );
      
      const updateSqlExpressionQuery = `
        UPDATE admin_variables 
        SET sql_expression = ? 
        WHERE id = ?
      `;
      await executeWrite(updateSqlExpressionQuery, [updatedSqlExpression, variable.id]);
      
      console.log(`Updated variable ${variable.id}: Table name changed from ${currentTableName} to ${correctTableName}`);
    }
    
    console.log('P21 table names update completed successfully.');
  } catch (error) {
    console.error('Error updating P21 table names:', error);
  }
}

// Run the function
updateP21TableNames().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
