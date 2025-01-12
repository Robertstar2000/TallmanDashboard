import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

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

    const result = await sql`
      SELECT settings, last_updated
      FROM connection_settings
      WHERE id = ${type};
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: type,
      settings: result.rows[0].settings,
      lastUpdated: result.rows[0].last_updated
    });
  } catch (error) {
    console.error('Error getting connection settings:', error);
    return NextResponse.json(
      { error: 'Failed to get connection settings' },
      { status: 500 }
    );
  }
}
