import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { connectToP21 } from '@/lib/db/external';

interface ConnectionRequest {
  server: string;
  database: string;
  user: string;
  password: string;
}

let p21Connection: ConnectionRequest | null = null;

export async function POST(request: Request) {
  try {
    const data: ConnectionRequest = await request.json();
    
    // Validate required fields
    if (!data.server || !data.database || !data.user || !data.password) {
      return NextResponse.json(
        { error: 'Missing required connection parameters' },
        { status: 400 }
      );
    }

    // Store connection details
    await kv.set('p21_config', {
      server: data.server,
      database: data.database,
      user: data.user,
      password: data.password
    });

    // Test connection
    const connected = await connectToP21();
    if (!connected) {
      return NextResponse.json(
        { error: 'Failed to connect to P21 database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting to P21:', error);
    return NextResponse.json(
      { error: 'Failed to establish P21 connection' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const config = await kv.get('p21_config');
    if (!config) {
      return NextResponse.json({ error: 'No P21 connection configured' }, { status: 404 });
    }

    // Test the existing connection
    const connected = await connectToP21();
    const isConnected = connected;

    return NextResponse.json({
      isConnected,
      config: {
        ...config,
        password: undefined // Don't send password back to client
      }
    });
  } catch (error) {
    console.error('Failed to get P21 connection status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', isConnected: false },
      { status: 500 }
    );
  }
}
