import { NextResponse } from 'next/server';
import { getWorkerStatus } from '@/lib/worker/sqlExecutor';

/**
 * API route handler for getting the status of the SQL execution worker.
 * Only accepts GET requests.
 */
export async function GET(request: Request) {
  try {
    console.log('/api/admin/worker/status GET request received');
    const status = getWorkerStatus();
    return NextResponse.json({ isRunning: status.isRunning }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error getting worker status:', error);
    return NextResponse.json(
      { message: `Failed to get worker status: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}

// Optional: Add a POST handler if you want to prevent access via POST
// export async function POST(request: Request) {
//   return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
// }
