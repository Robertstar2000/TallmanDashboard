import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/services/database';
import type { DatabaseConfig } from '@/lib/types/dashboard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const isConnected = db.isServerConnected('P21');
    return NextResponse.json({ connected: isConnected });
  } catch (error) {
    console.error('Error checking database connection:', error);
    return NextResponse.json({ connected: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json() as DatabaseConfig;
    const isConnected = db.isServerConnected(config.server === 'P21' ? 'P21' : 'POR');
    
    return NextResponse.json({ 
      result: {
        isHealthy: isConnected,
        status: {
          serverRunning: isConnected,
          networkConnectivity: isConnected,
          firewallAccess: isConnected,
          latency: isConnected ? 0 : -1,
          authValid: isConnected,
          sslValid: isConnected
        }
      }
    });
  } catch (error) {
    console.error('Error checking server health:', error);
    return NextResponse.json({ error: 'Failed to check server health' }, { status: 500 });
  }
}
