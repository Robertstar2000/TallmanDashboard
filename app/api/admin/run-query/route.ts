import { NextResponse } from 'next/server';
import { executeP21QueryServer, executePORQueryServer } from '@/lib/db/server';

interface RunQueryRequest {
  sqlQuery: string;
  targetDatabase: 'P21' | 'POR';
  porFilePath?: string;
  porPassword?: string;
}

interface QueryResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  error?: string;
  message?: string;
  executionTime?: number;
}

const isQuerySafe = (query: string): boolean => {
  const trimmedQuery = query.trim().toUpperCase();
  const blockKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE', 'GRANT', 'REVOKE', 'SET'];
  const keywordRegex = new RegExp(`(?:\s|^|\(|\[|;|,)${blockKeywords.join('|')}(?:\s|$|\)|\]|;|,|--)`, 'i');
  return !keywordRegex.test(query);
};

export async function POST(request: Request) {
  let startTime = Date.now();
  try {
    const body: RunQueryRequest = await request.json();
    const { sqlQuery, targetDatabase, porFilePath, porPassword } = body;

    if (!sqlQuery || !targetDatabase) {
      return NextResponse.json<QueryResult>({ success: false, error: 'Missing sqlQuery or targetDatabase in request body.' }, { status: 400 });
    }
    if (targetDatabase === 'POR' && !porFilePath) {
        return NextResponse.json<QueryResult>({ success: false, error: 'Missing porFilePath for POR query.' }, { status: 400 });
    }

    if (!isQuerySafe(sqlQuery)) {
      console.warn(`[API run-query] Rejected unsafe query for ${targetDatabase}: ${sqlQuery.substring(0, 100)}...`);
      return NextResponse.json<QueryResult>({ success: false, error: 'Query rejected. Only SELECT statements are allowed, and modification keywords (INSERT, UPDATE, DELETE, etc.) are forbidden.' }, { status: 403 }); 
    }

    console.log(`[API run-query] Received safe query for ${targetDatabase}: ${sqlQuery.substring(0, 100)}...`);

    let result: QueryResult;

    if (targetDatabase === 'P21') {
        console.log("[API run-query] Executing P21 query...");
        result = await executeP21QueryServer(sqlQuery);
    } else if (targetDatabase === 'POR') {
        console.log(`[API run-query] Executing POR query on path: ${porFilePath}...`);
        result = await executePORQueryServer(porFilePath!, porPassword, sqlQuery);
    } else {
         return NextResponse.json<QueryResult>({ success: false, error: `Invalid target database: ${targetDatabase}` }, { status: 400 });
    }

    const executionTime = Date.now() - startTime; 
    console.log(`[API run-query] Query finished in ${result.executionTime ?? executionTime}ms. Success: ${result.success}`);

    return NextResponse.json<QueryResult>(result, { status: result.success ? 200 : 500 }); 

  } catch (error: any) {
    console.error('[API run-query] Error processing request:', error);
    const executionTime = Date.now() - startTime;
    return NextResponse.json<QueryResult>(
      {
        success: false,
        error: error.message || 'An unexpected error occurred on the server.',
        executionTime: executionTime,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
