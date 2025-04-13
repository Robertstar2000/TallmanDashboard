// app/api/admin/spreadsheet-data/update/route.ts
import { NextResponse } from 'next/server';
import { ChartDataRow } from '@/lib/db/types';
import { updateSpreadsheetData } from '@/lib/db/server'; // We will create this function next

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as ChartDataRow[];

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array.' },
        { status: 400 }
      );
    }

    // TODO: Add validation logic for the data array if necessary

    // Call the database function to update the data
    await updateSpreadsheetData(data);

    return NextResponse.json({ message: 'Data updated successfully' });

  } catch (error) {
    console.error('API Error updating spreadsheet data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: `Failed to update spreadsheet data: ${errorMessage}` },
      { status: 500 }
    );
  }
}
