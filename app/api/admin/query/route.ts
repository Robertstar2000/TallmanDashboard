import { NextResponse } from 'next/server';
import path from 'path';
import BetterSQLite3 from 'better-sqlite3';

export async function POST(request: Request) {
  try {
    const { sql, params = [], server } = await request.json();

    // For now, always use SQLite
    const database = new BetterSQLite3(path.join(process.cwd(), 'data', 'dashboard.db'));
    try {
      const stmt = database.prepare(sql);
      const results = stmt.all(...params);
      return NextResponse.json({ results });
    } catch (error) {
      console.error('Error executing query:', error);
      return NextResponse.json({ error: 'Query execution failed' }, { status: 500 });
    } finally {
      database.close();
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
