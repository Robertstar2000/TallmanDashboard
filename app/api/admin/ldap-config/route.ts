import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

export async function GET() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const json = JSON.parse(raw);
    return NextResponse.json({ config: json.ldap ?? null });
  } catch (e) {
    return NextResponse.json({ error: 'Unable to read LDAP config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const json = JSON.parse(raw);
    json.ldap = body;
    await fs.writeFile(CONFIG_PATH, JSON.stringify(json, null, 2), 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Unable to save LDAP config' }, { status: 500 });
  }
}
