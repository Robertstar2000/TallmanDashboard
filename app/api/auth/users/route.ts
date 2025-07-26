// API routes for user management
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { AuthDatabase, CreateUserRequest } from '../../../../lib/auth/auth-service';

// Initialize database connection
function getDatabase() {
  const dbPath = path.join(process.cwd(), 'dashboard.db');
  const db = new Database(dbPath);
  const authDb = new AuthDatabase(db);
  
  // Initialize users table if it doesn't exist
  authDb.initializeUsersTable();
  
  return { db, authDb };
}

// GET /api/auth/users - Get all users
export async function GET() {
  try {
    const { db, authDb } = getDatabase();
    const users = authDb.getAllUsers();
    db.close();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/auth/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const userData: CreateUserRequest = await request.json();
    
    // Validate required fields
    if (!userData.email || !userData.display_name || !userData.access_level) {
      return NextResponse.json(
        { message: 'Missing required fields: email, display_name, and access_level are required' },
        { status: 400 }
      );
    }

    // Validate access level
    if (!['user', 'admin', 'super_admin'].includes(userData.access_level)) {
      return NextResponse.json(
        { message: 'Invalid access level. Must be user, admin, or super_admin' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const { db, authDb } = getDatabase();
    
    // Check if email already exists
    if (authDb.emailExists(userData.email)) {
      db.close();
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const newUser = authDb.createUser(userData);
    db.close();
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Failed to create user', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
