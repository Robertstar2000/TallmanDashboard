#!/usr/bin/env node
// Cross-platform launcher: runs LDAP pre-check then starts Next.js in dev or prod mode without relying on shell chaining.
// Usage:
//   npm run dev          → dev server on port 60005
//   npm run start        → production server on port 60005

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

function run(cmd, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: false,
      cwd: root,
      ...options,
    });
    child.on('close', code => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`${cmd} exited with code ${code}`));
      }
    });
  });
}

async function main() {
  const prod = process.argv.includes('--prod');
  try {
    // 1. LDAP quick-check (ignore any errors – dashboard will fall back to manual auth)
    const preCheck = resolve(root, 'scripts', 'preAuthCheck.js');
    if (existsSync(preCheck)) {
      try {
        await run('node', [preCheck]);
      } catch (_) {
        // swallow – we only care that it attempted and returned.
      }
    }

    // 2. Start Next.js
    const mode = prod ? 'start' : 'dev';
    const port = process.env.PORT || '60005';
    
    // Ensure environment variables are properly set
    const env = { ...process.env };
    
    // Set POR_Path if not already set
    if (!env.POR_Path) {
      env.POR_Path = '\\ts03\POR\POR.MDB';
      console.log('Setting POR_Path environment variable to:', env.POR_Path);
    } else {
      console.log('Using existing POR_Path from environment:', env.POR_Path);
    }
    
    // Set JWT_SECRET if not already set (required for authentication)
    if (!env.JWT_SECRET) {
      env.JWT_SECRET = 'tallman_dashboard_secret_key';
      console.log('Setting JWT_SECRET environment variable');
    } else {
      console.log('Using existing JWT_SECRET from environment');
    }
    
    // Use shell on Windows so .cmd files or npx are resolved correctly
    if (process.platform === 'win32') {
      await run('npx', ['next', mode, '-p', port], { shell: true, env });
    } else {
      const nextBin = resolve(root, 'node_modules', '.bin', 'next');
      await run(nextBin, [mode, '-p', port], { env });
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
