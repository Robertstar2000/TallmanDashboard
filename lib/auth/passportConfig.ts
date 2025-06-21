import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import LdapStrategy from 'passport-ldapauth';
// import User from '../models/user'; // Removed Mongoose User model
import { IUser } from '../db/types'; // Using IUser from SQLite types
import { findUserByEmail, findUserById, createUser, updateUser } from '../db/server'; // SQLite db functions
import bcrypt from 'bcryptjs'; // For password comparison
import ldapConfig from './ldapConfig';
// import dbConnect from '../db/mongoose'; // Removed Mongoose connection

// Account Lock Configuration
const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // Lock duration in milliseconds (15 minutes)

// Local strategy for username/password authentication
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email: string, password: string, done: (error: any, user?: IUser | false | null, options?: { message: string }) => void) => {
    try {
      const user = await findUserByEmail(email.toLowerCase());

      if (!user) {
        return done(null, false, { message: 'Invalid email or password.' });
      }

      // Check if account is currently locked
      if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
        return done(null, false, { message: `Account is locked. Please try again after ${new Date(user.lockUntil).toLocaleTimeString()}.` });
      }
      // If lock expired, reset lockUntil and failedLoginAttempts before proceeding
      if (user.lockUntil && new Date(user.lockUntil) <= new Date()) {
        await updateUser(user.id, { lockUntil: null, failedLoginAttempts: 0 });
        // Refresh user data after update
        const refreshedUser = await findUserById(user.id);
        if (!refreshedUser) return done(null, false, { message: 'Error refreshing user data.'});
        Object.assign(user, refreshedUser); // Update current user object with refreshed data
      }

      if (user.isLdapUser && !user.password) { // LDAP user without a local password set
        if (ldapConfig.enabled) {
            return done(null, false, { message: 'LDAP user. Please use LDAP login.' });
        }
        // If LDAP is disabled, and no local password, they can't log in locally.
        return done(null, false, { message: 'LDAP user with no local password. Cannot log in locally.' });
      }
      
      // If it's an LDAP user but they DO have a password, local auth is allowed (e.g. fallback or admin set password)
      // Or if it's a non-LDAP user, proceed with password check.
      if (!user.password) { // Should not happen for non-LDAP users if schema is enforced
        return done(null, false, { message: 'No password set for this user.' });
      }

      const isMatch = bcrypt.compareSync(password, user.password);

      if (!isMatch) {
        const currentFailedAttempts = (user.failedLoginAttempts || 0) + 1;
        let lockUntilUpdate: string | null = null;
        let statusUpdate: IUser['status'] | undefined = user.status;

        if (currentFailedAttempts >= MAX_FAILED_LOGINS) {
          lockUntilUpdate = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
          statusUpdate = 'locked'; // Optionally update status to 'locked'
          await updateUser(user.id, { failedLoginAttempts: currentFailedAttempts, lockUntil: lockUntilUpdate, status: statusUpdate });
          return done(null, false, { message: `Account locked due to too many failed attempts. Please try again after ${new Date(lockUntilUpdate).toLocaleTimeString()}.` });
        } else {
          await updateUser(user.id, { failedLoginAttempts: currentFailedAttempts });
        }
        return done(null, false, { message: 'Invalid email or password.' });
      }

      // Successful login
      await updateUser(user.id, {
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLogin: new Date().toISOString(),
        status: user.status === 'locked' ? 'active' : user.status // Unlock if previously locked by attempts
      });
      
      // Fetch the latest user data to return
      const updatedUser = await findUserById(user.id);
      return done(null, updatedUser);

    } catch (error) {
      console.error('Error in LocalStrategy:', error);
      return done(error);
    }
  }
));

// LDAP strategy for directory authentication
if (ldapConfig.enabled && ldapConfig.server.url) {
  passport.use(new LdapStrategy(
    {
      server: ldapConfig.server,
      usernameField: 'email',
      passwordField: 'password',
    },
    async (ldapProfile: any, done: (error: any, user?: IUser | false | null, options?: { message: string }) => void) => {
      try {
        const emailAttribute = ldapConfig.server.searchAttributes?.find(attr => attr.toLowerCase().includes('mail')) || 'mail';
        const uidAttribute = ldapConfig.userLoginAttr || 'uid';
        const nameAttribute = ldapConfig.server.searchAttributes?.find(attr => attr.toLowerCase().includes('displayname')) || 'displayName';
        
        const ldapEmail = ldapProfile[emailAttribute]?.[0] || ldapProfile[emailAttribute] || ldapProfile[uidAttribute]?.[0] || ldapProfile[uidAttribute];
        let ldapName = ldapProfile[nameAttribute]?.[0] || ldapProfile[nameAttribute];

        if (!ldapEmail) {
          console.error('LDAP Profile:', ldapProfile);
          return done(new Error('Email not found in LDAP profile. Check LDAP searchAttributes and userLoginAttr configuration.'));
        }
        if (!ldapName) ldapName = ldapEmail.split('@')[0]; // Fallback name

        let user = await findUserByEmail(ldapEmail.toLowerCase());

        if (!user) {
          // Create new local user from LDAP profile
          user = await createUser({
            email: ldapEmail.toLowerCase(),
            name: ldapName,
            isLdapUser: true,
            status: 'active', // Default status for new LDAP users
            role: 'user' // Default role
          });
          if (!user) {
            return done(new Error('Failed to create local user account from LDAP profile.'));
          }
          // Set lastLogin for the newly created user
          await updateUser(user.id, { lastLogin: new Date().toISOString() });
        } else {
          // Update existing local user
          const updates: Partial<IUser> = {
            name: ldapName,
            isLdapUser: true, // Ensure it's marked as LDAP
            lastLogin: new Date().toISOString(),
            failedLoginAttempts: 0, // Reset failed attempts on successful LDAP login
            lockUntil: null, // Unlock account on successful LDAP login
            status: user.status === 'locked' ? 'active' : user.status // Reactivate if locked
          };
          await updateUser(user.id, updates);
        }
        
        // Fetch the latest user data to return
        const finalUser = await findUserById(user.id);
        return done(null, finalUser);

      } catch (error) {
        console.error('Error processing LDAP user:', error);
        return done(error);
      }
    }
  ));
} else {
  if (ldapConfig.enabled && !ldapConfig.server.url) {
    console.warn('LDAP is enabled but LDAP_URL is not configured. LDAP authentication will be skipped.');
  }
}

// Serialize user into the session
passport.serializeUser((user: IUser, done: (err: any, id?: string | null) => void) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done: (err: any, user?: IUser | false | null) => void) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (error) {
    console.error('Error in deserializeUser:', error);
    done(error, null);
  }
});

export default passport;
