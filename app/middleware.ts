import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secure_secret_key_for_jwt_please_change_this';
const LOGIN_URL = '/login'; // Assuming your login page is at /login

interface UserJWTPayload extends JWTPayload {
  id: string;
  email: string;
  status: 'admin' | 'user' | 'active';
  role?: 'admin' | 'user';
  name: string;
}

// Helper function to verify token using jose (Edge-runtime compatible)
async function verifyToken(token: string): Promise<UserJWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as UserJWTPayload;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  console.log('*** middleware hit for', req.nextUrl.pathname);
  const { pathname } = req.nextUrl;

  // Paths that do not require authentication
  const publicPaths = [
    LOGIN_URL,
    '/api/login',
    '/api/auth/login',
    '/api/auth/ldap-quick-check',
    // Add other public paths like /register, /forgot-password, public assets, etc.
  ];

  // Skip static asset file requests
  if (/\.(?:js|css|json|map)$/i.test(pathname)) {
    return NextResponse.next();
  }

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // --- LDAP quick-check: if LDAP is down and user is unauthenticated, always go to manual login
  // Call quick-check API (public) to know LDAP status
  try {
    const checkRes = await fetch(new URL('/api/auth/ldap-quick-check', req.nextUrl));
    if (checkRes.ok) {
      const { ok: ldapOk } = (await checkRes.json()) as { ok: boolean };
      console.log('LDAP status', ldapOk);
      if (!ldapOk) {
        const authHeaderTmp = req.headers.get('Authorization');
        const tmpTokenHeader = authHeaderTmp?.startsWith('Bearer ') ? authHeaderTmp.substring(7) : null;
        const tmpCookieToken = req.cookies.get('token')?.value;
        if (!tmpTokenHeader && !tmpCookieToken && pathname !== LOGIN_URL && !pathname.startsWith('/api/')) {
          return NextResponse.redirect(new URL(LOGIN_URL, req.url));
        }
      }
    }
  } catch (e) {
    console.error('Middleware: LDAP quick-check fetch failed', e);
    // fail-open
  }

  // Get token from Authorization header
  let authHeader = req.headers.get('Authorization');
  console.log('Cookie token raw:', req.cookies.get('token')?.value);
  if (!authHeader) {
    const cookieToken = req.cookies.get('token')?.value;
    if (cookieToken) {
      authHeader = `Bearer ${cookieToken}`;
    }
  }
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    console.log(`Middleware: No token found for path ${pathname}. Redirecting to login.`);
    // For API routes, return 401. For page routes, redirect to login.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL(LOGIN_URL, req.url));
  }

  const decodedUser = await verifyToken(token);

  if (!decodedUser) {
    console.log(`Middleware: Invalid token for path ${pathname}. Redirecting to login.`);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
    }
     // Clear potentially invalid token from cookies if stored there (not standard for Bearer but good practice)
    const response = NextResponse.redirect(new URL(LOGIN_URL, req.url));
    // response.cookies.delete('your_token_cookie_name'); // If you were using cookies for token
    return response;
  }

  // Admin role check for admin paths
  const adminApiPaths = ['/api/users', '/api/config']; // Add more admin API paths as needed
  const adminPagePaths = ['/admin']; // Add more admin page paths as needed

  const requiresAdmin = 
    adminApiPaths.some(path => pathname.startsWith(path)) || 
    adminPagePaths.some(path => pathname.startsWith(path));

  const isAdminUser = decodedUser.status === 'admin' || decodedUser.role === 'admin';

  if (requiresAdmin && !isAdminUser) {
    console.log(`Middleware: User ${decodedUser.email} (role: ${decodedUser.status}) attempted to access admin path ${pathname}.`);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }
    // For admin pages, redirect to a general dashboard or show a forbidden page
    // For simplicity, redirecting to a hypothetical dashboard page
    return NextResponse.redirect(new URL('/', req.url)); // Or new URL('/forbidden', req.url)
  }
  
  // If token is valid and all checks pass, proceed
  // You can add the decoded user to the request headers if needed by API routes/server components
  // Note: Modifying request headers in middleware is standard practice.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', decodedUser.id);
  requestHeaders.set('x-user-email', decodedUser.email);
  requestHeaders.set('x-user-status', decodedUser.status);
  if (decodedUser.role) {
    requestHeaders.set('x-user-role', decodedUser.role);
  }
  requestHeaders.set('x-user-name', decodedUser.name);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all paths except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)$).*)',
  ],
};
