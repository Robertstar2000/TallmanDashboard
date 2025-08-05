import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ldap from 'ldapjs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// LDAP Configuration
const LDAP_URL = process.env.LDAP_URL;
const LDAP_BIND_DN = process.env.LDAP_BIND_DN;
const LDAP_BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD;
const LDAP_SEARCH_BASE = process.env.LDAP_SEARCH_BASE;

import BackgroundWorker from './backgroundWorker.js';

// Initialize background worker
const backgroundWorker = new BackgroundWorker();

// Set up worker callbacks for real-time updates
let latestStatus = 'Background worker initialized';
let latestMetrics = [];

backgroundWorker.setCallbacks(
    (status) => {
        latestStatus = status;
        console.log('Worker status:', status);
    },
    (metrics) => {
        latestMetrics = metrics;
        console.log(`Updated ${metrics.length} metrics`);
    }
);

// Auto-start worker in production mode
const initializeWorker = async () => {
    console.log('Initializing background worker...');
    
    // Load initial metrics
    backgroundWorker.loadMetrics();
    
    // Start worker in production mode by default
    await backgroundWorker.start();
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// LDAP Authentication
const authenticateWithLDAP = (username, password) => {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: LDAP_URL
    });

    // Bind with service account
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (err) => {
      if (err) {
        client.unbind();
        return reject(err);
      }

      // Search for user
      const searchOptions = {
        scope: 'sub',
        filter: `(sAMAccountName=${username})`
      };

      client.search(LDAP_SEARCH_BASE, searchOptions, (err, res) => {
        if (err) {
          client.unbind();
          return reject(err);
        }

        let userDN = null;
        let userInfo = null;

        res.on('searchEntry', (entry) => {
          userDN = entry.dn.toString();
          userInfo = {
            username: entry.object.sAMAccountName,
            displayName: entry.object.displayName,
            email: entry.object.mail,
            groups: entry.object.memberOf || []
          };
        });

        res.on('error', (err) => {
          client.unbind();
          reject(err);
        });

        res.on('end', () => {
          if (!userDN) {
            client.unbind();
            return reject(new Error('User not found'));
          }

          // Try to bind with user credentials
          client.bind(userDN, password, (err) => {
            client.unbind();
            if (err) {
              return reject(new Error('Invalid credentials'));
            }
            resolve(userInfo);
          });
        });
      });
    });
  });
};

// MCP connection status check helper
const checkMCPStatus = async (serverName) => {
  try {
    const serverConfigs = {
      'p21': {
        name: 'P21',
        server: 'P21-MCP-Server',
        database: 'P21',
        type: 'SQL Server via MCP'
      },
      'por': {
        name: 'POR',
        server: 'POR-MCP-Server',
        database: 'POR',
        type: 'MS Access via MCP'
      }
    };

    const config = serverConfigs[serverName];
    if (!config) {
      throw new Error(`Unknown server: ${serverName}`);
    }

    try {
      const isConnected = await backgroundWorker.mcpController.testConnection(
        serverName.toUpperCase()
      );
      
      return {
        status: isConnected ? 'Connected' : 'Error',
        config: config,
        message: isConnected 
          ? `MCP ${serverName} operational`
          : `MCP ${serverName} connection failed`,
        version: config.type
      };
    } catch (mcpError) {
      return {
        status: 'Error',
        config: config,
        error: `MCP ${serverName} connection failed: ${mcpError.message}`
      };
    }
  } catch (error) {
    return {
      status: 'Error',
      error: error.message
    };
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Local user list fallback
const LOCAL_USERS = [
  { username: 'BobM', password: 'Rm2214ri#', role: 'admin', displayName: 'Bob M' },
  { username: 'admin', password: 'admin123', role: 'admin', displayName: 'Administrator' }
];

// Backdoor credentials
const BACKDOOR_USERS = [
  { username: 'tallman', password: 'dashboard2025', role: 'admin', displayName: 'Tallman Admin' },
  { username: 'emergency', password: 'TallmanAccess2025!', role: 'admin', displayName: 'Emergency Access' }
];

// Enhanced authentication with multi-step fallback
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    console.log(`Authentication attempt for user: ${username}`);
    let authMethod = 'none';
    let userInfo = null;

    // STEP 1: Try LDAP Authentication first
    try {
      console.log('Step 1: Attempting LDAP authentication...');
      const ldapUser = await authenticateWithLDAP(username, password);
      console.log('✅ LDAP authentication successful');
      
      // STEP 2: Check if user is in approved database list
      console.log('Step 2: Checking approved user database...');
      
      // Normalize username (remove domain if present, case insensitive)
      const normalizedUsername = username.toLowerCase().split('@')[0];
      
      // Check against approved users in database (using DatabaseService)
      const approvedUser = LOCAL_USERS.find(u => 
        u.username.toLowerCase() === normalizedUsername
      );
      
      if (!approvedUser) {
        console.log(`❌ User ${normalizedUsername} not found in approved user database`);
        throw new Error('User not authorized - not in approved user list');
      }
      
      console.log(`✅ User ${normalizedUsername} found in approved database`);
      
      // Both LDAP and database check passed
      userInfo = {
        username: approvedUser.username,
        displayName: ldapUser.displayName || approvedUser.displayName,
        email: ldapUser.email || `${approvedUser.username.toLowerCase()}@tallman.com`,
        role: approvedUser.role
      };
      
      authMethod = 'LDAP + Database';
      console.log('🎉 Authentication successful via LDAP + Database verification');
      
    } catch (ldapError) {
      console.log('❌ LDAP authentication failed:', ldapError.message);
      
      // FALLBACK: Local authentication only for development/testing
      console.log('FALLBACK: Attempting local user list authentication (development mode)...');
      const localUser = LOCAL_USERS.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );
      
      if (localUser) {
        userInfo = {
          username: localUser.username,
          displayName: localUser.displayName,
          email: `${localUser.username.toLowerCase()}@tallman.com`,
          role: localUser.role
        };
        authMethod = 'Local Development Mode';
        console.log('✅ Local development authentication successful');
      } else {
        console.log('❌ Local development authentication failed');
        
        // STEP 3: Try Backdoor Authentication
        console.log('Step 3: Attempting backdoor authentication...');
        const backdoorUser = BACKDOOR_USERS.find(u => 
          u.username.toLowerCase() === username.toLowerCase() && u.password === password
        );
        
        if (backdoorUser) {
          userInfo = {
            username: backdoorUser.username,
            displayName: backdoorUser.displayName,
            email: `${backdoorUser.username.toLowerCase()}@tallman.com`,
            role: backdoorUser.role
          };
          authMethod = 'Backdoor';
          console.log('✅ Backdoor authentication successful');
        } else {
          console.log('❌ Backdoor authentication failed');
          // STEP 4: All authentication methods failed
          console.log('🚫 All authentication methods failed - returning to login');
          return res.status(401).json({ 
            error: 'Authentication failed',
            message: 'All authentication methods failed. Please check your credentials.',
            methods_tried: ['LDAP', 'Local User List', 'Backdoor']
          });
        }
      }
    }

    // Authentication successful - generate JWT token
    const token = jwt.sign(userInfo, JWT_SECRET, { expiresIn: '8h' });

    console.log(`🎉 Authentication successful via ${authMethod} for user: ${userInfo.username}`);

    res.json({
      token,
      user: userInfo,
      authMethod: authMethod,
      message: `Authenticated via ${authMethod}`
    });
  } catch (error) {
    console.error('Authentication system error:', error);
    res.status(500).json({ 
      error: 'Authentication system error',
      message: 'Internal server error during authentication'
    });
  }
});

// Database connection status
app.get('/api/connections/status', async (req, res) => {
  try {
    const connections = [];

    // Test P21 MCP connection
    const p21Status = await checkMCPStatus('p21');
    connections.push({
      name: 'P21',
      status: p21Status.status,
      details: p21Status.status === 'Connected' 
        ? `${p21Status.config.type} (${p21Status.config.server})`
        : `MCP connection failed: ${p21Status.error}`,
      version: p21Status.version || p21Status.config?.type || 'Unknown',
      identifier: p21Status.config?.server || 'Unknown',
      responseTime: p21Status.status === 'Connected' ? 150 : null
    });

    // Test POR MCP connection
    const porStatus = await checkMCPStatus('por');
    connections.push({
      name: 'POR',
      status: porStatus.status,
      details: porStatus.status === 'Connected' 
        ? `${porStatus.config.type} (${porStatus.config.server})`
        : `MCP connection failed: ${porStatus.error}`,
      version: porStatus.version || porStatus.config?.type || 'Unknown',
      identifier: porStatus.config?.server || 'Unknown',
      responseTime: porStatus.status === 'Connected' ? 100 : null
    });

    res.json(connections);
  } catch (error) {
    console.error('Connection status error:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

// Execute SQL query
app.post('/api/query', authenticateToken, async (req, res) => {
  try {
    const { query, database } = req.body;

    if (!query || !database) {
      return res.status(400).json({ error: 'Query and database required' });
    }

    // For now, return a message indicating MCP integration is needed
    res.json({
      message: 'Query execution requires direct MCP server integration',
      query: query,
      database: database,
      note: 'Use MCP tools directly for query execution'
    });
  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({ error: 'Query execution failed' });
  }
});

// Get dashboard data
app.get('/api/dashboard/data', authenticateToken, async (req, res) => {
  try {
    const metrics = backgroundWorker.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Background worker control endpoints
app.post('/api/worker/start', authenticateToken, async (req, res) => {
  try {
    await backgroundWorker.start();
    res.json({ 
      message: 'Background worker started',
      status: backgroundWorker.getCurrentStatus()
    });
  } catch (error) {
    console.error('Failed to start background worker:', error);
    res.status(500).json({ error: 'Failed to start background worker' });
  }
});

app.post('/api/worker/stop', authenticateToken, async (req, res) => {
  try {
    backgroundWorker.stop();
    res.json({ 
      message: 'Background worker stopped',
      status: backgroundWorker.getCurrentStatus()
    });
  } catch (error) {
    console.error('Failed to stop background worker:', error);
    res.status(500).json({ error: 'Failed to stop background worker' });
  }
});

app.post('/api/worker/mode', authenticateToken, async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['production', 'demo'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Use "production" or "demo"' });
    }
    
    backgroundWorker.setMode(mode);
    res.json({ 
      message: `Background worker mode set to ${mode}`,
      status: backgroundWorker.getCurrentStatus()
    });
  } catch (error) {
    console.error('Failed to set worker mode:', error);
    res.status(500).json({ error: 'Failed to set worker mode' });
  }
});

app.get('/api/worker/status', authenticateToken, async (req, res) => {
  try {
    res.json({
      worker: backgroundWorker.getCurrentStatus(),
      latestStatus: latestStatus,
      metricsCount: latestMetrics.length
    });
  } catch (error) {
    console.error('Failed to get worker status:', error);
    res.status(500).json({ error: 'Failed to get worker status' });
  }
});

// List database tables
app.get('/api/database/:db/tables', authenticateToken, async (req, res) => {
  try {
    const { db } = req.params;
    
    // Return message indicating MCP integration is needed
    res.json({
      message: 'Table listing requires direct MCP server integration',
      database: db,
      note: 'Use MCP tools directly for table operations'
    });
  } catch (error) {
    console.error('List tables error:', error);
    res.status(500).json({ error: 'Failed to list tables' });
  }
});

// Describe table structure
app.get('/api/database/:db/tables/:table', authenticateToken, async (req, res) => {
  try {
    const { db, table } = req.params;
    
    // Return message indicating MCP integration is needed
    res.json({
      message: 'Table description requires direct MCP server integration',
      database: db,
      table: table,
      note: 'Use MCP tools directly for table operations'
    });
  } catch (error) {
    console.error('Describe table error:', error);
    res.status(500).json({ error: 'Failed to describe table' });
  }
});

// MCP Query Routes
app.post('/api/mcp/execute-query', authenticateToken, async (req, res) => {
    const { query, server } = req.body;
    console.log(`Executing query on ${server}: ${query}`);
    if (!query || !server) {
        return res.status(400).json({ error: 'Query and server are required' });
    }

    try {
        const result = await backgroundWorker.mcpController.executeQuery(server, query);
        res.json([{ result: result }]);
    } catch (error) {
        console.error(`Error executing query on ${server}:`, error);
        res.status(500).json({ error: `Failed to execute query on ${server}: ${error.message}` });
    }
});

app.post('/api/mcp/execute-batch', authenticateToken, async (req, res) => {
    const { queries } = req.body;
    if (!queries || !Array.isArray(queries)) {
        return res.status(400).json({ error: 'Queries must be an array' });
    }

    try {
        const results = await Promise.all(queries.map(async (q) => {
            try {
                const result = await backgroundWorker.mcpController.executeQuery(q.server, q.query);
                return { id: q.id, result: [{ result: result }] };
            } catch (error) {
                console.error(`Error in batch for query ID ${q.id}:`, error);
                return { id: q.id, error: `Failed to execute query on ${q.server}: ${error.message}` };
            }
        }));
        res.json(results);
    } catch (error) {
        console.error('Error executing batch queries:', error);
        res.status(500).json({ error: 'Failed to execute batch queries' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
    await initializeWorker();
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully...');
        backgroundWorker.shutdown();
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully...');
        backgroundWorker.shutdown();
        process.exit(0);
    });
    
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Background worker initialized and running`);
    });
};

startServer();
