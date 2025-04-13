import { NextResponse } from 'next/server';
import { getAdminVariables, updateAdminVariable } from '@/lib/db/server';
import { ServerConfig } from '@/lib/db/types';

// GET endpoint to retrieve all admin variables (connection settings)
export async function GET(request: Request) {
  try {
    const variables = await getAdminVariables();
    return NextResponse.json(variables);
  } catch (error) {
    console.error('API Error getting connection settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to fetch connection settings: ${errorMessage}` }, { status: 500 });
  }
}

// POST endpoint to update multiple admin variables (connection settings)
export async function POST(request: Request) {
  try {
    const updates: Partial<ServerConfig>[] = await request.json(); 
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid request body: Expected an array of setting updates.' }, { status: 400 });
    }

    // Validate and update each setting individually
    const results = await Promise.all(updates.map(update => {
      if (!update.id || typeof update.id !== 'string') {
        console.warn('API POST /connection-settings: Skipping update with missing/invalid id:', update);
        return { id: update.id, success: false, message: 'Missing or invalid ID' };
      }
      // Destructure to remove 'id' from the data passed to the server function
      const { id, ...dataToUpdate } = update;
      return updateAdminVariable(id, dataToUpdate);
    }));

    // Normalize results to a boolean array indicating success for each attempt
    const successFlags: boolean[] = results.map(result => {
      if (typeof result === 'boolean') {
        return result; // updateAdminVariable returned boolean
      } else if (typeof result === 'object' && result !== null && 'success' in result) {
        return result.success; // Error object or successful update object
      }
      return false; // Should not happen, but default to false
    });

    // Check if all updates were successful
    const allSucceeded = successFlags.every(Boolean); // Simpler check on boolean array
    
    if (allSucceeded) {
      return NextResponse.json({ success: true, message: 'Connection settings updated successfully.' });
    } else {
      console.error('API Error updating connection settings:', results);
      const errorMessage = 'Failed to update connection settings: One or more updates failed.';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error('API Error updating connection settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to update connection settings: ${errorMessage}` }, { status: 500 });
  }
}

// Helper to ensure only valid ServerConfig fields are passed (optional, defensive programming)
function sanitizeUpdateData(data: any): Partial<Omit<ServerConfig, 'id' | 'lastUpdated'>> {
  const allowedFields: (keyof Omit<ServerConfig, 'id' | 'lastUpdated'>)[] = 
    ['name', 'type', 'value', 'description', 'isActive'];
  const sanitized: Partial<Omit<ServerConfig, 'id' | 'lastUpdated'>> = {};
  for (const key of allowedFields) {
    if (data.hasOwnProperty(key)) {
      (sanitized as any)[key] = data[key];
    }
  }
  return sanitized;
}
