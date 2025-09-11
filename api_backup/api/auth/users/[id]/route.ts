// API routes for individual user operations
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/server';
import { validateSession } from '@/lib/auth/auth-service-server';

interface UpdateUserRequest {
  username?: string;
  email?: string;
  display_name?: string;
  access_level?: 'user' | 'admin' | 'super_admin';
  is_active?: boolean;
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

// GET /api/auth/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = checkAuth(request);
  if ('error' in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db.prepare(`
      SELECT id, username, email, display_name, access_level, is_active, notes, created_at, updated_at
      FROM users WHERE id = ?
    `).get(userId);
    db.close();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = checkAuth(request);
  if ('error' in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const userData: UpdateUserRequest = await request.json();
    
    // Validate access level if provided
    if (userData.access_level && !['user', 'admin', 'super_admin'].includes(userData.access_level)) {
      return NextResponse.json(
        { error: 'Invalid access level. Must be user, admin, or super_admin' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    const db = getDb();
    
    // Check if user exists
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE id = ?
    `).get(userId);
    
    if (!existingUser) {
      db.close();
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email already exists (excluding current user)
    if (userData.email) {
      const emailExists = db.prepare(`
        SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?
      `).get(userData.email, userId);
      
      if (emailExists) {
        db.close();
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];
    
    if (userData.username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(userData.username);
    }
    if (userData.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(userData.email);
    }
    if (userData.display_name !== undefined) {
      updateFields.push('display_name = ?');
      updateValues.push(userData.display_name);
    }
    if (userData.access_level !== undefined) {
      updateFields.push('access_level = ?');
      updateValues.push(userData.access_level);
    }
    if (userData.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(userData.is_active ? 1 : 0);
    }
    if (userData.notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(userData.notes);
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);
    
    const updateQuery = `
      UPDATE users SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    db.prepare(updateQuery).run(...updateValues);
    
    // Get the updated user
    const updatedUser = db.prepare(`
      SELECT id, username, email, display_name, access_level, is_active, notes, created_at, updated_at
      FROM users WHERE id = ?
    `).get(userId);
    
    db.close();
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = checkAuth(request);
  if ('error' in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Check if user exists
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE id = ?
    `).get(userId);
    
    if (!existingUser) {
      db.close();
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the user
    const result = db.prepare(`
      DELETE FROM users WHERE id = ?
    `).run(userId);
    
    db.close();
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
