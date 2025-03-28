import { NextResponse } from 'next/server';
import { executeAdminQuery } from '@/lib/db/sqlite';
import { P21_SCHEMA } from '@/lib/db/p21-schema';

export async function GET() {
  try {
    const sql = `
      SELECT 
        date(order_date) as date,
        COUNT(*) as orders
      FROM oe_hdr
      WHERE order_date >= date('now', '-7 days')
      GROUP BY date(order_date)
      ORDER BY date DESC
    `;
    
    const result = await executeAdminQuery(sql);
    const data = result.value ? [{ orders: result.value }] : [];
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching daily orders:', error);
    return NextResponse.json({ error: 'Failed to fetch daily orders' }, { status: 500 });
  }
}
