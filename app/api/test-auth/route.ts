import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('🧪 TEST AUTH ENDPOINT');
    console.log('Username:', username);
    console.log('Password length:', password?.length);

    // Simple backdoor check
    function extractUsername(input: string): string {
      if (input.includes('@')) {
        return input.split('@')[0];
      }
      return input;
    }

    const extractedUsername = extractUsername(username);
    const isBackdoor = extractedUsername.toLowerCase() === 'robertstar' && password === 'Rm2214ri#';

    console.log('Extracted username:', extractedUsername);
    console.log('Lowercase:', extractedUsername.toLowerCase());
    console.log('Is backdoor:', isBackdoor);

    if (isBackdoor) {
      return NextResponse.json({
        success: true,
        message: 'Backdoor authentication successful!',
        username: extractedUsername
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed',
        debug: {
          extractedUsername,
          lowercase: extractedUsername.toLowerCase(),
          expectedUsername: 'robertstar',
          usernameMatch: extractedUsername.toLowerCase() === 'robertstar',
          passwordMatch: password === 'Rm2214ri#'
        }
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
