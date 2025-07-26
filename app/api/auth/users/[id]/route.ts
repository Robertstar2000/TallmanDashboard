// API routes for individual user operations
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { AuthDatabase, UpdateUserRequest } from '../../../../../lib/auth/auth-service';

// Initialize database connection
function getDatabase() {
  const dbPath = path.join(process.cwd(), 'dashboard.db');
  const db = new Database(dbPath);
  const authDb = new AuthDatabase(db);
  
  // Initialize users table if it doesn't exist
  authDb.initializeUsersTable();
  
  return { db, authDb };
}

// GET /api/auth/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const { db, authDb } = getDatabase();
    const user = authDb.getUserById(userId);
    db.close();
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const userData: UpdateUserRequest = await request.json();
    
    // Validate access level if provided
    if (userData.access_level && !['user', 'admin', 'super_admin'].includes(userData.access_level)) {
      return NextResponse.json(
        { message: 'Invalid access level. Must be user, admin, or super_admin' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return NextResponse.json(
          { message: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    const { db, authDb } = getDatabase();
    
    // Check if user exists
    const existingUser = authDb.getUserById(userId);
    if (!existingUser) {
      db.close();
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email already exists (excluding current user)
    if (userData.email && authDb.emailExists(userData.email, userId)) {
      db.close();
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const updatedUser = authDb.updateUser(userId, userData);
    db.close();
    
    if (!updatedUser) {
      return NextResponse.json(
        { message: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Failed to update user', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const { db, authDb } = getDatabase();
    
    // Check if user exists
    const existingUser = authDb.getUserById(userId);
    if (!existingUser) {
      db.close();
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const deleted = authDb.deleteUser(userId);
    db.close();
    
    if (!deleted) {
      return NextResponse.json(
        { message: 'Failed to delete user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Failed to delete user', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
