export const runtime = "nodejs";
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

interface LdapStatus {
  ok: boolean;
  checkedAt?: string; // ISO timestamp from the file
}

const FILE_PATH = path.join(process.cwd(), 'data', 'ldap-ok.json');

export async function GET() {
  let status: LdapStatus = { ok: false };
  try {
    if (fs.existsSync(FILE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8')) as LdapStatus;
      status = { ok: !!raw.ok, checkedAt: raw.checkedAt };
    } else {
      status = { ok: false };
    }
  } catch (err) {
    console.error('[LDAP quick-check] Failed to read status file:', err);
    status = { ok: false };
  }
  return NextResponse.json(status, { status: 200 });
}
