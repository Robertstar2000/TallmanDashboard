import { NextResponse } from 'next/server';
import { executeRead } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const sql = `
      SELECT name, value
      FROM site_distribution
      ORDER BY value DESC
    `;
    
    const rawData = await executeRead(sql);
    const transformedData = rawData.map((item: any) => ({
      name: item.name,
      value: Number(item.value)
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching site distribution:', error);
    return NextResponse.json({ error: 'Failed to fetch site distribution' }, { status: 500 });
  }
}
