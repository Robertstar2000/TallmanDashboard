import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createUser, updateUser, deleteUserByEmail, findUserByEmail, getAllManualUsers } from '@/lib/db/server';

// Path to JSON store
const JSON_PATH = path.join(process.cwd(), 'data', 'manual-auth.json');

type ManualUser = {
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  status?: 'active' | 'disabled';
};

const readUsers = (): ManualUser[] => {
  if (!fs.existsSync(JSON_PATH)) return [];
  return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')) as ManualUser[];
};

const writeUsers = (users: ManualUser[]) => {
  fs.writeFileSync(JSON_PATH, JSON.stringify(users, null, 2), 'utf8');
};

export async function GET() {
  const users = readUsers().map(u => ({ email: u.email, role: u.role, status: u.status ?? 'active' }));
  return NextResponse.json({ success: true, users });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, role = 'user' } = body;
  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Missing email or password' }, { status: 400 });
  }
  const users = readUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ success: false, error: 'User already exists' }, { status: 409 });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser: ManualUser = { email: email.toLowerCase(), passwordHash, role, status: 'active' };
  users.push(newUser);
  writeUsers(users);
  // Sync to SQLite
  createUser({ email: newUser.email, password, role, name: newUser.email.split('@')[0] });
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { email, password, role, status } = body;
  if (!email) return NextResponse.json({ success: false, error: 'Missing email' }, { status: 400 });
  const users = readUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  if (password) users[idx].passwordHash = bcrypt.hashSync(password, 10);
  if (role) users[idx].role = role;
  if (status) users[idx].status = status;
  writeUsers(users);
  // sync SQLite
  updateUser(findUserByEmail(email)?.id ?? '', { password, role, status });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ success: false, error: 'email query param required' }, { status: 400 });
  const users = readUsers().filter(u => u.email.toLowerCase() !== email.toLowerCase());
  writeUsers(users);
  deleteUserByEmail(email);
  return NextResponse.json({ success: true });
}
