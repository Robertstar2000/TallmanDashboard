import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }


    // Use minimal auth service for testing
    console.log('🔍 LOGIN: Importing MinimalAuthService...');
    const { default: MinimalAuthService } = await import('@/lib/auth/minimal-auth');
    console.log('🔍 LOGIN: Creating MinimalAuthService instance...');
    const authService = new MinimalAuthService();
    console.log('🔍 LOGIN: MinimalAuthService created successfully');
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log('🔍 LOGIN: Calling authenticate with username:', username.trim());
    const result = await authService.authenticate({
      username: username.trim(),
      password,
      ip_address: clientIP,
      user_agent: userAgent,
    });

    if (result.success && result.token) {
      // Set HTTP-only cookie for session management
      const response = NextResponse.json({
        success: true,
        user: {
          username: result.user?.username,
          display_name: result.user?.display_name,
          access_level: result.user?.access_level,
        },
      });

      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          errorType: result.errorType 
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


