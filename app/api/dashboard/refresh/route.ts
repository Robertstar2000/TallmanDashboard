
import { NextResponse } from 'next/server';
import { getChartData } from '@/lib/db/sqlite';

export async function GET() {
  try {
    // Force a refresh of the chart data
    console.log('Refreshing dashboard data cache');
    const chartData = await getChartData(true); // Pass true to force a refresh
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      rowCount: chartData.length,
      message: 'Dashboard data cache refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
