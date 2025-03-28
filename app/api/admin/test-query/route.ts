import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/query-executor';

/**
 * API endpoint to test the query executor directly
 * This is useful for testing MS Access connections
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { server, sql, testMode } = body;
    
    console.log(`TEST-QUERY: Testing query executor with:`, {
      server,
      sql,
      testMode
    });
    
    // Validate required parameters
    if (!server || !sql) {
      console.error('TEST-QUERY: Missing required parameters');
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Execute the query using the query executor
    const result = await executeQuery({
      server,
      sql,
      testMode
    });
    
    console.log(`TEST-QUERY: Query executor result:`, result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('TEST-QUERY: Error testing query executor:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'other'
      },
      { status: 500 }
    );
  }
}
