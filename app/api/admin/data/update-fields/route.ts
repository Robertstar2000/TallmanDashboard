import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/sqlite';

// Helper functions for default values
function getDefaultTableName(metricName: string): string {
  const name = metricName.toLowerCase();
  
  if (name.includes('revenue') || name.includes('sales')) {
    return 'invoice_hdr';
  } else if (name.includes('order') || name.includes('orders')) {
    return 'order_hdr';
  } else if (name.includes('customer') || name.includes('customers')) {
    return 'customer_mst';
  } else if (name.includes('inventory') || name.includes('stock')) {
    return 'inv_mst';
  } else if (name.includes('web')) {
    return 'web_order_hdr';
  } else if (name.includes('aging') || name.includes('receivable')) {
    return 'ar_open_items';
  } else if (name.includes('payable')) {
    return 'ap_open_items';
  } else if (name.includes('site') || name.includes('distribution')) {
    return 'location_mst';
  }
  
  // Default table
  return 'dashboard_metrics';
}

function getDefaultProductionSql(metricName: string): string {
  const name = metricName.toLowerCase();
  
  if (name.includes('revenue') || name.includes('total revenue')) {
    return `SELECT SUM(invoice_total) 
FROM invoice_hdr 
WHERE invoice_date >= DATEADD(month, -1, GETDATE())`;
  } else if (name.includes('total orders')) {
    return `SELECT COUNT(*) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -1, GETDATE())`;
  } else if (name.includes('active customers')) {
    return `SELECT COUNT(DISTINCT customer_id) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -3, GETDATE())`;
  } else if (name.includes('average order')) {
    return `SELECT AVG(order_total) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -1, GETDATE())`;
  } else if (name.includes('web orders')) {
    return `SELECT COUNT(*) 
FROM order_hdr 
WHERE order_source = 'WEB' AND order_date >= DATEADD(month, -1, GETDATE())`;
  } else if (name.includes('inventory value')) {
    return `SELECT SUM(qty_on_hand * avg_cost) 
FROM inv_mst`;
  } else if (name.includes('aging') && name.includes('amount')) {
    if (name.includes('1-30') || name.includes('30')) {
      return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 1 AND 30`;
    } else if (name.includes('31-60') || name.includes('60')) {
      return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 31 AND 60`;
    } else if (name.includes('61-90') || name.includes('90')) {
      return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 61 AND 90`;
    } else if (name.includes('90+') || name.includes('over')) {
      return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due > 90`;
    }
  } else if (name.includes('aging') && name.includes('count')) {
    if (name.includes('1-30') || name.includes('30')) {
      return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 1 AND 30`;
    } else if (name.includes('31-60') || name.includes('60')) {
      return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 31 AND 60`;
    } else if (name.includes('61-90') || name.includes('90')) {
      return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 61 AND 90`;
    } else if (name.includes('90+') || name.includes('over')) {
      return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due > 90`;
    }
  }
  
  // Default SQL
  return `SELECT COUNT(*) FROM ${getDefaultTableName(metricName)} WHERE 1=1`;
}

export async function GET() {
  try {
    console.log('Starting SQL expressions and table names update...');
    
    const db = await getDb();
    
    // Get all rows from the database
    const rows = await db.all(`
      SELECT id, chart_name, variable_name, server_name, table_name, sql_expression, production_sql_expression
      FROM chart_data
    `);
    
    console.log(`Found ${rows.length} rows in the database`);
    
    // Update each row with default SQL expressions and table names
    const updateStmt = await db.prepare(`
      UPDATE chart_data
      SET 
        table_name = ?,
        sql_expression = ?,
        production_sql_expression = ?
      WHERE id = ?
    `);
    
    let updatedCount = 0;
    
    for (const row of rows) {
      const tableName = getDefaultTableName(row.variable_name);
      const sqlExpression = `SELECT CAST(ROUND(RAND() * 1000, 0) AS INT) /* Test SQL for ${row.variable_name} */`;
      const productionSqlExpression = getDefaultProductionSql(row.variable_name);
      
      await updateStmt.run(
        tableName,
        sqlExpression,
        productionSqlExpression,
        row.id
      );
      
      updatedCount++;
    }
    
    await updateStmt.finalize();
    await db.close();
    
    console.log(`Updated ${updatedCount} rows with SQL expressions and table names`);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} rows with SQL expressions and table names`,
      updatedCount
    });
  } catch (error) {
    console.error('Error updating SQL expressions and table names:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update SQL expressions and table names', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
