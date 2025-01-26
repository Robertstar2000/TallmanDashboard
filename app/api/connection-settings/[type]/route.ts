import { NextResponse } from 'next/server';
import { db } from '@/lib/db/sqlite';

export function generateStaticParams() {
  return [
    { type: 'p21' },
    { type: 'por' }
  ];
}

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type;
    if (type !== 'p21' && type !== 'por') {
      return NextResponse.json(
        { error: 'Invalid connection type' },
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
