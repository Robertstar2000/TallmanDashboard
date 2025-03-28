import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/sqlite';

/**
 * API route for saving connection settings to the database
 * POST /api/saveConnectionSettings
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { serverType, config } = body;
    
    console.log('Saving connection settings for server:', serverType);
    console.log('Connection config:', config ? { ...config, password: '***' } : 'No config provided');
    
    if (!serverType) {
      return NextResponse.json({ 
        success: false, 
        message: 'Server type is required' 
      }, { status: 400 });
    }
    
    if (!config) {
      return NextResponse.json({ 
        success: false, 
        message: 'Connection config is required' 
      }, { status: 400 });
    }
    
    try {
      const db = await getDb();
      
      // Check if the server_configs table exists
      const serverConfigsTableExists = await (db as any).get(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='server_configs'
      `);
      
      if (!serverConfigsTableExists) {
        console.log('server_configs table does not exist, creating it...');
        await (db as any).exec(`
          CREATE TABLE IF NOT EXISTS server_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_name TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            database TEXT NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            config TEXT DEFAULT '{}',
            server TEXT NOT NULL
          )
        `);
      }
      
      // Check if a config for this server type already exists
      const existingConfig = await (db as any).get(`
        SELECT id FROM server_configs 
        WHERE server = ?
      `, [serverType]);
      
      // Prepare the config data
      let host = '';
      let port = 0;
      let database = '';
      let username = '';
      let password = '';
      let configJson = '{}';
      
      if (serverType === 'P21') {
        host = config.server || '';
        port = config.port || 1433;
        database = config.database || '';
        username = config.username || '';
        password = config.password || '';
        configJson = JSON.stringify({
          dsn: config.dsn || ''
        });
      } else if (serverType === 'POR') {
        host = 'localhost';
        port = 0;
        database = '';
        username = '';
        password = '';
        configJson = JSON.stringify({
          filePath: config.filePath || ''
        });
      }
      
      if (existingConfig) {
        // Update existing config
        await (db as any).run(`
          UPDATE server_configs 
          SET 
            server_name = ?,
            host = ?,
            port = ?,
            database = ?,
            username = ?,
            password = ?,
            config = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          serverType,
          host,
          port,
          database,
          username,
          password,
          configJson,
          existingConfig.id
        ]);
        
        console.log(`Updated existing connection settings for ${serverType}`);
      } else {
        // Insert new config
        await (db as any).run(`
          INSERT INTO server_configs (
            server_name,
            host,
            port,
            database,
            username,
            password,
            config,
            server
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          serverType,
          host,
          port,
          database,
          username,
          password,
          configJson,
          serverType
        ]);
        
        console.log(`Inserted new connection settings for ${serverType}`);
      }
      
      return NextResponse.json({
        success: true,
        message: `Connection settings for ${serverType} saved successfully`
      });
    } catch (error: any) {
      console.error('Error saving connection settings:', error);
      return NextResponse.json({ 
        success: false, 
        message: `Failed to save connection settings: ${error.message}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in saveConnectionSettings API route:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    }, { status: 500 });
  }
}
