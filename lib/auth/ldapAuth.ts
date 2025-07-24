// @ts-nocheck
import ldap from 'ldapjs';

// Enable debug logging for ldapjs
process.env.DEBUG = 'ldapjs';

interface LdapUser {
  dn?: string;
  id: string;
  email: string;
  name?: string;
  status?: 'admin' | 'user' | 'active';
  displayName?: string;
  mail?: string;
  sAMAccountName?: string;
  userPrincipalName?: string;
}

// LDAP Configuration - These should be moved to environment variables in production
const LDAP_URL = process.env.LDAP_URL || 'ldap://10.10.20.253:389';
const SEARCH_BASE = process.env.LDAP_SEARCH_BASE || 'DC=tallman,DC=com';
const LDAP_DOMAIN = process.env.LDAP_DOMAIN || 'tallman.com';

// Admin credentials (should be moved to environment variables in production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Debug function to log detailed information
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

function normalizeUsername(username: string): string {
  debugLog('Normalizing username:', username);
  
  if (!username) {
    const error = 'Username is required';
    debugLog('Username validation failed:', error);
    throw new Error(error);
  }
  
  // Trim whitespace and convert to lowercase for consistency
  const cleanUsername = username.trim().toLowerCase();
  
  // If already in UPN format (user@domain.com), ensure proper domain
  if (cleanUsername.includes('@')) {
    const [userPart, domainPart] = cleanUsername.split('@');
    const domain = process.env.LDAP_DOMAIN || LDAP_DOMAIN;
    
    // If domain matches or no domain configured, return as is
    if (!domain || domainPart === domain.toLowerCase()) {
      debugLog('Username in valid UPN format:', cleanUsername);
      return cleanUsername;
    }
    
    // If domain doesn't match, log a warning but try anyway
    debugLog(`Warning: Domain '${domainPart}' doesn't match configured domain '${domain}'`);
    return cleanUsername;
  }
  
  // Otherwise, append the domain
  const domain = process.env.LDAP_DOMAIN || LDAP_DOMAIN;
  if (!domain) {
    const error = 'LDAP_DOMAIN is not configured';
    debugLog('Domain configuration error:', error);
    throw new Error(error);
  }
  
  const upn = `${cleanUsername}@${domain.toLowerCase()}`;
  debugLog('Normalized username to UPN:', upn);
  return upn;
}

async function authenticateLocalAdmin(username: string, password: string): Promise<LdapUser | null> {
  // Check if this is an admin login attempt
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return {
      id: ADMIN_USERNAME,
      email: `${ADMIN_USERNAME}@${LDAP_DOMAIN}`,
      name: 'Administrator',
      status: 'admin',
      displayName: 'Administrator',
      sAMAccountName: ADMIN_USERNAME
    };
  }
  return null;
}

export async function authenticateLdap(username: string, password: string): Promise<LdapUser> {
  debugLog('=== Starting authentication ===');
  debugLog('Username:', username);
  
  // First, try local admin authentication
  try {
    const adminUser = await authenticateLocalAdmin(username, password);
    if (adminUser) {
      debugLog('Authenticated as local admin');
      return adminUser;
    }
  } catch (error) {
    debugLog('Local admin auth failed, trying LDAP...');
  }
  
  // Then try LDAP authentication
  try {
    debugLog('Attempting LDAP authentication...');
    debugLog('LDAP Server:', LDAP_URL);
    
    const normalizedUsername = normalizeUsername(username);
    const ldapUser = await new Promise<LdapUser>((resolve, reject) => {
      // Create LDAP client with minimal logging to avoid issues
      const client = ldap.createClient({
        url: LDAP_URL,
        log: {
          debug: (msg: string) => console.log(`[LDAP Debug] ${msg}`),
          error: (err: Error) => console.error(`[LDAP Error]`, err),
          // Add these to prevent potential errors with missing methods
          trace: (msg: string) => console.log(`[LDAP Trace] ${msg}`),
          info: (msg: string) => console.log(`[LDAP Info] ${msg}`),
          warn: (msg: string) => console.warn(`[LDAP Warn] ${msg}`)
        },
        timeout: 10000, // 10 second timeout
        connectTimeout: 5000, // 5 second connect timeout
        reconnect: false,
        strictDN: false, // Be more lenient with DN parsing
        tlsOptions: {
          rejectUnauthorized: false // For self-signed certificates
        }
      });

      // Handle client errors
      client.on('error', (err: any) => {
        debugLog('LDAP Client Error:', {
          message: err.message,
          name: err.name,
          code: err.code,
          stack: err.stack
        });
        reject(new Error(`LDAP connection error: ${err.message}`));
      });

      // Set up timeout for the entire operation
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error('LDAP operation timed out'));
      }, 15000); // 15 second timeout for the entire operation

      try {
        const upn = normalizedUsername;
        const domain = LDAP_DOMAIN.toLowerCase();
        
        debugLog('Attempting LDAP bind with:', { 
          upn,
          server: LDAP_URL,
          searchBase: SEARCH_BASE,
          domain
        });
        
        client.bind(upn, password, (bindErr: any) => {
          // Clear the timeout as we got a response
          clearTimeout(timeout);
          
          if (bindErr) {
            debugLog('LDAP Bind Error:', {
              message: bindErr.message,
              name: bindErr.name,
              code: bindErr.code,
              dn: bindErr.dn || 'N/A',
              stack: bindErr.stack
            });
            
            // Try alternative bind methods if the first one fails
            if (bindErr.code === 49) { // Invalid credentials
              debugLog('Invalid credentials, trying alternative bind methods...');
              
              // Try with just the username (without domain)
              const simpleUsername = upn.split('@')[0];
              const altUpn = `${simpleUsername}@${domain}`;
              
              debugLog('Trying alternative UPN:', altUpn);
              
              return client.bind(altUpn, password, (altBindErr: any) => {
                if (altBindErr) {
                  debugLog('Alternative bind failed:', altBindErr.message);
                  client.unbind(() => {});
                  return reject(new Error('Invalid username or password'));
                }
                
                // Success with alternative bind
                debugLog('Alternative bind successful');
                onBindSuccess(simpleUsername, altUpn);
              });
            }
            
            // For other errors, reject with the original error
            client.unbind(() => {});
            return reject(new Error(`Authentication failed: ${bindErr.message}`));
          }
          
          debugLog('LDAP bind successful, finalizing...');
          onBindSuccess(username, upn);
          
          function onBindSuccess(username: string, upn: string) {
            // On successful bind, return user details
            const displayName = username.split('@')[0];
            const user: LdapUser = {
              dn: upn,
              id: upn,
              email: upn,
              name: displayName,
              displayName: displayName,
              sAMAccountName: displayName,
              userPrincipalName: upn,
              status: 'active',
              role: 'user'
            };
            
            debugLog('Authentication successful, user:', user);
            
            // Unbind and resolve
            client.unbind((unbindErr) => {
              if (unbindErr) {
                debugLog('Error during unbind:', unbindErr);
              }
              resolve(user);
            });
          }
          
          // Properly unbind after successful authentication
          client.unbind((unbindErr) => {
            if (unbindErr) {
              debugLog('Error during LDAP unbind:', unbindErr);
              // Even if unbind fails, we still have a successful auth
            }
            resolve(user);
          });
        });
      } catch (err: any) {
        debugLog('Unexpected error during LDAP authentication:', err);
        client.destroy();
        reject(err);
      }
    });
    
    debugLog('LDAP authentication completed successfully');
    return ldapUser;
    
  } catch (error: any) {
    debugLog('LDAP authentication failed, error:', error.message);
    
    // If LDAP fails, try local admin authentication
    try {
      debugLog('Falling back to local admin authentication...');
      const adminUser = await authenticateLocalAdmin(username, password);
      if (adminUser) {
        debugLog('Local admin authentication successful');
        return adminUser;
      }
      throw new Error('Invalid username or password');
    } catch (adminError: any) {
      debugLog('All authentication methods failed:', adminError.message);
      throw new Error('Authentication failed. Please check your credentials.');
    }
  }
}

export default authenticateLdap;
