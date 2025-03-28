import { NextResponse } from 'next/server';
import { executeWrite } from '@/lib/db/sqlite';
import { executeRead } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const sql = `
      SELECT 
        month,
        p21,
        por,
        p21 + por as total
      FROM historical_data
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const data = await executeRead(sql);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, p21, por, total } = body;

    const sql = `
      INSERT OR REPLACE INTO historical_data (month, p21, por, total)
      VALUES (?, ?, ?, ?)
    `;

    await executeWrite(sql, [month, p21, por, total]);
    return NextResponse.json({ message: 'Historical data updated successfully' });
  } catch (error) {
    console.error('Error updating historical data:', error);
    return NextResponse.json({ error: 'Failed to update historical data' }, { status: 500 });
  }
}
