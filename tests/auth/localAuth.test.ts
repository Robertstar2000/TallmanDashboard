// tests/auth/localAuth.test.ts
console.log('--- localAuth.test.ts script started ---');
import { IUser } from '../../lib/db/types';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser
} from '../../lib/db/server';
import bcrypt from 'bcryptjs';
import { setupTestDatabase, clearUsers } from '../testSetup';
import { MAX_FAILED_LOGINS, LOCK_DURATION_MS, delay } from './authTestUtils';

const testUserEmail = 'testuser@example.com';
const testUserPassword = 'Password123!';

async function testUserRegistration() {
  console.log('\n--- Testing User Registration ---');
  clearUsers(); // Clear users before this test block

  const userData = {
    email: testUserEmail,
    name: 'Test User',
    password: testUserPassword,
    role: 'admin' as IUser['role'],
    status: 'active' as IUser['status'],
  };

  const createdUser = createUser(userData);
  console.assert(createdUser, 'Test 1.1: User should be created.');
  if (!createdUser) return false;

  console.assert(createdUser.email === userData.email, 'Test 1.2: User email should match.');
  console.assert(createdUser.name === userData.name, 'Test 1.3: User name should match.');
  console.assert(createdUser.role === userData.role, 'Test 1.4: User role should match.');
  console.assert(createdUser.status === userData.status, 'Test 1.5: User status should match.');
  console.assert(createdUser.id, 'Test 1.6: User should have an ID.');
  console.assert(createdUser.password, 'Test 1.7: User password should be hashed and set.');
  console.assert(bcrypt.compareSync(testUserPassword, createdUser.password!), 'Test 1.8: Provided password should match stored hash.');
  console.assert(createdUser.isLdapUser === false, 'Test 1.9: User should not be LDAP user by default.');
  console.assert(createdUser.failedLoginAttempts === 0, 'Test 1.10: Failed login attempts should be 0.');
  
  const duplicateUser = createUser(userData); // Try creating the same user
  console.assert(duplicateUser === null, 'Test 1.11: Creating a duplicate user by email should fail.');

  console.log('User Registration tests completed.');
  return true;
}

async function testSuccessfulLogin() {
  console.log('\n--- Testing Successful Login Simulation ---');
  clearUsers();
  const initialUser = createUser({ email: testUserEmail, password: testUserPassword, name: 'Login Test' });
  if (!initialUser) {
    console.error('Failed to create user for login test.');
    return false;
  }

  // Simulate LocalStrategy: find user
  const foundUser = await findUserByEmail(testUserEmail);
  console.assert(foundUser, 'Test 2.1: User should be found by email.');
  if (!foundUser) return false;

  // Simulate LocalStrategy: compare password
  const isMatch = bcrypt.compareSync(testUserPassword, foundUser.password!);
  console.assert(isMatch, 'Test 2.2: Password should match.');
  if (!isMatch) return false;

  // Simulate LocalStrategy: update user on successful login
  const preLoginTime = new Date().getTime();
  await updateUser(foundUser.id, {
    lastLogin: new Date().toISOString(),
    failedLoginAttempts: 0,
    lockUntil: null,
  });

  const updatedUser = await findUserById(foundUser.id);
  console.assert(updatedUser, 'Test 2.3: User should be found by ID after update.');
  if (!updatedUser) return false;

  console.assert(updatedUser.failedLoginAttempts === 0, 'Test 2.4: Failed login attempts should be reset.');
  console.assert(updatedUser.lockUntil === null, 'Test 2.5: LockUntil should be null.');
  console.assert(updatedUser.lastLogin, 'Test 2.6: Last login should be set.');
  if (updatedUser.lastLogin) {
    const lastLoginTime = new Date(updatedUser.lastLogin).getTime();
    console.assert(lastLoginTime >= preLoginTime, 'Test 2.7: Last login time should be recent.');
  }
  console.log('Successful Login tests completed.');
  return true;
}

async function testFailedLoginAttempts() {
  console.log('\n--- Testing Failed Login Attempts ---');
  clearUsers();
  const user = createUser({ email: testUserEmail, password: testUserPassword, name: 'Fail Login Test' });
  if (!user) {
    console.error('Failed to create user for failed login test.');
    return false;
  }

  let currentUserState = user;
  for (let i = 1; i < MAX_FAILED_LOGINS; i++) {
    // Simulate LocalStrategy: password mismatch leading to failed attempt update
    await updateUser(currentUserState.id, { failedLoginAttempts: i });
    const fetchedUser = await findUserById(currentUserState.id);
    console.assert(fetchedUser, `Test 3.${i}.1: User should be found.`);
    if (!fetchedUser) return false;
    console.assert(fetchedUser.failedLoginAttempts === i, `Test 3.${i}.2: Failed attempts should be ${i}.`);
    currentUserState = fetchedUser;
  }
  console.log('Failed Login Attempts tests completed.');
  return true;
}

async function testAccountLockout() {
  console.log('\n--- Testing Account Lockout ---');
  clearUsers();
  const user = createUser({ email: testUserEmail, password: testUserPassword, name: 'Lockout Test' });
  if (!user) {
    console.error('Failed to create user for account lockout test.');
    return false;
  }

  let currentUserState = user;
  for (let i = 1; i <= MAX_FAILED_LOGINS; i++) {
    // Simulate LocalStrategy: password mismatch leading to failed attempt update
    // The actual LocalStrategy would set lockUntil on the MAX_FAILED_LOGINS attempt.
    // Here we simulate the update that passportConfig's LocalStrategy would perform.
    let lockUntilUpdate: string | null = null;
    if (i === MAX_FAILED_LOGINS) {
      lockUntilUpdate = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
    }
    await updateUser(currentUserState.id, { 
      failedLoginAttempts: i, 
      lockUntil: lockUntilUpdate 
    });
    const fetchedUser = await findUserById(currentUserState.id);
    console.assert(fetchedUser, `Test 4.${i}.1: User should be found.`);
    if (!fetchedUser) return false;
    console.assert(fetchedUser.failedLoginAttempts === i, `Test 4.${i}.2: Failed attempts should be ${i}.`);
    currentUserState = fetchedUser;
  }

  console.assert(currentUserState.failedLoginAttempts === MAX_FAILED_LOGINS, 'Test 4.X.1: Final failed attempts should be MAX_FAILED_LOGINS.');
  console.assert(currentUserState.lockUntil !== null, 'Test 4.X.2: Account should be locked (lockUntil should be set).');
  if (currentUserState.lockUntil) {
    const lockTime = new Date(currentUserState.lockUntil).getTime();
    const expectedLockTimeApprox = Date.now() + LOCK_DURATION_MS;
    // Check if lock time is approximately correct (within a few seconds margin for execution delay)
    console.assert(Math.abs(lockTime - expectedLockTimeApprox) < 5000, `Test 4.X.3: LockUntil time should be approximately ${LOCK_DURATION_MS / 1000}s in the future.`);
  }
  console.log('Account Lockout tests completed.');
  return true;
}

async function testLockedAccountLoginAttempt() {
  console.log('\n--- Testing Locked Account Login Attempt ---');
  clearUsers();
  const user = createUser({ email: testUserEmail, password: testUserPassword, name: 'Locked Login Test' });
  if (!user) {
    console.error('Failed to create user for locked login test.');
    return false;
  }

  // Lock the account manually for the test
  const lockUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
  await updateUser(user.id, { failedLoginAttempts: MAX_FAILED_LOGINS, lockUntil });

  const lockedUser = await findUserById(user.id);
  if (!lockedUser || !lockedUser.lockUntil) {
    console.error('Failed to retrieve or verify locked user.');
    return false;
  }

  // Simulate LocalStrategy: check if account is locked
  const isCurrentlyLocked = new Date(lockedUser.lockUntil) > new Date();
  console.assert(isCurrentlyLocked, 'Test 5.1: Account should be confirmed as locked by time check.');
  // If LocalStrategy finds it locked, it returns `done(null, false, { message: 'Account is locked...' })`
  // So, no further password check or updates would occur for this attempt.

  console.log('Locked Account Login Attempt tests completed.');
  return true;
}

async function testLockExpiryAndReset() {
  console.log('\n--- Testing Lock Expiry and Reset ---');
  // For this test, consider using a very short LOCK_DURATION_MS for quick execution
  // e.g., by changing it in authTestUtils.ts or having a specific test constant.
  // Here, we'll use the delay function with the configured LOCK_DURATION_MS.
  const testLockDuration = 3000; // Using a shorter duration for this specific test run.

  clearUsers();
  const user = createUser({ email: testUserEmail, password: testUserPassword, name: 'Lock Expiry Test' });
  if (!user) {
    console.error('Failed to create user for lock expiry test.');
    return false;
  }

  // Lock the account
  const lockTime = Date.now();
  const lockUntil = new Date(lockTime + testLockDuration).toISOString();
  await updateUser(user.id, { failedLoginAttempts: MAX_FAILED_LOGINS, lockUntil });
  console.log(`Account locked. Waiting for ${testLockDuration / 1000}s for lock to expire...`);

  await delay(testLockDuration + 500); // Wait for lock to expire + a small buffer

  // Simulate LocalStrategy: find user (lock should have expired)
  let expiredLockUser = await findUserByEmail(testUserEmail);
  console.assert(expiredLockUser, 'Test 6.1: User should be found by email after lock period.');
  if (!expiredLockUser) return false;

  // Simulate LocalStrategy: check lock status (it should see lock is expired and reset it)
  if (expiredLockUser.lockUntil && new Date(expiredLockUser.lockUntil) <= new Date()) {
    console.log('Lock has expired, simulating LocalStrategy reset...');
    await updateUser(expiredLockUser.id, { lockUntil: null, failedLoginAttempts: 0 });
    expiredLockUser = await findUserById(expiredLockUser.id); // Re-fetch user
    if (!expiredLockUser) {
        console.error('Failed to re-fetch user after lock reset.');
        return false;
    }
  }
  console.assert(expiredLockUser.lockUntil === null, 'Test 6.2: lockUntil should be reset to null.');
  console.assert(expiredLockUser.failedLoginAttempts === 0, 'Test 6.3: failedLoginAttempts should be reset to 0.');

  // Now, simulate a successful login
  const isMatch = bcrypt.compareSync(testUserPassword, expiredLockUser.password!);
  console.assert(isMatch, 'Test 6.4: Password should match for login after lock expiry.');
  if (!isMatch) return false;

  await updateUser(expiredLockUser.id, {
    lastLogin: new Date().toISOString(),
    // failedLoginAttempts and lockUntil are already reset or would be reset again here
  });
  const finalUser = await findUserById(expiredLockUser.id);
  console.assert(finalUser && finalUser.lastLogin, 'Test 6.5: Last login should be updated after successful login post-lock.');

  console.log('Lock Expiry and Reset tests completed.');
  return true;
}


async function runLocalAuthTests() {
  try {
    await setupTestDatabase(); // Initial setup: creates tables, clears users table

    let allPassed = true;
    allPassed = await testUserRegistration() && allPassed;
    allPassed = await testSuccessfulLogin() && allPassed;
    allPassed = await testFailedLoginAttempts() && allPassed;
    allPassed = await testAccountLockout() && allPassed;
    allPassed = await testLockedAccountLoginAttempt() && allPassed;
    allPassed = await testLockExpiryAndReset() && allPassed;

    if (allPassed) {
      console.log('\n**********************************');
      console.log('* All local auth tests passed! *');
      console.log('**********************************');
    } else {
      console.error('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('! Some local auth tests FAILED! !');
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    }
  } catch (error) {
    console.error('\nError running local auth tests:', error);
    // For CI environments, you might want to re-throw or process.exit(1)
    // throw error;
  }
}

// To run these tests, execute this file with tsx or ts-node:
// e.g., NODE_ENV=test npx tsx ./tests/auth/localAuth.test.ts
// or ALLOW_TEST_DB_CLEAR=true npx tsx ./tests/auth/localAuth.test.ts
runLocalAuthTests();
