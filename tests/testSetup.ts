// tests/testSetup.ts
import { clearUsersTableForTesting, getDb } from '../lib/db/server'; // Adjust path as needed

export async function setupTestDatabase(): Promise<void> {
  try {
    console.log('Initializing test database (testSetup.ts)...');
    // Ensure the database file exists and tables are created by calling getDb()
    getDb(); 
    console.log('Database connection ensured and schema checked by getDb().');
    
    // Clear the users table specifically for auth tests
    clearUsersTableForTesting(); 
    console.log('Test database setup complete (users table cleared).');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    // process.exit(1); // Optionally exit if setup fails, or let tests handle it
    throw error; // Rethrow to make it clear in tests that setup failed
  }
}

// Specific utility to just clear users, can be called between test groups if needed
export function clearUsers(): void {
    clearUsersTableForTesting();
}

/**
 * Call `await setupTestDatabase()` at the beginning of your test script file.
 * Example:
 * 
 * import { setupTestDatabase } from '../testSetup';
 * 
 * async function runAllTests() {
 *   await setupTestDatabase();
 *   // ... your test functions ...
 * }
 * 
 * runAllTests().catch(console.error);
 */
