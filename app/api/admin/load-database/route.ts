import { NextResponse } from 'next/server';
import { loadDbFromInitFile } from '@/lib/db/sqlite';

export async function POST() {
  try {
    await loadDbFromInitFile();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database successfully loaded from initial-data.ts file' 
    });
  } catch (error) {
    console.error('Error loading database from initial file:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: `Failed to load database: ${(error as Error).message}` 
    }, { status: 500 });
  }
}
