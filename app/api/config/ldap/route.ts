import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises'; // Using promises version of fs
import path from 'path';
import ldapConfig from '@/lib/auth/ldapConfig'; // This will give the initially loaded config

const CONFIG_FILE_PATH = path.join(process.cwd(), 'data', 'config.json');

// GET: Fetch current LDAP configuration (Admin only)
export async function GET(req: NextRequest) {
  try {
    const requestingUserStatus = req.headers.get('x-user-status');
    if (requestingUserStatus !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    // Return a sanitized version of the currently loaded ldapConfig
    // The ldapConfig module loads from env vars and then data/config.json on startup.
    // This endpoint will reflect that initial load.
    const { server, ...restOfConfig } = ldapConfig;
    const sanitizedServerConfig = { ...server };
    if (sanitizedServerConfig.bindCredentials) {
      sanitizedServerConfig.bindCredentials = '********'; // Mask credentials
    }

    return NextResponse.json({ ...restOfConfig, server: sanitizedServerConfig }, { status: 200 });

  } catch (error: any) {
    console.error('API LDAP Config GET Error:', error);
    return NextResponse.json({ message: 'Error fetching LDAP configuration.', error: error.message }, { status: 500 });
  }
}

// PUT: Update LDAP configuration (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const requestingUserStatus = req.headers.get('x-user-status');
    if (requestingUserStatus !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const newConfigPartial = await req.json();

    // Read existing config.json or create a default structure
    let currentJsonConfig: any = {};
    try {
      const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
      currentJsonConfig = JSON.parse(fileContent);
    } catch (error: any) {
      if (error.code !== 'ENOENT') { // ENOENT means file doesn't exist, which is fine
        console.error('Error reading config.json for update:', error);
        return NextResponse.json({ message: 'Error reading existing configuration file.' }, { status: 500 });
      }
      // If file doesn't exist, currentJsonConfig remains {}
    }

    // Merge new settings into the ldap section of config.json
    // The structure in config.json might be different from ldapConfig.ts (e.g. snake_case)
    // We should map the fields from newConfigPartial (expected to match ldapConfig structure) 
    // to the structure expected in config.json (as per ldapConfig.ts's parsing logic)
    
    if (!currentJsonConfig.ldap) {
      currentJsonConfig.ldap = {};
    }

    // Example mapping (adjust based on actual structure used in ldapConfig.ts for reading config.json)
    if (newConfigPartial.enabled !== undefined) currentJsonConfig.ldap.enabled = newConfigPartial.enabled;
    if (newConfigPartial.server?.url) { // Assuming URL is directly set or derived
        // Need to parse URL back into components if config.json stores them separately
        // For simplicity, if config.json expects server_url, use_ssl, port, server:
        try {
            const url = new URL(newConfigPartial.server.url);
            currentJsonConfig.ldap.server_url = newConfigPartial.server.url; // Or store parsed components
            currentJsonConfig.ldap.use_ssl = url.protocol === 'ldaps:';
            currentJsonConfig.ldap.server = url.hostname;
            currentJsonConfig.ldap.port = url.port || (currentJsonConfig.ldap.use_ssl ? '636' : '389');
        } catch (e) {
            // Handle invalid URL format if necessary
            currentJsonConfig.ldap.server_url = newConfigPartial.server.url;
        }
    }
    if (newConfigPartial.server?.bindDN) currentJsonConfig.ldap.bind_user_dn = newConfigPartial.server.bindDN;
    // IMPORTANT: Avoid saving plain text passwords if possible. 
    // If bindCredentials comes as '********', don't update it unless a new, real password is provided.
    if (newConfigPartial.server?.bindCredentials && newConfigPartial.server.bindCredentials !== '********') {
      currentJsonConfig.ldap.bind_user_password = newConfigPartial.server.bindCredentials;
    }
    if (newConfigPartial.server?.searchBase) currentJsonConfig.ldap.base_dn = newConfigPartial.server.searchBase;
    if (newConfigPartial.server?.searchFilter) currentJsonConfig.ldap.user_object_filter = newConfigPartial.server.searchFilter;
    if (newConfigPartial.server?.searchAttributes) currentJsonConfig.ldap.search_attributes = newConfigPartial.server.searchAttributes;
    if (newConfigPartial.userLoginAttr) currentJsonConfig.ldap.user_login_attr = newConfigPartial.userLoginAttr;
    // Add other fields as necessary

    // Ensure data directory exists
    await fs.mkdir(path.dirname(CONFIG_FILE_PATH), { recursive: true });
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(currentJsonConfig, null, 2), 'utf8');

    // Note: The application (specifically ldapConfig.ts and passportConfig.ts) reads this file on startup.
    // Changes will typically require an application restart to take effect for the LDAP strategy.
    return NextResponse.json(
        { 
            message: 'LDAP configuration updated in data/config.json. An application restart may be required for changes to take full effect.',
            updatedConfig: currentJsonConfig.ldap // Show what was written (credentials will be plain if updated)
        }, 
        { status: 200 }
    );

  } catch (error: any) {
    console.error('API LDAP Config PUT Error:', error);
    return NextResponse.json({ message: 'Error updating LDAP configuration.', error: error.message }, { status: 500 });
  }
}
