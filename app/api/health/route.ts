import { NextResponse } from 'next/server';
import { checkConnections } from '@/lib/db/external';

export async function GET() {
  try {
    const status = await checkConnections();
    
    // In test mode, simulate P21 and POR connections using SQLite
    return NextResponse.json({
      p21Connected: status.p21Connected,
      porConnected: status.porConnected,
      timestamp: new Date().toISOString(),
      mode: process.env.NODE_ENV === 'development' ? 'test' : 'production'
    });
  } catch (error) {
    console.error('Error checking server health:', error);
    return NextResponse.json({
      p21Connected: false,
      porConnected: false,
      error: 'Failed to check server connections',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
