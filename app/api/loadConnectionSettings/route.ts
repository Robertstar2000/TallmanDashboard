import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/sqlite';

/**
 * API route for loading connection settings from the database
 * GET /api/loadConnectionSettings
 */
export async function GET(request: NextRequest) {
  try {
    const serverType = request.nextUrl.searchParams.get('serverType');
    
    console.log('Loading connection settings', serverType ? `for server: ${serverType}` : 'for all servers');
    
    try {
      const db = await getDb();
      
      // Check if the server_configs table exists
      const serverConfigsTableExists = await (db as any).get(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='server_configs'
      `);
      
      if (!serverConfigsTableExists) {
        return NextResponse.json({
          success: false,
          message: 'No connection settings found - server_configs table does not exist',
          configs: []
        });
      }
      
      let configs;
      
      if (serverType) {
        // Get connection settings for the specified server type
        configs = await (db as any).all(`
          SELECT * FROM server_configs 
          WHERE server = ?
        `, [serverType]);
      } else {
        // Get all connection settings
        configs = await (db as any).all(`
          SELECT * FROM server_configs
        `);
      }
      
      // Process configs to parse JSON and mask passwords
      const processedConfigs = configs.map((config: any) => {
        // Parse the config JSON
        let configObj = {};
        try {
          configObj = JSON.parse(config.config || '{}');
        } catch (error) {
          console.warn(`Failed to parse config JSON for ${config.server_name}:`, error);
        }
        
        // Create a processed config object
        const processedConfig = {
          ...config,
          password: '********', // Mask the password
          configObj
        };
        
        return processedConfig;
      });
      
      return NextResponse.json({
        success: true,
        message: processedConfigs.length > 0 
          ? `Found ${processedConfigs.length} connection settings` 
          : 'No connection settings found',
        configs: processedConfigs
      });
    } catch (error: any) {
      console.error('Error loading connection settings:', error);
      return NextResponse.json({ 
        success: false, 
        message: `Failed to load connection settings: ${error.message}`,
        configs: []
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in loadConnectionSettings API route:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Server error: ${error.message}`,
      configs: []
    }, { status: 500 });
  }
}
