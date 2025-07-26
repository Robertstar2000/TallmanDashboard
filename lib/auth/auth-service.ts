// Authentication service for user management
// This file handles user authentication, authorization, and user management operations

export interface User {
  id: number;
  email: string;
  display_name: string;
  access_level: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  email: string;
  display_name: string;
  access_level: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  notes?: string;
}

export interface UpdateUserRequest {
  email?: string;
  display_name?: string;
  access_level?: 'user' | 'admin' | 'super_admin';
  is_active?: boolean;
  notes?: string;
}

// Client-side API functions for authentication
export class AuthService {
  private static baseUrl = '/api/auth';

  // Get all users
  static async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users`);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id: number): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/email/${encodeURIComponent(email)}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  // Create new user
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  static async deleteUser(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete user: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Check if user has required access level
  static hasRequiredAccess(user: User, requiredLevel: 'user' | 'admin' | 'super_admin'): boolean {
    const accessLevels = ['user', 'admin', 'super_admin'];
    const userLevelIndex = accessLevels.indexOf(user.access_level);
    const requiredLevelIndex = accessLevels.indexOf(requiredLevel);
    
    return userLevelIndex >= requiredLevelIndex;
  }

  // Validate user data
  static validateUserData(userData: CreateUserRequest | UpdateUserRequest): string[] {
    const errors: string[] = [];

    if ('email' in userData && userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        errors.push('Invalid email format');
      }
    }

    if ('display_name' in userData && userData.display_name) {
      if (userData.display_name.trim().length < 2) {
        errors.push('Display name must be at least 2 characters long');
      }
    }

    if ('access_level' in userData && userData.access_level) {
      if (!['user', 'admin', 'super_admin'].includes(userData.access_level)) {
        errors.push('Invalid access level');
      }
    }

    return errors;
  }
}

// Server-side database operations (to be used in API routes)
export class AuthDatabase {
  private db: any;

  constructor(database: any) {
    this.db = database;
  }

  // Initialize users table
  initializeUsersTable(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        access_level TEXT NOT NULL CHECK (access_level IN ('user', 'admin', 'super_admin')),
        is_active BOOLEAN NOT NULL DEFAULT 1,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    this.db.exec(createTableSQL);
  }

  // Get all users
  getAllUsers(): User[] {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all();
  }

  // Get user by ID
  getUserById(id: number): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) || null;
  }

  // Get user by email
  getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) || null;
  }

  // Create new user
  createUser(userData: CreateUserRequest): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (email, display_name, access_level, is_active, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userData.email,
      userData.display_name,
      userData.access_level,
      userData.is_active,
      userData.notes || null
    );

    return this.getUserById(result.lastInsertRowid as number)!;
  }

  // Update user
  updateUser(id: number, userData: UpdateUserRequest): User | null {
    const user = this.getUserById(id);
    if (!user) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (userData.email !== undefined) {
      updates.push('email = ?');
      values.push(userData.email);
    }

    if (userData.display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(userData.display_name);
    }

    if (userData.access_level !== undefined) {
      updates.push('access_level = ?');
      values.push(userData.access_level);
    }

    if (userData.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(userData.is_active);
    }

    if (userData.notes !== undefined) {
      updates.push('notes = ?');
      values.push(userData.notes);
    }

    if (updates.length === 0) {
      return user; // No updates to make
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.getUserById(id);
  }

  // Delete user
  deleteUser(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Check if email exists
  emailExists(email: string, excludeId?: number): boolean {
    let stmt;
    if (excludeId) {
      stmt = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ? AND id != ?');
      const result = stmt.get(email, excludeId);
      return result.count > 0;
    } else {
      stmt = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?');
      const result = stmt.get(email);
      return result.count > 0;
    }
  }
}
