import { NextResponse } from 'next/server';
import { testSqliteConnection } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const result = await testSqliteConnection();
    
    if (result.isConnected) {
      return NextResponse.json({
        isConnected: true,
        details: ['✓ SQLite database is accessible']
      });
    } else {
      return NextResponse.json({
        isConnected: false,
        error: result.error || 'SQLite connection failed',
        details: ['✗ SQLite database is not accessible', result.error]
      });
    }
  } catch (error) {
    console.error('SQLite health check error:', error);
    return NextResponse.json({
      isConnected: false,
      error: 'Failed to perform SQLite health check',
      details: [error instanceof Error ? error.message : 'Unknown error occurred']
    }, { status: 500 });
  }
}
