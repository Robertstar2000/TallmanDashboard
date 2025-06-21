import { NextRequest, NextResponse } from 'next/server';
import { connect as dbConnect } from '@/lib/db/mongoose';
import User from '@/lib/models/user';

interface RouteParams {
  params: { id: string };
}

// GET: Fetch a specific user by ID (Admin only)
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const requestingUserStatus = req.headers.get('x-user-status');
    if (requestingUserStatus !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const { id } = params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error: any) {
    console.error(`API User GET /${params.id} Error:`, error);
    if (error.kind === 'ObjectId') {
        return NextResponse.json({ message: 'Invalid user ID format.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error fetching user.', error: error.message }, { status: 500 });
  }
}

// PUT: Update a user's details (Admin only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const requestingUserStatus = req.headers.get('x-user-status');
    const requestingUserId = req.headers.get('x-user-id');

    if (requestingUserStatus !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, email, password, status, isLdapUser } = body;

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    // Update fields if provided
    if (name) userToUpdate.name = name;
    if (status) userToUpdate.status = status;
    if (typeof isLdapUser === 'boolean') userToUpdate.isLdapUser = isLdapUser;

    // Handle email change - check for uniqueness
    if (email && email.toLowerCase() !== userToUpdate.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== id) {
        return NextResponse.json({ message: 'Email already in use by another account.' }, { status: 409 });
      }
      userToUpdate.email = email.toLowerCase();
    }

    // Handle password change for local users
    if (password) {
      if (userToUpdate.isLdapUser) {
        return NextResponse.json({ message: 'Password for LDAP users should be managed via LDAP.' }, { status: 400 });
      }
      userToUpdate.password = password; // Pre-save hook will hash it
    }
    
    // Prevent admin from changing their own status to non-admin if they are the one making the request
    if (id === requestingUserId && status && status !== 'admin') {
        return NextResponse.json({ message: 'Administrators cannot revoke their own admin status.' }, { status: 400 });
    }

    await userToUpdate.save();
    
    const updatedUserResponse = userToUpdate.toObject();
    delete updatedUserResponse.password;

    return NextResponse.json({ message: 'User updated successfully.', user: updatedUserResponse }, { status: 200 });

  } catch (error: any) {
    console.error(`API User PUT /${params.id} Error:`, error);
    if (error.kind === 'ObjectId') {
        return NextResponse.json({ message: 'Invalid user ID format.' }, { status: 400 });
    }
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error updating user.', error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a user (Admin only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const requestingUserStatus = req.headers.get('x-user-status');
    const requestingUserId = req.headers.get('x-user-id'); // ID of the admin making the request

    if (requestingUserStatus !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const { id } = params; // ID of the user to be deleted

    if (id === requestingUserId) {
      return NextResponse.json({ message: 'Administrators cannot delete their own account.' }, { status: 400 });
    }

    const userToDelete = await User.findByIdAndDelete(id);

    if (!userToDelete) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error(`API User DELETE /${params.id} Error:`, error);
    if (error.kind === 'ObjectId') {
        return NextResponse.json({ message: 'Invalid user ID format.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error deleting user.', error: error.message }, { status: 500 });
  }
}
