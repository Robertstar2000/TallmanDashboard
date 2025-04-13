import { NextResponse } from 'next/server';
import { stopWorker } from '@/lib/worker/sqlExecutor';

/**
 * API route handler for stopping the SQL execution worker.
 * Only accepts POST requests.
 */
export async function POST(request: Request) {
  try {
    console.log('/api/admin/worker/stop POST request received');
    const result = stopWorker();
    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      // Worker might already be stopped
      return NextResponse.json({ message: result.message }, { status: 200 }); // Or 409 Conflict
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error stopping worker:', error);
    return NextResponse.json(
      { message: `Failed to stop worker: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}

// Optional: Add a GET handler if you want to prevent access via GET
// export async function GET(request: Request) {
//   return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
// }
