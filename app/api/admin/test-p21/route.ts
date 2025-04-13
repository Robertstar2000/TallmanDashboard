import { NextResponse, NextRequest } from 'next/server';
import { DatabaseConnection } from '@/lib/db/types'; 
import { testP21ConnectionServer } from '@/lib/db/server'; 

// POST endpoint to test P21 connection
export async function POST(request: NextRequest) {
  console.log('API Route: /api/admin/test-p21 POST handler');
  try {
    const body: DatabaseConnection = await request.json();

    // Basic validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ message: 'Invalid request body: Expected connection details object.' }, { status: 400 });
    }
    if (body.type !== 'P21') {
         return NextResponse.json({ message: 'Invalid connection type specified.' }, { status: 400 });
    }
    // Validate 'server' and 'database' (matching the updated testP21ConnectionServer)
    if (!body.server || !body.database) {
      return NextResponse.json({ message: 'Server and Database Name are required for P21 test.' }, { status: 400 });
    }

    console.log('Calling testP21ConnectionServer...');
    // Call the server-side function
    const result = await testP21ConnectionServer(body);

    console.log('P21 Connection test result:', result);

    // The result object structure might vary, adjust as needed
    // Assuming it returns { success: boolean, message?: string }
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message || 'P21 connection successful!' });
    } else {
      // Return a 400 or 500 status depending on whether it's a user error or server error
      // For simplicity, returning 400 for connection failure here
      return NextResponse.json({ success: false, message: result.message || 'P21 connection failed.' }, { status: 400 });
    }

  } catch (error) {
    console.error('API Error testing P21 connection:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Return 500 for internal server errors during the test process
    return NextResponse.json({ success: false, message: `Failed to test P21 connection: ${errorMessage}` }, { status: 500 });
  }
}
