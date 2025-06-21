# TallmanDashboard Test Scripts

This directory contains scripts for testing various functionalities of the TallmanDashboard application, particularly focusing on the authentication system after the migration to SQLite.

## Prerequisites

1.  **Node.js and npm:** Ensure you have Node.js and npm installed.
2.  **Dependencies:** Run `npm install` from the project root to install all necessary dependencies.
3.  **Database Helper:** Make sure the `clearUsersTableForTesting` function has been added to `lib/db/server.ts` as per instructions.
4.  **Environment (Optional but Recommended for DB safety):** When running tests that modify the database (like these auth tests), consider setting `NODE_ENV=test` or `ALLOW_TEST_DB_CLEAR=true` in your environment to allow the `clearUsersTableForTesting` function to run. For example:
    ```bash
    NODE_ENV=test npx tsx ./tests/auth/localAuth.test.ts
    ```

## Running Tests

Individual test files can be run using `tsx` (a TypeScript runner that's part of your devDependencies) or `ts-node`.

**Example:**

To run the local authentication tests:

```bash
cd c:\Users\BobM\CascadeProjects\TallmanDashboard_new
npx tsx ./tests/auth/localAuth.test.ts
```

(If you haven't installed `tsx` globally, `npx tsx` will use the project's version.)

## Test Structure

-   `auth/`: Contains authentication-related tests.
    -   `authTestUtils.ts`: Shared constants and utilities for auth tests.
    -   `localAuth.test.ts`: Tests for local username/password authentication, including registration, login, failed attempts, and account lockout.
    -   `ldapAuth.test.ts`: (To be added) Tests for LDAP authentication integration.
    -   `userProfile.test.ts`: (To be added) Tests for user profile update functionalities.
    -   `session.test.ts`: (To be added) Tests for session management (serialize/deserialize).
-   `testSetup.ts`: Provides functions for setting up the test database (initializing schema, clearing tables).

## Interpreting Output

The tests use `console.assert()` for checks. If an assertion fails, it will print an `AssertionError`. Successful tests will typically log progress messages.

Look for "All tests passed!" or similar messages at the end of a script's output for a summary.
