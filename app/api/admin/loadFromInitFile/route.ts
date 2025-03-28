/**
 * API endpoint to load database content from the single source data file
 * 
 * POST /api/admin/loadFromInitFile
 * Loads database content (chart data, chart group settings, connection data) from the single-source-data.ts file into the database
 */

import { NextResponse } from 'next/server';
import { loadDbFromInitFile, getChartData } from '@/lib/db/sqlite';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    console.log('API: Loading database content from single source data file...');
    
    // Call the function to load database content from the single source data file
    await loadDbFromInitFile();
    
    // Verify the data was loaded by retrieving a sample
    const chartData = await getChartData();
    console.log(`API: Verified data load - retrieved ${chartData.length} rows`);
    
    // Revalidate the admin path to ensure fresh data is shown
    revalidatePath('/admin');
    
    console.log('API: Successfully loaded database content from single source data file');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database content loaded from single source data file successfully',
      rowCount: chartData.length
    });
  } catch (error) {
    console.error('API: Error loading database content from single source data file:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to load database content from single source data file',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
