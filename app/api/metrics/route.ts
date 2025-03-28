import { NextResponse } from 'next/server';
import { executeRead } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const data = await executeRead('SELECT * FROM metrics');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
