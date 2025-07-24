import { NextResponse } from 'next/server';
import { testP21ConnectionServer, testPORConnectionServer, testSQLiteConnectionServer } from '@/lib/db/server';
import { DatabaseStatus } from '@/lib/db/types';

export async function GET() {
  try {
    const p21Dsn = process.env.P21_DSN;
    const porPath = process.env.NEXT_PUBLIC_POR_DB_PATH;

    const p21Promise = testP21ConnectionServer({ serverName: 'P21', dsn: p21Dsn });
    const porPromise = testPORConnectionServer({ serverName: 'POR', filePath: porPath });
    const sqlitePromise = testSQLiteConnectionServer();

    const [p21Result, porResult, sqliteResult] = await Promise.all([
      p21Promise,
      porPromise,
      sqlitePromise,
    ]);

    const statuses: DatabaseStatus[] = [
      {
        serverName: 'P21',
        status: p21Result.success ? 'connected' : 'error',
        details: { dsn: p21Dsn },
        error: p21Result.success ? undefined : p21Result.message,
      },
      {
        serverName: 'POR',
        status: porResult.success ? 'connected' : 'error',
        details: { filePath: porPath },
        error: porResult.success ? undefined : porResult.message,
      },
      {
        serverName: 'SQLite',
        status: sqliteResult.success ? 'connected' : 'error',
        details: { filePath: sqliteResult.path },
        error: sqliteResult.success ? undefined : sqliteResult.message,
      },
    ];

    return NextResponse.json({ statuses });

  } catch (error) {
    console.error('Error in /api/admin/connection-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to check connection statuses: ${errorMessage}` }, { status: 500 });
  }
}
