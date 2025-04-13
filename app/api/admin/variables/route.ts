import { NextResponse, NextRequest } from 'next/server';
import { getAdminVariables, updateAdminVariable } from '@/lib/db/server'; // Adjust path if needed
import { ServerConfig } from '@/lib/db/types'; // Adjust path if needed

// GET handler to fetch all admin variables
export async function GET(request: NextRequest) {
  console.log('API Route: /api/admin/variables received GET request');
  try {
    const variables = getAdminVariables(); // This is synchronous in the current server.ts
    console.log(`API Route: Sending ${variables.length} admin variables.`);
    return NextResponse.json(variables, { status: 200 });
  } catch (error: any) {
    console.error('API Route: Error fetching admin variables:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch admin variables.' }, { status: 500 });
  }
}

// PUT handler to update a specific admin variable
export async function PUT(request: NextRequest) {
  console.log('API Route: /api/admin/variables received PUT request');
  try {
    const body = await request.json();
    console.log('API Route: Request body for update:', body);

    // Basic validation (Consider Zod)
    if (!body || typeof body !== 'object' || !body.id || typeof body.id !== 'string' || !body.data || typeof body.data !== 'object') {
      console.error('API Route: Invalid PUT request body structure.');
      return NextResponse.json({ success: false, message: 'Invalid request body. Expecting { id: string, data: object }.' }, { status: 400 });
    }

    const { id, data } = body;
    // Ensure 'data' conforms to Partial<Omit<ServerConfig, 'id' | 'lastUpdated'>>
    // (Further runtime validation might be needed depending on strictness)
    const updateData: Partial<Omit<ServerConfig, 'id' | 'lastUpdated'>> = data;

    const success = updateAdminVariable(id, updateData); // Synchronous in current server.ts

    console.log(`API Route: Update result for ID ${id}: ${success}`);
    if (success) {
      return NextResponse.json({ success: true, message: `Variable ${id} updated successfully.` }, { status: 200 });
    } else {
      // updateAdminVariable logs errors internally, return a generic failure or specific if possible
      return NextResponse.json({ success: false, message: `Failed to update variable ${id}. Check server logs.` }, { status: 400 }); // 400 or 500 depending on cause
    }

  } catch (error: any) {
    console.error('API Route: Error processing admin variable update request:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ success: false, message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error while updating admin variable.' }, { status: 500 });
  }
}
