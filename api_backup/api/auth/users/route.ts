// API routes for user management
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/server';
import { validateSession } from '@/lib/auth/auth-service-server';

interface CreateUserRequest {
  username: string;
  email: string;
  display_name: string;
  access_level: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  notes?: string;
}

// Helper function to check authentication
function checkAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return { error: 'Authentication required', status: 401 };
  }

  const user = validateSession(token);
  if (!user) {
    return { error: 'Invalid or expired session', status: 401 };
  }

  if (user.access_level !== 'admin' && user.access_level !== 'super_admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return { user };
}

// GET /api/auth/users - Get all users
export async function GET(request: NextRequest) {
  const authCheck = checkAuth(request);
  if ('error' in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT id, username, email, display_name, access_level, is_active, notes, created_at, updated_at
      FROM users
      ORDER BY username
    `).all();
    db.close();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/auth/users - Create new user
export async function POST(request: NextRequest) {
  const authCheck = checkAuth(request);
  if ('error' in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const userData: CreateUserRequest = await request.json();
    
    // Validate required fields
    if (!userData.username || !userData.email || !userData.display_name || !userData.access_level) {
      return NextResponse.json(
        { error: 'Missing required fields: username, email, display_name, and access_level are required' },
        { status: 400 }
      );
    }

    // Validate access level
    if (!['user', 'admin', 'super_admin'].includes(userData.access_level)) {
      return NextResponse.json(
        { error: 'Invalid access level. Must be user, admin, or super_admin' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Check if username or email already exists
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
    `).get(userData.username, userData.email);
    
    if (existingUser) {
      db.close();
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, display_name, access_level, is_active, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertUser.run(
      userData.username,
      userData.email,
      userData.display_name,
      userData.access_level,
      userData.is_active ? 1 : 0,
      userData.notes || null
    );
    
    // Get the created user
    const newUser = db.prepare(`
      SELECT id, username, email, display_name, access_level, is_active, notes, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);
    
    db.close();
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
