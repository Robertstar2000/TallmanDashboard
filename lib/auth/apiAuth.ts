import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secure_secret_key_for_jwt_please_change_this';

interface UserJWTPayload {
  id: string;
  email: string;
  status: 'admin' | 'user' | 'active';
  role?: 'admin' | 'user';
  name: string;
}

export async function verifyRequest(req: NextRequest): Promise<{ user: UserJWTPayload | null; error: NextResponse | null }> {
  // Get token from Authorization header or cookies
  let token = req.headers.get('authorization')?.split(' ')[1];
  
  if (!token) {
    // Use cookies() from next/headers for server components
    const cookieStore = cookies();
    token = cookieStore.get('token')?.value;
  }

  if (!token) {
    return { user: null, error: NextResponse.json({ message: 'Authentication required' }, { status: 401 }) };
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Create a properly typed user object with required fields
    const userPayload = payload as Partial<UserJWTPayload>;
    if (!userPayload.id || !userPayload.email || !userPayload.name) {
      throw new Error('Invalid token payload: missing required fields');
    }
    
    return { 
      user: {
        id: userPayload.id,
        email: userPayload.email,
        name: userPayload.name,
        status: userPayload.status || 'active',
        role: userPayload.role || 'user'
      }, 
      error: null 
    };
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return { 
      user: null, 
      error: NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 }) 
    };
  }
}
