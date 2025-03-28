import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db/connections';
import { getDb } from '@/lib/db/sqlite';

export async function POST(request: Request) {
  try {
    // Get server name from request body
    const body = await request.json();
    const { server, config } = body;
    
    if (!server) {
      return NextResponse.json({ 
        error: 'Server name is required' 
      }, { status: 400 });
    }
    
    // Get the connection and check its status
    const connection = await getConnection(server);
    const result = await connection.checkConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking database connection:', error);
    let errorMessage = 'Failed to check database connection';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      isConnected: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// Sqlite-specific health check
export async function GET() {
  try {
    const db = await getDb();
    
    // Simple query to check if database is working
    try {
      // Check if chart_data table exists
      const tableCheck = await db.get(`SELECT name FROM sqlite_master 
                                      WHERE type='table' AND name='chart_data'`);
      
      if (!tableCheck) {
        await db.close();
        return NextResponse.json({
          isConnected: false,
          error: 'Database tables not initialized'
        });
      }
      
      // Check if there's data
      const countResult = await db.get('SELECT COUNT(*) as count FROM chart_data');
      const hasData = countResult && countResult.count > 0;
      
      await db.close();
      
      if (!hasData) {
        return NextResponse.json({
          isConnected: true,
          warning: 'Database initialized but no data found'
        });
      }
      
      return NextResponse.json({
        isConnected: true
      });
      
    } catch (queryError) {
      await db.close();
      console.error('Error querying SQLite database:', queryError);
      return NextResponse.json({
        isConnected: false,
        error: 'Error querying database'
      });
    }
  } catch (error) {
    console.error('Error connecting to SQLite database:', error);
    let errorMessage = 'Failed to connect to SQLite database';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      isConnected: false,
      error: errorMessage
    });
  }
}
