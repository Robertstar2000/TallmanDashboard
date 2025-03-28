import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to save configuration values
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Key and value are required' 
        },
        { status: 400 }
      );
    }

    // Save to a config file in the data directory
    const dataDir = path.join(process.cwd(), 'data');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const configPath = path.join(dataDir, 'config.json');
    
    // Read existing config or create new one
    let config: Record<string, any> = {};
    
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configContent);
      } catch (error) {
        console.error('Error reading config file:', error);
        // If the file is corrupted, we'll just create a new one
      }
    }
    
    // Update the config
    config[key] = value;
    
    // Write the config back to the file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // Set the environment variable for the current process
    process.env[key] = value;
    
    return NextResponse.json({
      success: true,
      message: `Successfully saved ${key} configuration`
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
}
