const { spawn } = require('child_process');
const path = require('path');

// Define the test file to run
// In a more advanced setup, this could come from command-line arguments
const testFile = path.join(__dirname, 'auth', 'localAuth.test.ts');

console.log(`Attempting to run test file: ${testFile} using ts-node...\n`);

// Prepare environment variables for the child process
const env = { ...process.env };
if (!env.NODE_ENV) {
  env.NODE_ENV = 'test'; // Ensure NODE_ENV is set for the test script
}

const tsNodePath = path.resolve(__dirname, '..', 'node_modules', '.bin', 'ts-node');

const child = spawn(
  process.platform === 'win32' ? `${tsNodePath}.cmd` : tsNodePath, // Use .cmd for ts-node on Windows
  [testFile],
  {
    stdio: 'inherit', // Inherit stdin, stdout, stderr from the parent process
    shell: process.platform === 'win32', // Use shell on Windows for .cmd execution
    env: env
  }
);

child.on('error', (error) => {
  console.error(`Failed to start test process: ${error.message}`);
});

child.on('exit', (code, signal) => {
  if (code !== null) {
    console.log(`\nTest process exited with code ${code}`);
  } else if (signal !== null) {
    console.log(`\nTest process was killed with signal ${signal}`);
  }
});
