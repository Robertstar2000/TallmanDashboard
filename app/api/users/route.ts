import { NextRequest, NextResponse } from 'next/server';
import { connect as dbConnect } from '@/lib/db/mongoose';
import User, { IUser } from '@/lib/models/user';

// GET: Fetch all users (Admin only - enforced by middleware.ts)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Middleware should have already verified admin status by adding 'x-user-status' header
    const userStatus = req.headers.get('x-user-status');
    if (userStatus !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const users = await User.find({}).select('-password'); // Exclude passwords from the result
    return NextResponse.json(users, { status: 200 });

  } catch (error: any) {
    console.error('API Users GET Error:', error);
    return NextResponse.json({ message: 'Error fetching users.', error: error.message }, { status: 500 });
  }
}

// POST: Create a new user (Admin only - enforced by middleware.ts)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const userStatus = req.headers.get('x-user-status');
    if (userStatus !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, status: newUserStatus, isLdapUser } = body;

    if (!name || !email) {
      return NextResponse.json({ message: 'Name and email are required.' }, { status: 400 });
    }
    
    // For local users, password is required. For LDAP users, it's not.
    if (!isLdapUser && !password) {
        return NextResponse.json({ message: 'Password is required for local users.' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 }); // Conflict
    }

    const newUser: Partial<IUser> = {
      name,
      email: email.toLowerCase(),
      status: newUserStatus || 'user', // Default to 'user' if not provided
      isLdapUser: isLdapUser || false,
    };
    
    if (!isLdapUser && password) {
        newUser.password = password; // Password will be hashed by the pre-save hook in User model
    }

    const user = new User(newUser);
    await user.save();

    // Exclude password from the response
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({ message: 'User created successfully.', user: userResponse }, { status: 201 });

  } catch (error: any) {
    console.error('API Users POST Error:', error);
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error creating user.', error: error.message }, { status: 500 });
  }
}
