import { NextResponse } from 'next/server';
import { startWorker } from '@/lib/worker/sqlExecutor';

/**
 * API route handler for starting the SQL execution worker.
 * Only accepts POST requests.
 */
export async function POST(request: Request) {
  try {
    console.log('/api/admin/worker/start POST request received');
    const result = startWorker();
    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      // Worker might already be running, which isn't strictly an error for the caller
      return NextResponse.json({ message: result.message }, { status: 200 }); // Or use 409 Conflict if preferred
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error starting worker:', error);
    return NextResponse.json(
      { message: `Failed to start worker: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}

// Optional: Add a GET handler if you want to prevent access via GET
// export async function GET(request: Request) {
//   return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
// }
