import { NextResponse } from 'next/server';
import { executeRead } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const sql = `
      SELECT 
        month,
        new_rentals as newRentals,
        open_rentals as openRentals,
        rental_value as rentalValue
      FROM por_data
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const data = await executeRead(sql);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching POR data:', error);
    return NextResponse.json({ error: 'Failed to fetch POR data' }, { status: 500 });
  }
}
