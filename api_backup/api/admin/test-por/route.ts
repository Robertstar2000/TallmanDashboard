import { NextRequest, NextResponse } from 'next/server';
import { testPORConnectionServer } from '@/lib/db/server';
import { DatabaseConnection } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  console.log('Received request for /api/admin/test-por');
  try {
    const body = await req.json();
    console.log('Request body for POR test:', body);

    // Ensure body contains the necessary DatabaseConnection fields for POR
    // The testPORConnectionServer function expects 'filePath' and optionally 'password'
    if (!body || typeof body.filePath !== 'string') {
      console.error('Invalid request body for POR test:', body);
      return NextResponse.json({ success: false, message: 'Invalid request: filePath is required.' }, { status: 400 });
    }

    // Construct the connection details object
    const connectionDetails: DatabaseConnection = {
      // Include only relevant fields for POR connection test
      filePath: body.filePath,
      password: body.password || undefined, // Pass password if provided
      // Other fields from DatabaseConnection are not needed here
      server: '',
      database: '',
      username: '',
    };

    console.log('Calling testPORConnectionServer with:', {filePath: connectionDetails.filePath, password: connectionDetails.password ? '***' : 'none'});
    const result = await testPORConnectionServer(connectionDetails);
    console.log('Result from testPORConnectionServer:', result);

    // Return the result from the test function
    const status = result.success ? 200 : 500; // Use 500 for failed connection tests
    return NextResponse.json(result, { status });

  } catch (error) {
    console.error('Error processing /api/admin/test-por request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
    return NextResponse.json({ success: false, message: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}

// Optional: Add GET handler or other methods if needed, otherwise Next.js might complain
export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
