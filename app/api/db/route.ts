import { NextResponse } from 'next/server';
import { executeAdminQuery } from '@/lib/db/sqlite';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sql = searchParams.get('sql');

    if (!sql) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
    }

    console.log('Executing query:', sql);
    
    const result = await executeAdminQuery(sql);
    return NextResponse.json({ data: result.value });
  } catch (error) {
    console.error('Error in DB API:', error);
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sql } = body;

    if (!sql) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
    }

    console.log('Executing query:', sql);
    const result = await executeAdminQuery(sql);
    return NextResponse.json({ data: result.value });
  } catch (error) {
    console.error('Error in DB API:', error);
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
  }
}
