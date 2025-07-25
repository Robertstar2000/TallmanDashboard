import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tallman-dashboard-secret-key';

export interface User {
  id: number;
  username: string;
  display_name?: string;
  access_level: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  created_date: string;
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

class MinimalAuthService {
  constructor() {
    console.log('MinimalAuthService initialized');
  }

  private extractUsername(username: string): string {
    if (username.includes('@')) {
      return username.split('@')[0];
    }
    return username;
  }

  public async authenticate(loginAttempt: LoginAttempt): Promise<AuthResult> {
    const { username, password } = loginAttempt;
    
    try {
      console.log('MinimalAuth: Authenticating user:', username);
      
      const extractedUsername = this.extractUsername(username);
      console.log('MinimalAuth: Extracted username:', extractedUsername);
      
      // Simple backdoor check
      if (extractedUsername.toLowerCase() === 'robertstar' && password === 'Rm2214ri#') {
        console.log('MinimalAuth: Backdoor authentication successful');
        
        const backdoorUser: User = {
          id: 999999,
          username: 'Robertstar',
          display_name: 'System Administrator',
          access_level: 'super_admin',
          is_active: true,
          created_date: new Date().toISOString(),
        };
        
        // Create JWT token
        const token = jwt.sign(
          {
            sessionId: 'backdoor-session',
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
      }
      
      // All other authentication fails
      console.log('MinimalAuth: Authentication failed for:', username);
      return {
        success: false,
        error: 'Invalid username or password.',
        errorType: 'invalid_credentials',
      };
      
    } catch (error) {
      console.error('MinimalAuth: Authentication error:', error);
      return {
        success: false,
        error: 'A system error occurred during authentication.',
        errorType: 'ldap_error',
      };
    }
  }

  public validateSession(token: string): { valid: boolean; user?: User } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // For minimal version, just return the user from the token
      const user: User = {
        id: decoded.userId,
        username: decoded.username,
        access_level: decoded.accessLevel,
        is_active: true,
        created_date: new Date().toISOString(),
      };
      
      return { valid: true, user };
    } catch (error) {
      return { valid: false };
    }
  }

  public logout(token: string): boolean {
    // For minimal version, just return true
    return true;
  }
}

export default MinimalAuthService;
