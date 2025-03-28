import { NextResponse } from 'next/server';
import { saveDbToInitFile } from '@/lib/db/sqlite';

/**
 * API endpoint to save the current database content to the single source data file
 * This includes chart data, chart group settings, and connection data
 * POST /api/admin/saveToInitFile
 */
export async function POST() {
  try {
    console.log('Admin: Saving database content to single source data file');
    
    // Save the database content to the single source data file
    await saveDbToInitFile();
    
    return NextResponse.json({
      success: true,
      message: 'Database content saved to single source data file successfully'
    });
  } catch (error) {
    console.error('Error saving database content to single source data file:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to save database content to single source data file: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
