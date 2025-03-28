import { NextResponse } from 'next/server';
import { executeRead, executeWrite } from '@/lib/db/sqlite';
import { P21_SCHEMA } from '@/lib/db/p21-schema';

export async function GET() {
  try {
    const sql = `
      SELECT 
        date as month,
        orders as W_Orders,
        revenue as W_Revenue
      FROM web_orders
      ORDER BY date DESC
      LIMIT 12
    `;
    
    const data = await executeRead(sql);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching web metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch web metrics' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, W_Orders, W_Revenue } = body;

    const sql = `
      INSERT OR REPLACE INTO web_metrics (month, W_Orders, W_Revenue)
      VALUES (?, ?, ?)
    `;

    await executeWrite(sql, [month, W_Orders, W_Revenue]);
    return NextResponse.json({ message: 'Web metrics updated successfully' });
  } catch (error) {
    console.error('Error updating web metrics:', error);
    return NextResponse.json({ error: 'Failed to update web metrics' }, { status: 500 });
  }
}
