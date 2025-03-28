import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
  try {
    // Try to open the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    const db = new Database(dbPath);
    
    // Test a simple query
    db.prepare('SELECT 1').get();
    
    // Close the connection
    db.close();
    
    return NextResponse.json({ connected: true });
  } catch (error) {
    console.error('SQLite health check failed:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to connect to SQLite database' },
      { status: 200 } // Still return 200 as this is a health check
    );
  }
}
