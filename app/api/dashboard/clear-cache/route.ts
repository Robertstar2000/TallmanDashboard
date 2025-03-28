
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Create a cache-busting file
    const dataDir = path.join(process.cwd(), 'data');
    const cacheFile = path.join(dataDir, 'cache-refresh.txt');
    const timestamp = new Date().toISOString();
    
    fs.writeFileSync(cacheFile, timestamp);
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard cache cleared successfully',
      timestamp
    });
  } catch (error) {
    console.error('Error clearing dashboard cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear dashboard cache' },
      { status: 500 }
    );
  }
}
