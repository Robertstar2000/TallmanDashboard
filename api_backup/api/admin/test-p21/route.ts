import { NextResponse, NextRequest } from 'next/server';
import { DatabaseConnection } from '@/lib/db/types'; 
import { testP21ConnectionServer } from '@/lib/db/server'; 

// POST endpoint to test P21 connection
export async function POST(request: NextRequest) {
  console.log('API Route: /api/admin/test-p21 POST handler');
  try {
    const body: DatabaseConnection = await request.json();
    console.log('P21 Test Request Body:', body);

    // Check environment variables first
    const p21Dsn = process.env.P21_DSN;
    console.log('P21_DSN environment variable:', p21Dsn);
    
    if (!p21Dsn) {
      return NextResponse.json({ 
        success: false, 
        message: 'P21_DSN environment variable is not configured. Please set P21_DSN in .env.local file.',
        details: 'Environment check failed: P21_DSN is undefined'
      }, { status: 500 });
    }

    // Basic validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid request body: Expected connection details object.',
        details: 'Request validation failed'
      }, { status: 400 });
    }
    
    // For P21, we primarily use DSN, but still validate basic fields
    if (!body.server || !body.database) {
      return NextResponse.json({ 
        success: false, 
        message: 'Server and Database Name are required for P21 test.',
        details: `Missing required fields: server=${body.server}, database=${body.database}`
      }, { status: 400 });
    }

    console.log('Calling testP21ConnectionServer with DSN:', p21Dsn);
    // Call the server-side function
    const result = await testP21ConnectionServer(body);

    console.log('P21 Connection test result:', result);

    // Return detailed response
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message || 'P21 connection successful!',
        details: `Successfully connected using DSN: ${p21Dsn}`
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: result.message || 'P21 connection failed.',
        details: `Connection failed using DSN: ${p21Dsn}. Check if the DSN is configured in Windows ODBC Data Source Administrator.`
      }, { status: 400 });
    }

  } catch (error) {
    console.error('API Error testing P21 connection:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    
    return NextResponse.json({ 
      success: false, 
      message: `Failed to test P21 connection: ${errorMessage}`,
      details: `Error details: ${errorStack}`
    }, { status: 500 });
  }
}
