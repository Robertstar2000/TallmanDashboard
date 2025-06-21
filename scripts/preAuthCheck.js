// Simple pre-start LDAP quick check.
// Runs before Next.js server boots. Never blocks startup; never exits non-zero.
// Writes data/ldap-ok.json with { ok: true|false , message }

import fs from 'fs';
import path from 'path';
import ldap from 'ldapjs';

function writeResult(ok, message) {
  try {
    const outPath = path.resolve(process.cwd(), 'data', 'ldap-ok.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ ok, message, timestamp: new Date().toISOString() }, null, 2));
  } catch (err) {
    // ignore
  }
}

try {
  // Load config the same way backend does
  const cfg = (await import('../lib/auth/ldapConfig.js')).default;
  if (!cfg.enabled || !cfg.server?.url) {
    writeResult(false, 'LDAP disabled or not configured');
    process.exit(0);
  }

  const client = ldap.createClient({ url: cfg.server.url, reconnect: false, timeout: 5000, connectTimeout: 5000 });

  client.bind(cfg.server.bindDN, cfg.server.bindCredentials || '', function (err) {
    if (err) {
      writeResult(false, `Bind failed: ${err.message}`);
    } else {
      writeResult(true, 'LDAP bind successful');
    }
    client.unbind();
    process.exit(0);
  });
} catch (e) {
  writeResult(false, `Unexpected error: ${e.message}`);
  process.exit(0);
}
