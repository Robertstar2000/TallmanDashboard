import { NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth/token';
import { authenticateLdap } from '@/lib/auth/ldapAuth';
// Import LdapUser interface definition directly to match the authentication flow
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
  role?: string;
}

// Define a common interface for authenticated users
interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  status?: 'admin' | 'user' | 'active';
  dn?: string; // Optional, as it's specific to LDAP
  mail?: string; // Optional, as it's specific to LDAP
  sAMAccountName?: string; // Optional, as it's specific to LDAP
  displayName?: string; // Optional, as it's specific to LDAP
}

// Placeholder for local admin authentication (replace with actual DB logic)
async function authenticateLocalAdmin(username: string, password_plain: string): Promise<AuthenticatedUser> {
  // In a real application, this would query a database (e.g., SQLite)
  // and securely compare hashed passwords.
  if (username === 'localadmin' && password_plain === 'adminpassword') {
    return {
      id: 'localadmin',
      email: 'localadmin@example.com',
      name: 'Local Administrator',
      status: 'admin',
    };
  }
  throw new Error('Invalid local admin credentials');
}

export async function POST(request: Request) {
  const { username, password } = await request.json();
  let user: AuthenticatedUser; // Declare user with the common interface

  console.log(`[API/Login] Attempting login for user: ${username}`);
  
  // Special test user for emergency access
  if (username === 'test' && password === 'test123') {
    console.log('[API/Login] Using emergency test user access');
    user = {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
      status: 'admin'
    };
    
    // Generate token and create response
    const token = generateToken({
      id: user.id,
      email: user.email
    });

    const response = NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        status: user.status
      },
      token: token
    });
    
    // Set token as a cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 3600
    });

    console.log(`[API/Login] Emergency access granted for test user`);
    return response;
  }

  try {
    // Attempt LDAP authentication first
    user = await authenticateLdap(username, password) as AuthenticatedUser;
    console.log(`[API/Login] LDAP authentication successful for user: ${username}`);
  } catch (ldapError: any) {
    console.warn(`[API/Login] LDAP authentication failed for ${username}: ${ldapError.message}`);
    if (ldapError.message === 'LDAP_USER_NOT_FOUND') {
      console.log('[API/Login] LDAP user not found, attempting local admin authentication...');
      try {
        console.log(`[API/Login] Attempting local admin authentication for user: ${username}`);
        user = await authenticateLocalAdmin(username, password);
        console.log(`[API/Login] Local admin authentication successful for user: ${username}`);
      } catch (localAdminError: any) {
        console.error(`[API/Login] Local admin authentication failed for ${username}: ${localAdminError.message}`);
        return NextResponse.json(
          { success: false, error: 'Login failed: Invalid credentials.' },
          { status: 401 }
        );
      }
    } else {
      console.error(`[API/Login] LDAP authentication failed with unexpected error for ${username}: ${ldapError.message}`);
      return NextResponse.json(
        { success: false, error: 'Login failed: ' + ldapError.message },
        { status: 401 }
      );
    }
  }

  // If we reach here, either LDAP or local admin authentication succeeded
  const token = generateToken({
    id: user.id,
    email: user.email
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    path: '/',
    maxAge: 3600
  });

  console.log(`[API/Login] Token generated and cookie set for user: ${username}`);
  return response;
}
