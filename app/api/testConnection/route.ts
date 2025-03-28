import { NextRequest, NextResponse } from 'next/server';
import { ConnectionManager } from '@/lib/db/connection-manager';
import { ServerConfig } from '@/lib/db/connections';

/**
 * API route for testing database connections
 * POST /api/testConnection
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { server, config } = body;
    
    console.log('Testing connection for server:', server);
    console.log('Connection config:', config ? { ...config, password: '***' } : 'Using default config');
    
    if (!server) {
      return NextResponse.json({ 
        success: false, 
        message: 'Server type is required' 
      }, { status: 400 });
    }
    
    // Create a server config object
    const serverConfig: ServerConfig = {
      type: server,
      ...(config || {})
    };
    
    // Test the connection
    try {
      // If this is a P21 connection, set environment variables
      if (server === 'P21') {
        if (config?.username) process.env.P21_USERNAME = config.username;
        if (config?.password) process.env.P21_PASSWORD = config.password;
        if (config?.dsn) process.env.P21_DSN = config.dsn;
        if (config?.database) process.env.P21_DATABASE = config.database;
        if (config?.server) process.env.P21_SERVER = config.server;
        
        console.log('Testing P21 connection with config:', { 
          username: config?.username || process.env.P21_USERNAME,
          dsn: config?.dsn || process.env.P21_DSN || 'P21Play',
          database: config?.database || process.env.P21_DATABASE || 'P21Play',
          server: config?.server || process.env.P21_SERVER || 'SQL01',
          useAuth: !!(config?.username || process.env.P21_USERNAME)
        });
      }
      
      const result = await ConnectionManager.testConnection(server, serverConfig);
      console.log('Connection test result:', result);
      
      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Error testing connection:', error);
      return NextResponse.json({ 
        success: false, 
        message: `Connection test failed: ${error.message}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in testConnection API route:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    }, { status: 500 });
  }
}
