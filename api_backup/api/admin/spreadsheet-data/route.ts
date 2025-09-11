import { NextResponse } from 'next/server';
import { getAllSpreadsheetData } from '@/lib/db/server'; 
import { ChartDataRow } from '@/lib/db/types'; 
import Database from 'better-sqlite3'; 

// Define DB_PATH locally as constants file wasn't found
const DB_PATH = './data/dashboard.db'; 

interface SpreadsheetDataResponse {
  data: ChartDataRow[];
  sqliteAvailable?: boolean; 
  error?: string;
  details?: string; 
}

export async function GET(request: Request) {
  let sqliteAvailable = false; 
  try {
    console.log('API Route: /api/admin/spreadsheet-data called');

    // --- Check SQLite Availability ---
    try {
      console.log(`API Route: Checking SQLite DB at ${DB_PATH}`);
      const db = new Database(DB_PATH, { fileMustExist: true }); 
      db.close(); 
      sqliteAvailable = true;
      console.log('API Route: SQLite DB is available.');
    } catch (dbError) {
      console.warn('API Route: SQLite DB check failed (DB likely not found or inaccessible):', dbError instanceof Error ? dbError.message : dbError);
      // Do not throw; let the main operation continue, but flag as unavailable
      sqliteAvailable = false;
    }
    // ---------------------------------

    const data = getAllSpreadsheetData(); 
    console.log('API Route: getAllSpreadsheetData result count:', data.length);
    
    // Include sqliteAvailable in the successful response
    return NextResponse.json<SpreadsheetDataResponse>({ data, sqliteAvailable });

  } catch (error) {
    console.error('API Error fetching spreadsheet data:', error instanceof Error ? error.stack : error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Include sqliteAvailable (which will be false here) in the error response too
    return NextResponse.json<SpreadsheetDataResponse>(
      { data: [], error: `Failed to fetch spreadsheet data: ${errorMessage}`, details: errorMessage, sqliteAvailable }, 
      { status: 500 }
    );
  }
}
