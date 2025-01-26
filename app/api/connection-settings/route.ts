import { NextResponse } from 'next/server';
import { StoredConnectionSettings } from '@/lib/db/connection-settings';
import { db } from '@/lib/db/sqlite';

// Create a table for storing connection settings if it doesn't exist
async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS connection_settings (
      id TEXT PRIMARY KEY,
      settings TEXT NOT NULL,
      last_updated TEXT NOT NULL
    )
  `);
}

export async function POST(request: Request) {
  try {
    await ensureTable();
    const data: StoredConnectionSettings = await request.json();

    await db.execute({
      sql: `
        INSERT OR REPLACE INTO connection_settings (id, settings, last_updated)
        VALUES (?, ?, ?)
      `,
      args: [data.id, JSON.stringify(data.settings), data.lastUpdated]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving connection settings:', error);
    return NextResponse.json(
      { error: 'Failed to save connection settings' },
      { status: 500 }
    );
  }
}
