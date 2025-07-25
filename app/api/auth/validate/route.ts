import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Lazy import to avoid startup issues
    const { default: AuthService } = await import('@/lib/auth/auth-service');
    const authService = new AuthService();
    const validation = authService.validateSession(token);

    if (validation.valid && validation.user) {
      return NextResponse.json({
        valid: true,
        user: {
          username: validation.user.username,
          display_name: validation.user.display_name,
          access_level: validation.user.access_level,
        },
      });
    } else {
      // Clear invalid token
      const response = NextResponse.json(
        { valid: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
      
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });

      return response;
    }
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


