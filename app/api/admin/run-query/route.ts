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
  const upper = query.toUpperCase();
  const blockKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE', 'GRANT', 'REVOKE', 'SET'];
  const keywordRegex = new RegExp(`\\b(${blockKeywords.join('|')})\\b`, 'i');

  if (!upper.includes('SELECT')) {
    return false; // Must contain SELECT
  }

  return !keywordRegex.test(upper);
}; 

export async function POST(request: Request) {
  console.log('[API run-query] POST request received.'); // Log start
  let startTime = Date.now();
  try {
    console.log('[API run-query] Parsing request body...'); // Log before parsing
    const body: RunQueryRequest = await request.json();
    const { sqlQuery, targetDatabase, porFilePath: reqPorPath, porPassword } = body;
    const porPath = reqPorPath || process.env.POR_DB_PATH;
    console.log(`[API run-query] Parsed request body. Target Database: ${targetDatabase}`); // Log after parsing

    if (!sqlQuery || !targetDatabase) {
      console.log('[API run-query] Missing sqlQuery or targetDatabase in request body.'); // Log error
      return NextResponse.json<QueryResult>({ success: false, error: 'Missing sqlQuery or targetDatabase in request body.' }, { status: 400 });
    }
    if (targetDatabase === 'POR' && !porPath) {
        console.log('[API run-query] POR file path not provided and POR_DB_PATH env var is missing.');
        return NextResponse.json<QueryResult>({ success: false, error: 'POR database path is not specified.' }, { status: 400 });
    }

    console.log(`[API run-query] Checking if query is safe: ${sqlQuery.substring(0, 100)}...`); // Log before safety check
    if (!isQuerySafe(sqlQuery)) {
      console.log(`[API run-query] Rejected unsafe query for ${targetDatabase}: ${sqlQuery.substring(0, 100)}...`); // Log safety check failure
      return NextResponse.json<QueryResult>({ success: false, error: 'Query rejected. Only SELECT statements are allowed, and modification keywords (INSERT, UPDATE, DELETE, etc.) are forbidden.' }, { status: 403 }); 
    }

    console.log(`[API run-query] Query is safe. Proceeding with execution for ${targetDatabase}: ${sqlQuery.substring(0, 100)}...`); // Log safety check success

    console.log(`[API run-query] Executing query for ${targetDatabase}...`); // Log before query execution
    let result: QueryResult;

    if (targetDatabase === 'P21') {
        console.log("[API run-query] Calling executeP21QueryServer for query: ${sqlQuery.substring(0, 100)}..."); // Log before call
        result = await executeP21QueryServer(sqlQuery);
        console.log('[API run-query] Received result from executeP21QueryServer:', JSON.stringify(result, null, 2)); // Log after call
    } else if (targetDatabase === 'POR') {
        console.log(`[API run-query] Calling executePORQueryServer for query on path: ${porPath}...`);
        result = await executePORQueryServer(porPath!, porPassword, sqlQuery);
        console.log('[API run-query] Received result from executePORQueryServer:', JSON.stringify(result, null, 2)); // Log after call
    } else {
         console.log(`[API run-query] Invalid target database: ${targetDatabase}`); // Log error
         return NextResponse.json<QueryResult>({ success: false, error: `Invalid target database: ${targetDatabase}` }, { status: 400 });
    }

    console.log('[API run-query] Preparing JSON response.'); // Log before response
    const executionTime = Date.now() - startTime; 
    console.log(`[API run-query] Query finished in ${result.executionTime ?? executionTime}ms. Success: ${result.success}`);

    return NextResponse.json<QueryResult>(result, { status: result.success ? 200 : 500 }); 

  } catch (error: any) {
    console.error('[API run-query] Uncaught error in POST handler:', error); // Log outer catch block error
    // Log the error details if possible
    const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error';
    console.error(`[API run-query] Error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);

    const executionTime = Date.now() - startTime;
    return NextResponse.json<QueryResult>(
      {
        success: false,
        error: 'Internal Server Error during query execution.',
        executionTime: executionTime,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

export const config = { runtime: 'nodejs' };
