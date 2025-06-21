// tests/auth/authTestUtils.ts

// These constants are copied from lib/auth/passportConfig.ts as they are not exported from there.
// Ensure they match the values in passportConfig.ts for accurate testing.
export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * For testing account lock expiry, you might want to use a much shorter duration.
 * You can temporarily change LOCK_DURATION_MS here or in passportConfig.ts,
 * or use time-mocking libraries if integrating with Jest/Mocha.
 * Example for very short lock:
 * export const LOCK_DURATION_MS_FOR_TESTING = 2 * 1000; // 2 seconds
 */

// Helper to delay execution, useful for testing time-based lockouts.
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
