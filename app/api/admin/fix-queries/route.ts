import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/sqlite';

// Fixed SQL queries for P21 database
const fixedP21Queries = [
  {
    id: '1',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK)"
  },
  {
    id: '2',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Open'"
  },
  {
    id: '3',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Pending'"
  },
  {
    id: '4',
    production_sql_expression: "SELECT ISNULL(SUM(order_amt), 0) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  {
    id: '5',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE item_status = 'Open'"
  },
  {
    id: '6',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Backlogged'"
  },
  {
    id: '7',
    production_sql_expression: "SELECT ISNULL(SUM(order_amt), 0) as value FROM oe_hdr WITH (NOLOCK) WHERE FORMAT(order_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  {
    id: '8',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE location_id = '01' AND order_status = 'Open'"
  },
  {
    id: '9',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE location_id = '02' AND order_status = 'Open'"
  },
  {
    id: '10',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE location_id = '03' AND order_status = 'Open'"
  },
  {
    id: '11',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ap_open_items WITH (NOLOCK) WHERE FORMAT(invoice_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  {
    id: '12',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ap_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 0 AND FORMAT(invoice_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  {
    id: '13',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE FORMAT(invoice_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  {
    id: '14',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ap_open_items WITH (NOLOCK) WHERE FORMAT(invoice_date, 'yyyy-MM') = FORMAT(DATEADD(month, -1, GETDATE()), 'yyyy-MM')"
  },
  {
    id: '15',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE FORMAT(invoice_date, 'yyyy-MM') = FORMAT(DATEADD(month, -1, GETDATE()), 'yyyy-MM')"
  },
  {
    id: '16',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 0 AND FORMAT(invoice_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  {
    id: '17',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 30"
  },
  {
    id: '18',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30"
  },
  {
    id: '19',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60"
  },
  {
    id: '20',
    production_sql_expression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 60"
  },
  {
    id: '21',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Shipped'"
  },
  {
    id: '22',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Invoiced'"
  },
  {
    id: '23',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Cancelled'"
  },
  {
    id: '24',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'On Hold'"
  },
  {
    id: '25',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Completed'"
  },
  {
    id: '26',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  {
    id: '27',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  {
    id: '28',
    production_sql_expression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -2, GETDATE()))"
  },
  {
    id: '29',
    production_sql_expression: "SELECT COUNT(DISTINCT customer_id) as value FROM oe_hdr WITH (NOLOCK) WHERE FORMAT(order_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  }
];

// Fixed SQL queries for POR database (MS Access syntax)
const fixedPORQueries = [
  {
    id: '30',
    production_sql_expression: "SELECT COUNT(*) as value FROM Orders"
  },
  {
    id: '31',
    production_sql_expression: "SELECT COUNT(*) as value FROM Orders WHERE OrderStatus = 'Open'"
  },
  {
    id: '32',
    production_sql_expression: "SELECT COUNT(*) as value FROM Orders WHERE OrderStatus = 'Pending'"
  },
  {
    id: '33',
    production_sql_expression: "SELECT SUM(OrderAmount) as value FROM Orders WHERE Format(OrderDate, 'yyyy-mm-dd') = Format(Date(), 'yyyy-mm-dd')"
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log('Starting to fix SQL queries...');
    
    // Open the database
    const db = await getDb();
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update P21 queries
    let updatedCount = 0;
    for (const query of fixedP21Queries) {
      try {
        // Check if the row exists
        const row = await db.get(`SELECT * FROM chart_data WHERE id = ?`, query.id);
        if (row) {
          // Update the row with the fixed SQL
          await db.run(`UPDATE chart_data SET production_sql_expression = ? WHERE id = ?`, 
            query.production_sql_expression, query.id);
          updatedCount++;
          console.log(`Updated query for row ID: ${query.id}`);
        } else {
          console.log(`Row ID ${query.id} not found, skipping`);
        }
      } catch (err) {
        console.error(`Error updating row ${query.id}:`, err);
      }
    }
    
    // Update POR queries
    for (const query of fixedPORQueries) {
      try {
        // Check if the row exists
        const row = await db.get(`SELECT * FROM chart_data WHERE id = ?`, query.id);
        if (row) {
          // Update the row with the fixed SQL
          await db.run(`UPDATE chart_data SET production_sql_expression = ? WHERE id = ?`, 
            query.production_sql_expression, query.id);
          updatedCount++;
          console.log(`Updated query for row ID: ${query.id}`);
        } else {
          console.log(`Row ID ${query.id} not found, skipping`);
        }
      } catch (err) {
        console.error(`Error updating row ${query.id}:`, err);
      }
    }
    
    // Commit the transaction
    await db.run('COMMIT');
    console.log('SQL queries updated successfully!');
    
    // Close the database connection
    await db.close();
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${updatedCount} SQL queries` 
    });
  } catch (error) {
    console.error('Error fixing SQL queries:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Failed to fix SQL queries: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}
