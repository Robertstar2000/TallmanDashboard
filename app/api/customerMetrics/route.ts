import { NextResponse } from 'next/server';
import { executeAdminQuery } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const sql = `
      SELECT 
        month,
        new_customers as newCustomers,
        prospects
      FROM customer_metrics
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const result = await executeAdminQuery(sql);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching customer metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch customer metrics' }, { status: 500 });
  }
}
