import { NextResponse } from 'next/server';
import { saveSpreadsheetRow } from '@/lib/db/sqlite';

export async function POST(request: Request) {
  try {
    const { row } = await request.json();
    
    if (!row || !row.id) {
      return NextResponse.json(
        { error: 'Invalid row data' },
        { status: 400 }
      );
    }
    
    // Save the row to the database
    await saveSpreadsheetRow(row);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating row data:', error);
    return NextResponse.json(
      { error: 'Failed to update row data' },
      { status: 500 }
    );
  }
}
