import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional because LDAP users might not have a local password
  status: 'admin' | 'user';
  isLdapUser: boolean;
  failedLoginAttempts: number;
  accountLocked: boolean;
  lockUntil?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isAccountLocked(): boolean;
  registerFailedLogin(): Promise<void>;
  resetFailedLoginAttempts(): Promise<void>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { 
    type: String, 
    required: function(this: IUser) { 
      return !this.isLdapUser; 
    } 
  },
  status: { type: String, enum: ['admin', 'user'], default: 'user' },
  isLdapUser: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0 },
  accountLocked: { type: Boolean, default: false },
  lockUntil: { type: Date },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true }); // Enable Mongoose timestamps for createdAt and updatedAt

// Password hashing middleware
userSchema.pre<IUser>('save', async function(next) {
  const user = this;
  
  if (!user.isModified('password') || !user.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false; // Should not happen for non-LDAP users if logic is correct
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function(): boolean {
  if (this.accountLocked && this.lockUntil && this.lockUntil > new Date()) {
    return true;
  }
  
  if (this.accountLocked && this.lockUntil && this.lockUntil <= new Date()) {
    this.accountLocked = false;
    this.lockUntil = undefined;
    this.failedLoginAttempts = 0;
    // Note: User plan mentioned considering if save() here is appropriate.
    // For now, this method only updates instance state; calling code should save.
    // To persist changes, this.save() would be needed, but that makes it async.
    // Let's keep it sync and let the caller handle saving for now.
    return false;
  }
  
  return false;
};

// Method to handle failed login
userSchema.methods.registerFailedLogin = async function(): Promise<void> {
  this.failedLoginAttempts += 1;
  
  if (this.failedLoginAttempts >= 5) {
    this.accountLocked = true;
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
  }
  // Caller should save the user instance after calling this method
};

// Method to reset failed login attempts
userSchema.methods.resetFailedLoginAttempts = async function(): Promise<void> {
  if (this.failedLoginAttempts > 0 || this.accountLocked) {
    this.failedLoginAttempts = 0;
    this.accountLocked = false;
    this.lockUntil = undefined;
  }
  // Caller should save the user instance after calling this method
};

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
