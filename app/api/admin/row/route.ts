import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/sqlite';

export async function POST(request: Request) {
  try {
    const { rowId } = await request.json();
    
    if (!rowId) {
      return NextResponse.json(
        { error: 'Row ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`API: Fetching row data for row ${rowId}`);
    
    // Get the database connection
    const db = await getDb();
    
    // Query the database for the row
    const row = await db.get(
      'SELECT * FROM spreadsheet_rows WHERE id = ?',
      [rowId]
    );
    
    if (!row) {
      return NextResponse.json(
        { error: `Row with ID ${rowId} not found` },
        { status: 404 }
      );
    }
    
    console.log(`API: Found row data for row ${rowId}:`, row);
    
    return NextResponse.json({
      success: true,
      data: row
    });
  } catch (error) {
    console.error('Error fetching row data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch row data' },
      { status: 500 }
    );
  }
}
