import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      // Remove session from database
      const db = getDb();
      db.prepare('DELETE FROM user_sessions WHERE session_token = ?').run(token);
    }

    const response = NextResponse.json({ success: true });
    
    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
