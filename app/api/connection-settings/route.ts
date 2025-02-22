import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/sqlite';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type !== 'p21' && type !== 'por') {
      return NextResponse.json(
        { error: 'Invalid connection type. Must be either "p21" or "por"' },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: 'SELECT settings, last_updated FROM connection_settings WHERE id = ?',
      args: [type]
    });

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving connection settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve connection settings' },
      { status: 500 }
    );
  }
}
