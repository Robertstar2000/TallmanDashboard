import initSqlJs, { Database } from 'sql.js';

export interface DashboardMetric {
  id: number;
  chartGroup: string;
  variableName: string;
  dataPoint: string;
  serverName: string;
  tableName: string;
  productionSqlExpression: string;
  value: string;
  calculationType: string;
  lastUpdated: string;
}

export interface AuthenticatedUser {
  id: number;
  userName: string;
  privilege: 'User' | 'Admin' | 'BackdoorUser';
}

class DatabaseService {
  private db: Database | null = null;
  private SQL: any = null;

  async initialize(): Promise<void> {
    try {
      // Initialize SQL.js
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // Create new database
      this.db = new this.SQL.Database();

      // Create tables
      await this.createTables();
      
      // Initialize with default data
      await this.initializeDefaultData();

      console.log('✅ SQL.js database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create dashboard_metrics table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS dashboard_metrics (
        id INTEGER PRIMARY KEY,
        chartGroup TEXT NOT NULL,
        variableName TEXT UNIQUE NOT NULL,
        dataPoint TEXT NOT NULL,
        serverName TEXT NOT NULL,
        tableName TEXT NOT NULL,
        productionSqlExpression TEXT NOT NULL,
        value TEXT NOT NULL DEFAULT '0',
        calculationType TEXT NOT NULL,
        lastUpdated TEXT NOT NULL
      )
    `);

    // Create authenticator table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS authenticator (
        id INTEGER PRIMARY KEY,
        userName TEXT UNIQUE NOT NULL,
        privilege TEXT NOT NULL CHECK (privilege IN ('User', 'Admin', 'BackdoorUser'))
      )
    `);

    console.log('✅ Database tables created');
  }

  private async initializeDefaultData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Load metrics from allData.json (if available)
    try {
      const response = await fetch('/allData.json');
      if (response.ok) {
        const metricsData = await response.json();
        
        // Insert metrics into database
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO dashboard_metrics 
          (id, chartGroup, variableName, dataPoint, serverName, tableName, productionSqlExpression, value, calculationType, lastUpdated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        metricsData.forEach((metric: any) => {
          stmt.run([
            metric.id,
            metric.chartGroup,
            metric.variableName,
            metric.dataPoint,
            metric.serverName,
            metric.tableName,
            metric.productionSqlExpression,
            metric.value?.toString() || '0',
            metric.calculationType,
            metric.lastUpdated || new Date().toISOString()
          ]);
        });

        stmt.free();
        console.log(`✅ Loaded ${metricsData.length} metrics from allData.json`);
      }
    } catch (error) {
      console.warn('⚠️ Could not load allData.json, using empty metrics table');
    }

    // Initialize default users
    const defaultUsers = [
      { userName: 'admin', privilege: 'Admin' },
      { userName: 'user', privilege: 'User' },
      { userName: 'backdoor', privilege: 'BackdoorUser' }
    ];

    const userStmt = this.db.prepare(`
      INSERT OR IGNORE INTO authenticator (userName, privilege)
      VALUES (?, ?)
    `);

    defaultUsers.forEach(user => {
      userStmt.run([user.userName, user.privilege]);
    });

    userStmt.free();
    console.log('✅ Default users initialized');
  }

  // Metrics operations
  getAllMetrics(): DashboardMetric[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM dashboard_metrics ORDER BY id');
    const results = stmt.getAsObject({});
    stmt.free();
    
    return results as DashboardMetric[];
  }

  getMetricsByChartGroup(chartGroup: string): DashboardMetric[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM dashboard_metrics WHERE chartGroup = ? ORDER BY id');
    const results = stmt.getAsObject({ $chartGroup: chartGroup });
    stmt.free();
    
    return results as DashboardMetric[];
  }

  updateMetricValue(variableName: string, value: string): boolean {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(`
        UPDATE dashboard_metrics 
        SET value = ?, lastUpdated = ? 
        WHERE variableName = ?
      `);
      
      stmt.run([value, new Date().toISOString(), variableName]);
      stmt.free();
      
      return true;
    } catch (error) {
      console.error('Failed to update metric:', error);
      return false;
    }
  }

  updateMultipleMetrics(updates: { variableName: string; value: string }[]): boolean {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(`
        UPDATE dashboard_metrics 
        SET value = ?, lastUpdated = ? 
        WHERE variableName = ?
      `);

      const timestamp = new Date().toISOString();
      updates.forEach(update => {
        stmt.run([update.value, timestamp, update.variableName]);
      });
      
      stmt.free();
      return true;
    } catch (error) {
      console.error('Failed to update metrics:', error);
      return false;
    }
  }

  // User authentication operations
  authenticateUser(userName: string): AuthenticatedUser | null {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM authenticator WHERE userName = ?');
    const result = stmt.getAsObject({ $userName: userName });
    stmt.free();
    
    return result.length > 0 ? result[0] as AuthenticatedUser : null;
  }

  getAllUsers(): AuthenticatedUser[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM authenticator ORDER BY userName');
    const results = stmt.getAsObject({});
    stmt.free();
    
    return results as AuthenticatedUser[];
  }

  addUser(userName: string, privilege: 'User' | 'Admin' | 'BackdoorUser'): boolean {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare('INSERT INTO authenticator (userName, privilege) VALUES (?, ?)');
      stmt.run([userName, privilege]);
      stmt.free();
      return true;
    } catch (error) {
      console.error('Failed to add user:', error);
      return false;
    }
  }

  removeUser(userName: string): boolean {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare('DELETE FROM authenticator WHERE userName = ?');
      stmt.run([userName]);
      stmt.free();
      return true;
    } catch (error) {
      console.error('Failed to remove user:', error);
      return false;
    }
  }

  // Database backup and restore
  exportDatabase(): Uint8Array {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.export();
  }

  importDatabase(data: Uint8Array): boolean {
    try {
      if (this.db) {
        this.db.close();
      }
      this.db = new this.SQL.Database(data);
      console.log('✅ Database imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import database:', error);
      return false;
    }
  }

  // Custom SQL queries
  executeQuery(sql: string, params: any[] = []): any[] {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(sql);
      const results = stmt.getAsObject(params);
      stmt.free();
      return results;
    } catch (error) {
      console.error('SQL query failed:', error);
      throw error;
    }
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default DatabaseService;
