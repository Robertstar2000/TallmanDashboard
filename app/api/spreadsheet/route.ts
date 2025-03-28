import { NextResponse } from 'next/server';
import { initialSpreadsheetData, SpreadsheetRow } from '@/lib/db/initial-data';

export async function GET() {
  try {
    return NextResponse.json(initialSpreadsheetData);
  } catch (error) {
    console.error('Error fetching spreadsheet data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as SpreadsheetRow[];
    // In a real app, you would save this to a database
    // For now, we'll just return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving spreadsheet data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
