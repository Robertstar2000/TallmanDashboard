import passport from '../auth/passportConfig';
import jwt from 'jsonwebtoken';
import ldapConfig from '../auth/ldapConfig';
import { IUser } from '../db/types'; // Using unified IUser type that includes role
import { NextApiRequest, NextApiResponse } from 'next'; // For type hinting if needed

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secure_secret_key_for_jwt_please_change_this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // e.g., 1h, 7d, 30m

if (JWT_SECRET === 'your_very_secure_secret_key_for_jwt_please_change_this') {
  console.warn('WARNING: JWT_SECRET is using a default insecure value. Please set a strong secret in your environment variables.');
}

interface AuthResult {
  user: Pick<IUser, 'id' | 'email' | 'name' | 'status' | 'role'>;
  token: string;
  authMethod: 'LDAP' | 'local';
}

// Generate JWT token
export const generateToken = (user: IUser): string => {
  const payload = {
    id: user.id,
    email: user.email,
    status: user.status,
    role: user.role,
    name: user.name
  };
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

// Authenticate user
// Note: req and res are passed because passport.authenticate can be a middleware
// that might need to interact with them, though we use it in a custom callback way here.
export const authenticateUser = (req: NextApiRequest, res: NextApiResponse): Promise<AuthResult> => {
  return new Promise((resolve, reject) => {
    const attemptLocalAuth = (ldapAuthInfo?: { message: string }) => {
      passport.authenticate('local', { session: false }, (err: any, user: IUser | false, info: { message: string }) => {
        if (err) {
          return reject(err);
        }
        if (!user) {
          // Combine messages if LDAP also provided one, or use local info's message
          const message = info?.message || ldapAuthInfo?.message || 'Invalid email or password.';
          return reject(new Error(message));
        }
        // Local authentication successful
        const token = generateToken(user);
        return resolve({ 
          user: { id: user.id, email: user.email, name: user.name, status: user.status, role: user.role }, 
          token, 
          authMethod: 'local' 
        });
      })(req, res); // Important to call the middleware function with req and res
    };

    if (ldapConfig.enabled && ldapConfig.server.url) {
      passport.authenticate('ldapauth', { session: false }, (err: any, user: IUser | false, info: { message: string }) => {
        if (err) { // This 'err' usually indicates an issue with LDAP server connection/config
          console.error('LDAP System/Configuration Error during authentication attempt:', err);
          // Fallback to local authentication if LDAP system itself has an issue
          return attemptLocalAuth({ message: 'LDAP server unavailable, trying local login.' });
        }
        if (user) {
          console.log('[LDAP] Authentication successful for', user.email);
          // LDAP authentication successful
          const token = generateToken(user);
          return resolve({ 
            user: { id: user.id, email: user.email, name: user.name, status: user.status, role: user.role }, 
            token, 
            authMethod: 'LDAP' 
          });
        }
        // If no user and no system error, it means LDAP authentication failed (e.g., bad credentials, user not found in LDAP)
        // Proceed to local authentication, passing LDAP's info message if available
        console.log('[LDAP] Credentials rejected');
        return attemptLocalAuth(info);
      })(req, res); // Important to call the middleware function with req and res
    } else {
      // LDAP not enabled or not configured, only try local authentication
      return attemptLocalAuth();
    }
  });
};
