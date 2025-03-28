import Database from 'better-sqlite3';
import path from 'path';

// This file should only be imported in server-side code (API routes)
class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database;

  private constructor() {
    const dbPath = path.join(process.cwd(), 'dashboard.db');
    this.db = new Database(dbPath);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public executeQuery(serverType: 'P21' | 'POR', tableName: string, sqlExpression: string) {
    try {
      // Log query details in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`
          ========== EXECUTING QUERY ==========
          Server: ${serverType}
          Table: ${tableName}
          Query: ${sqlExpression}
          ===================================
        `);
      }

      const stmt = this.db.prepare(sqlExpression);
      const result = stmt.all();
      
      // If result is an array with one row and one column, return that value
      if (Array.isArray(result) && result.length === 1) {
        const row = result[0];
        if (typeof row === 'object' && row !== null) {
          const keys = Object.keys(row);
          if (keys.length === 1) {
            return row[keys[0]];
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  public executeWrite(sqlExpression: string) {
    try {
      const stmt = this.db.prepare(sqlExpression);
      return stmt.run();
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  public isServerConnected(serverType: 'P21' | 'POR'): boolean {
    try {
      const stmt = this.db.prepare('SELECT 1');
      stmt.get();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const db = DatabaseService.getInstance();
