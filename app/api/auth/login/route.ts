import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { authenticateLdap } from '@/lib/auth/ldapAuth';

const ADMIN_USERNAME = 'Admin2214';
const ADMIN_PASSWORD = 'Tallman2214#';

const JWT_SECRET = (process.env.JWT_SECRET || 'change_me') as jwt.Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export async function POST(req: NextRequest) {
  try {
    const { email, username, user, password } = await req.json();
    // Accept either email or username key
    const identifier: string | undefined = (email ?? username ?? user)?.toString().trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { message: 'Username (or email) and password are required.' },
        { status: 400 }
      );
    }

    // Admin shortcut
    if (identifier === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = signToken({ email: identifier, role: 'admin' });
      const res = NextResponse.json(
        { message: 'Admin login successful', user: { email: identifier, role: 'admin' }, token, authMethod: 'admin' },
        { status: 200 }
      );
      res.cookies.set({ name: 'token', value: token, httpOnly: false, sameSite: 'lax', path: '/' });
      return res;
    }

    // LDAP auth
    const ldapUser = await authenticateLdap(identifier, password);
    const token = signToken({ email: ldapUser.mail || identifier, name: ldapUser.displayName, role: 'user' });
    const res = NextResponse.json(
      { message: 'Login successful', user: { email: ldapUser.mail || identifier, name: ldapUser.displayName, role: 'user' }, token, authMethod: 'ldap' },
      { status: 200 }
    );
    res.cookies.set({ name: 'token', value: token, httpOnly: false, sameSite: 'lax', path: '/' });
    return res;
  } catch (err: any) {
    console.error('Login API Error', err);
    return NextResponse.json(
      { message: err.message || 'Invalid credentials' },
      { status: 401 }
    );
  }
}