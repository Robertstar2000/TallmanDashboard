// API route for getting user by email
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { AuthDatabase } from '../../../../../../lib/auth/auth-service';

// Initialize database connection
function getDatabase() {
  const dbPath = path.join(process.cwd(), 'dashboard.db');
  const db = new Database(dbPath);
  const authDb = new AuthDatabase(db);
  
  // Initialize users table if it doesn't exist
  authDb.initializeUsersTable();
  
  return { db, authDb };
}

// GET /api/auth/users/email/[email] - Get user by email
export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const { db, authDb } = getDatabase();
    const user = authDb.getUserByEmail(email);
    db.close();
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
