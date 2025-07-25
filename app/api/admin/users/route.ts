import { NextRequest, NextResponse } from 'next/server';

// Middleware to check admin access
async function checkAdminAccess(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return { authorized: false, error: 'No authentication token' };
  }

  // Lazy import to avoid startup issues
  const { default: AuthService } = await import('@/lib/auth/auth-service');
  const authService = new AuthService();
  const validation = authService.validateSession(token);

  if (!validation.valid || !validation.user) {
    return { authorized: false, error: 'Invalid session' };
  }

  if (validation.user.access_level !== 'admin' && validation.user.access_level !== 'super_admin') {
    return { authorized: false, error: 'Insufficient privileges' };
  }

  return { authorized: true, user: validation.user };
}

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 }
      );
    }

    const { default: AuthService } = await import('@/lib/auth/auth-service');
    const authService = new AuthService();
    const users = authService.getAllUsers();

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        access_level: user.access_level,
        is_active: user.is_active,
        created_date: user.created_date,
        last_login: user.last_login,
        created_by: user.created_by,
        notes: user.notes,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add new user
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, display_name, access_level, is_active, notes } = body;

    if (!username || !access_level) {
      return NextResponse.json(
        { success: false, error: 'Username and access level are required' },
        { status: 400 }
      );
    }

    if (!['user', 'admin', 'super_admin'].includes(access_level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid access level' },
        { status: 400 }
      );
    }

    const { default: AuthService } = await import('@/lib/auth/auth-service');
    const authService = new AuthService();
    const success = authService.addUser(
      {
        username: username.trim(),
        email: email?.trim(),
        display_name: display_name?.trim(),
        access_level,
        is_active: is_active !== false, // Default to true
        notes: notes?.trim(),
      },
      authCheck.user!.username
    );

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to add user. Username may already exist.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Add user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, email, display_name, access_level, is_active, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (access_level && !['user', 'admin', 'super_admin'].includes(access_level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid access level' },
        { status: 400 }
      );
    }

    const { default: AuthService } = await import('@/lib/auth/auth-service');
    const authService = new AuthService();
    const updateData: any = {};
    
    if (email !== undefined) updateData.email = email?.trim();
    if (display_name !== undefined) updateData.display_name = display_name?.trim();
    if (access_level !== undefined) updateData.access_level = access_level;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (notes !== undefined) updateData.notes = notes?.trim();

    const success = authService.updateUser(id, updateData);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { default: AuthService } = await import('@/lib/auth/auth-service');
    const authService = new AuthService();
    const success = authService.deleteUser(parseInt(userId));

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


