import { NextResponse } from 'next/server';
import { StoredConnectionSettings } from '@/lib/db/connection-settings';
import { sql } from '@vercel/postgres';

// Create a table for storing connection settings if it doesn't exist
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS connection_settings (
      id VARCHAR(10) PRIMARY KEY,
      settings JSONB NOT NULL,
      last_updated TIMESTAMP WITH TIME ZONE NOT NULL
    );
  `;
}

export async function POST(request: Request) {
  try {
    await ensureTable();
    const data: StoredConnectionSettings = await request.json();

    await sql`
      INSERT INTO connection_settings (id, settings, last_updated)
      VALUES (${data.id}, ${JSON.stringify(data.settings)}, ${data.lastUpdated})
      ON CONFLICT (id) DO UPDATE
      SET settings = ${JSON.stringify(data.settings)},
          last_updated = ${data.lastUpdated};
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving connection settings:', error);
    return NextResponse.json(
      { error: 'Failed to save connection settings' },
      { status: 500 }
    );
  }
}
