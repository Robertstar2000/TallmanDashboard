import { NextResponse } from 'next/server';
import ldap from 'ldapjs';

// GET /api/admin/ldap/status
// Returns { connected: boolean, message?: string }
export async function GET() {
  const url = process.env.LDAP_URL;
  const bindDN = process.env.LDAP_BIND_DN;
  const bindPW = process.env.LDAP_BIND_PW;

  if (!url) {
    return NextResponse.json({ connected: false, message: 'LDAP_URL not set' }, { status: 500 });
  }
  if (!bindDN || !bindPW) {
    return NextResponse.json({ connected: false, message: 'Bind credentials not configured' }, { status: 500 });
  }

  return new Promise((resolve) => {
    const client = ldap.createClient({
      url,
      timeout: 4000,
      connectTimeout: 4000,
    });

    client.on('error', (err) => {
      console.error('[LDAP status] connection error', err);
      resolve(NextResponse.json({ connected: false, message: err.message }));
    });

    if (typeof bindDN !== 'string' || !bindDN.trim()) {
      console.error('[LDAP status] bind error: LDAP_BIND_DN is not a valid string. It is likely undefined or empty in the environment.');
      client.unbind();
      return resolve(NextResponse.json({ connected: false, message: 'LDAP_BIND_DN is not configured.' }));
    }

    client.bind(bindDN, bindPW, (err) => {
      if (err) {
        console.error('[LDAP status] bind error', err);
        client.unbind();
        resolve(NextResponse.json({ connected: false, message: err.message }));
      } else {
        client.unbind();
        resolve(NextResponse.json({ connected: true }));
      }
    });
  });
}
