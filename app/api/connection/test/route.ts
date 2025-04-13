import { NextResponse, NextRequest } from 'next/server';
import { DatabaseConnection } from '@/lib/db/types'; 
import { testP21ConnectionServer, testPORConnectionServer } from '@/lib/db/server'; 

export async function POST(request: NextRequest) {
  console.log('API Route: /api/connection/test POST handler'); 
  try {
    // Get the full connection details from the body
    const body: DatabaseConnection & { type: 'P21' | 'POR' } = await request.json(); 
    console.log('Received connection test request for type:', body.type); 

    if (!body || !body.type) {
        return NextResponse.json({ success: false, message: 'Invalid request: Missing connection type.' }, { status: 400 });
    }

    let result;
    if (body.type === 'P21') {
        // No longer need body validation as P21 uses DSN from environment variable
        console.log('Calling testP21ConnectionServer (uses P21_DSN env var)...');
        result = await testP21ConnectionServer(); 
    } else if (body.type === 'POR') {
        // Validate required POR fields
        if (!body.filePath) {
            return NextResponse.json({ success: false, message: 'POR connection requires File Path.' }, { status: 400 });
        }
        console.log('Calling testPORConnectionServer...');
        result = await testPORConnectionServer(body);
    } else {
        return NextResponse.json({ success: false, message: `Unsupported connection type: ${body.type}` }, { status: 400 });
    }

    console.log('Connection test result:', result);

    // Return the result from the server-side test function
    // If the test failed internally, result.success will be false.
    // Send a 200 OK status if the API call itself succeeded, 
    // let the client interpret result.success for connection status.
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('API Error in /api/connection/test:', error);
    // Handle JSON parsing errors or other unexpected issues
    const message = error instanceof Error ? error.message : 'An unknown server error occurred during connection test.';
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 } 
    );
  }
}
