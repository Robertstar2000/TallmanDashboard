import { NextResponse } from 'next/server';
import { executeRead } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const sql = `
      SELECT 
        category,
        SUM(in_stock) as inStock,
        SUM(on_order) as onOrder
      FROM inv_mstr
      WHERE category IN ('100', '101', '102', '107')
      GROUP BY category
      ORDER BY category ASC
    `;
    
    const data = await executeRead(sql);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory data' }, { status: 500 });
  }
}
