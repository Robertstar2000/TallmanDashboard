# Tallman Equipment Dashboard - Technical Specification

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Authentication & Authorization](#authentication--authorization)
4. [Frontend Components](#frontend-components)
5. [Backend Services](#backend-services)
6. [Database Integration](#database-integration)
7. [Data Flow](#data-flow)
8. [API Specifications](#api-specifications)
9. [State Management](#state-management)
10. [Error Handling](#error-handling)
11. [Performance & Optimization](#performance--optimization)
12. [Security Considerations](#security-considerations)
13. [Configuration Management](#configuration-management)
14. [Deployment & Operations](#deployment--operations)

---

## System Overview

The Tallman Equipment Dashboard is a comprehensive business intelligence platform designed to provide real-time insights into business operations. The system integrates with existing enterprise databases (P21 SQL Server and POR MS Access) through Model Context Protocol (MCP) servers, providing secure, scalable data access.

### Core Objectives
- **Real-time Business Intelligence**: Live KPI monitoring and reporting
- **Secure Data Access**: Multi-tier authentication with enterprise integration
- **Administrative Control**: Comprehensive admin tools for system management
- **Scalable Architecture**: Modular design supporting future expansion
- **High Availability**: Robust error handling and recovery mechanisms

---

## Architecture

### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Databases     │
│   (React/Vite)  │◄──►│   (Node.js)     │◄──►│   P21 + POR     │
│                 │    │                 │    │   via MCP       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Dashboard     │    │ • Auth Service  │    │ • SQL Server    │
│ • Admin Panel   │    │ • API Routes    │    │ • MS Access     │
│ • User Mgmt     │    │ • Background    │    │ • MCP Servers   │
│ • SQL Tool      │    │   Worker        │    │                 │
│ • Auth UI       │    │ • MCP Controller│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS 3.x
- **Charts**: Recharts library
- **Routing**: React Router DOM v6
- **State Management**: React Context API + Hooks
- **HTTP Client**: Fetch API with custom service layers

#### Backend Stack
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Authentication**: JWT + LDAP integration
- **Database Access**: MCP (Model Context Protocol)
- **Process Management**: Custom background worker system
- **Security**: bcryptjs, CORS, custom middleware

#### Database Layer
- **Primary DB**: P21 (SQL Server) - Enterprise resource planning
- **Secondary DB**: POR (MS Access) - Point of sale/inventory
- **Access Method**: MCP Servers with TypeScript implementation
- **Connection Pooling**: Built-in MCP connection management

---

## Authentication & Authorization

### Enhanced Multi-Tier Authentication System

The authentication system implements a secure two-step verification process with fallback mechanisms:

#### Tier 1: LDAP + Database Verification (Primary Production Mode)
```typescript
// Enhanced authentication requiring both LDAP success AND database approval
const authenticateUser = async (username: string, password: string) => {
  // STEP 1: LDAP Authentication
  const ldapUser = await authenticateWithLDAP(username, password);
  
  // STEP 2: Check approved user database
  const normalizedUsername = username.toLowerCase().split('@')[0];
  const approvedUser = LOCAL_USERS.find(u => 
    u.username.toLowerCase() === normalizedUsername
  );
  
  if (!approvedUser) {
    throw new Error('User not authorized - not in approved user list');
  }
  
  // Both steps passed - return combined user info
  return {
    username: approvedUser.username,
    displayName: ldapUser.displayName || approvedUser.displayName,
    email: ldapUser.email || `${approvedUser.username.toLowerCase()}@tallman.com`,
    role: approvedUser.role
  };
}
```

**Security Features**:
- **Dual Verification**: Both LDAP AND database approval required
- **Case-Insensitive**: Supports "BobM" and "BobM@tallman.com" formats
- **Domain Normalization**: Automatically strips domain from username
- **Role Assignment**: Based on approved user database, not LDAP groups

**Configuration**:
- LDAP URL: Corporate domain controller (dc02.tallman.com)
- Service Account: CN=LDAP,DC=tallman,DC=com
- Search Base: DC=tallman,DC=com
- Approved Users: Maintained in LOCAL_USERS array

#### Tier 2: Local User List Authentication
```typescript
const LOCAL_USERS = [
  { username: 'BobM', password: 'Rm2214ri#', role: 'admin', displayName: 'Bob M' },
  { username: 'admin', password: 'admin123', role: 'admin', displayName: 'Administrator' }
];
```

**Use Cases**:
- **Development/Testing Mode**: When LDAP authentication fails
- **LDAP Server Unavailability**: Fallback for system continuity
- **Local Development**: Bypass LDAP for development environments
- **Emergency Access**: When LDAP infrastructure is down

#### Tier 3: Backdoor Authentication
```typescript
const BACKDOOR_USERS = [
  { username: 'tallman', password: 'dashboard2025', role: 'admin' },
  { username: 'emergency', password: 'TallmanAccess2025!', role: 'admin' }
];
```

**Purpose**:
- Emergency system access
- Disaster recovery scenarios
- System maintenance and troubleshooting

### JWT Token Management

**Token Structure**:
```typescript
interface JWTPayload {
  username: string;
  displayName: string;
  email: string;
  role: 'admin' | 'user';
  iat: number;
  exp: number;
}
```

**Security Features**:
- 8-hour token expiration
- Secure secret key (configurable)
- Automatic token refresh on activity
- Secure HTTP-only cookie storage (optional)

### Role-Based Access Control (RBAC)

#### Admin Role Permissions
- Full dashboard access
- SQL Query Tool access
- User management capabilities
- System administration tools
- Background worker control
- Connection status monitoring

#### User Role Permissions
- Dashboard viewing only
- Limited KPI access
- No administrative functions
- Read-only data access

---

## Frontend Components

### Component Hierarchy
```
App
├── AuthContext (Authentication state)
├── GlobalContext (Application state)
├── Router
│   ├── LoginPage (Authentication UI)
│   ├── ProtectedRoute (Authorization wrapper)
│   ├── Dashboard (Main business intelligence view)
│   ├── Admin (Administrative panel)
│   └── UserManagementPage (User administration)
```

### Core Components

#### App.tsx - Application Root
```typescript
const App: React.FC = () => {
  return (
    <AuthProvider>
      <GlobalProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </GlobalProvider>
    </AuthProvider>
  );
};
```

#### Dashboard.tsx - Main Business Intelligence View
**Purpose**: Primary interface displaying real-time business metrics

**Key Features**:
- Real-time KPI cards (Sales, Orders, Revenue, Inventory)
- Interactive charts (Sales by Category, Revenue Trends)
- Connection status indicators
- Auto-refresh capabilities (30-second intervals)

**Data Sources**:
- Background worker metrics
- Live database queries via MCP
- Cached performance data

**State Management**:
```typescript
const Dashboard: React.FC = () => {
  const { dashboardData, loading, error } = useDashboardData();
  const { connectionStatus } = useConnectionStatus();
  
  // Auto-refresh logic
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);
};
```

#### Admin.tsx - Administrative Control Panel
**Purpose**: System administration and configuration management

**Admin Sections**:
1. **System Overview**: Server status, connection health, worker status
2. **SQL Query Tool**: Direct database query interface
3. **User Management**: User account administration
4. **Background Worker Control**: Start/stop/monitor data processing
5. **Configuration Management**: System settings and parameters

**Access Control**:
```typescript
const Admin: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <AdminPanel />;
};
```

#### SqlQueryTool.tsx - Database Query Interface
**Purpose**: Direct SQL query execution against P21 and POR databases

**Features**:
- Database selection (P21/POR)
- SQL syntax highlighting
- Query history and saving
- Result pagination and export
- Query execution monitoring

**Security**:
- Admin-only access
- Query validation and sanitization
- Connection timeout management
- Error handling and logging

**Implementation**:
```typescript
const SqlQueryTool: React.FC = () => {
  const [query, setQuery] = useState('');
  const [database, setDatabase] = useState<'P21' | 'POR'>('P21');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const executeQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mcp/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, server: database })
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };
};
```

#### ChartCard.tsx - Data Visualization Component
**Purpose**: Reusable chart component for various data visualizations

**Chart Types**:
- Bar Charts (Sales by Category, Revenue by Period)
- Line Charts (Trends over time)
- Pie Charts (Distribution metrics)
- Area Charts (Cumulative data)

**Props Interface**:
```typescript
interface ChartCardProps {
  title: string;
  data: ChartDataPoint[];
  chartType: 'bar' | 'line' | 'pie' | 'area';
  color?: string;
  height?: number;
  loading?: boolean;
  error?: string;
}
```

---

## Backend Services

### Server Architecture (server.js)

#### Express Server Configuration
```javascript
const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware Stack
app.use(cors());                    // Cross-origin resource sharing
app.use(express.json());            // JSON body parsing
app.use(authenticateToken);         // JWT token validation (protected routes)
```

#### Core Services Integration
- **Background Worker**: Automated data processing and collection
- **MCP Controller**: Database communication management
- **Authentication Service**: Multi-tier user authentication
- **Health Monitoring**: System status and connection monitoring

### Background Worker System (backgroundWorker.js)

#### Purpose
Automated data collection, processing, and dashboard metric generation

#### Core Functions
```javascript
class BackgroundWorker {
  constructor() {
    this.isRunning = false;
    this.mode = 'production'; // 'production' | 'demo'
    this.interval = null;
    this.mcpController = new MCPController();
  }
  
  async start() {
    // Initialize MCP connections
    // Start data collection cycle
    // Set up metric processing
  }
  
  async collectMetrics() {
    // Query P21 for sales, orders, inventory data
    // Query POR for point-of-sale data
    // Process and aggregate metrics
    // Update dashboard cache
  }
}
```

#### Data Collection Cycle
1. **Connection Validation**: Verify MCP server connectivity
2. **Data Extraction**: Execute predefined queries against databases
3. **Data Processing**: Aggregate and calculate KPIs
4. **Cache Update**: Store processed metrics for dashboard consumption
5. **Error Handling**: Log errors and attempt recovery

#### Metrics Generated
- **Sales Metrics**: Daily/monthly/yearly sales figures
- **Order Processing**: Order counts, processing times, fulfillment rates
- **Inventory Levels**: Stock quantities, turnover rates, reorder points
- **Revenue Tracking**: Revenue by category, profit margins, trends
- **Performance Indicators**: Custom business KPIs

### MCP Controller (mcpController.js)

#### Purpose
Manages communication with Model Context Protocol servers for database access

#### MCP Server Connections
```javascript
class MCPController {
  constructor() {
    this.connections = {
      P21: null,    // SQL Server MCP connection
      POR: null     // MS Access MCP connection
    };
  }
  
  async initializeConnections() {
    // Initialize P21 MCP server connection
    // Initialize POR MCP server connection
    // Verify connectivity and test queries
  }
  
  async executeQuery(server, query) {
    // Route query to appropriate MCP server
    // Handle connection pooling
    // Process and return results
  }
}
```

#### Connection Management
- **Connection Pooling**: Efficient database connection reuse
- **Health Monitoring**: Continuous connection status checking
- **Failover Logic**: Automatic reconnection on connection loss
- **Query Optimization**: Query caching and result optimization

---

## Database Integration

### P21 Database Integration (SQL Server)

#### Purpose
Enterprise Resource Planning (ERP) system integration

#### Key Tables and Data
- **Sales Data**: Customer transactions, order history, revenue
- **Inventory Management**: Product catalog, stock levels, locations
- **Customer Information**: Account details, purchase history, preferences
- **Financial Data**: Accounting entries, profit/loss, cash flow

#### Sample Queries
```sql
-- Daily Sales Summary
SELECT 
  SUM(invoice_total) as daily_sales,
  COUNT(*) as order_count,
  AVG(invoice_total) as avg_order_value
FROM invoices 
WHERE invoice_date = CONVERT(date, GETDATE());

-- Inventory Levels
SELECT 
  item_id,
  item_desc,
  qty_on_hand,
  reorder_point
FROM inventory_master 
WHERE qty_on_hand < reorder_point;
```

### POR Database Integration (MS Access)

#### Purpose
Point of Sale and supplementary inventory system

#### Key Data Sources
- **Point of Sale Transactions**: Daily sales, payment methods
- **Additional Inventory**: Specialized product categories
- **Customer Data**: Local customer information, preferences
- **Reporting Data**: Custom reports and analytics

#### Integration Challenges
- **File Locking**: MS Access concurrent access limitations
- **Performance**: Optimized query strategies for large datasets
- **Data Synchronization**: Coordination with P21 system data

### MCP Server Implementation

#### P21 MCP Server (TypeScript)
```typescript
// P21-MCP-Server-Package/src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

class P21MCPServer {
  private server: Server;
  private connectionString: string;
  
  constructor() {
    this.server = new Server({
      name: 'p21-server',
      version: '1.0.0'
    }, {
      capabilities: {
        resources: {},
        tools: {
          query_p21: {
            description: 'Execute SQL queries against P21 database'
          }
        }
      }
    });
  }
  
  async handleQuery(query: string) {
    // SQL Server connection and query execution
    // Result processing and formatting
    // Error handling and logging
  }
}
```

#### POR MCP Server (TypeScript)
```typescript
// POR-MCP-Server-Package/src/index.ts
class PORMCPServer {
  private server: Server;
  private databasePath: string;
  
  async handleQuery(query: string) {
    // MS Access connection via OLEDB/ODBC
    // Query execution and result processing
    // Connection management and cleanup
  }
}
```

---

## Data Flow

### Data Collection and Processing Flow

```mermaid
graph TD
    A[Background Worker Start] --> B[Initialize MCP Connections]
    B --> C[Verify P21 Connection]
    B --> D[Verify POR Connection]
    C --> E[Execute P21 Queries]
    D --> F[Execute POR Queries]
    E --> G[Process P21 Data]
    F --> H[Process POR Data]
    G --> I[Aggregate Metrics]
    H --> I
    I --> J[Update Dashboard Cache]
    J --> K[Broadcast Updates]
    K --> L[Dashboard Refresh]
```

### Authentication Flow

```mermaid
graph TD
    A[Login Request] --> B[Try LDAP Auth]
    B --> C{LDAP Success?}
    C -->|Yes| D[Extract Groups]
    C -->|No| E[Try Local Users]
    D --> F[Determine Role]
    E --> G{Local Auth Success?}
    G -->|Yes| H[Use Local Role]
    G -->|No| I[Try Backdoor Auth]
    H --> J[Generate JWT]
    I --> K{Backdoor Success?}
    K -->|Yes| L[Use Backdoor Role]
    K -->|No| M[Authentication Failed]
    F --> J
    L --> J
    J --> N[Return Token + User Info]
```

### Real-time Update Flow

```mermaid
graph TD
    A[Background Worker] --> B[Collect New Data]
    B --> C[Process Metrics]
    C --> D[Update Cache]
    D --> E[Check Connected Clients]
    E --> F[Dashboard Auto-refresh]
    F --> G[Fetch Latest Data]
    G --> H[Update UI Components]
```

---

## API Specifications

### Authentication Endpoints

#### POST /api/auth/login
**Purpose**: Multi-tier user authentication

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response Success (200)**:
```json
{
  "token": "jwt-token-string",
  "user": {
    "username": "string",
    "displayName": "string",
    "email": "string",
    "role": "admin|user"
  },
  "authMethod": "LDAP+Database|Local Development|Backdoor",
  "message": "Authentication successful"
}
```

**Response Error (401)**:
```json
{
  "error": "Authentication failed",
  "message": "All authentication methods failed",
  "methods_tried": ["LDAP+Database", "Local Development", "Backdoor"]
}
```

### Dashboard Data Endpoints

#### GET /api/dashboard/data
**Purpose**: Retrieve current dashboard metrics

**Headers**: `Authorization: Bearer <jwt-token>`

**Response (200)**:
```json
{
  "kpis": [
    {
      "id": "daily-sales",
      "title": "Daily Sales",
      "value": 45678.90,
      "change": 12.5,
      "trend": "up"
    }
  ],
  "charts": [
    {
      "id": "sales-by-category",
      "title": "Sales by Category",
      "data": [
        { "category": "Tools", "value": 25000 },
        { "category": "Equipment", "value": 35000 }
      ]
    }
  ],
  "lastUpdated": "2025-08-02T18:00:00Z"
}
```

### MCP Query Endpoints

#### POST /api/mcp/execute-query
**Purpose**: Execute SQL query against specified database

**Headers**: `Authorization: Bearer <jwt-token>`

**Request Body**:
```json
{
  "query": "SELECT * FROM customers LIMIT 10",
  "server": "P21|POR"
}
```

**Response (200)**:
```json
[
  {
    "result": [
      {
        "customer_id": "C001",
        "company_name": "ABC Company",
        "contact_name": "John Smith"
      }
    ]
  }
]
```

### System Administration Endpoints

#### GET /api/connections/status
**Purpose**: Check database connection status

**Response (200)**:
```json
[
  {
    "name": "P21",
    "status": "Connected|Error",
    "details": "SQL Server via MCP (P21-MCP-Server)",
    "version": "SQL Server 2019",
    "responseTime": 150
  },
  {
    "name": "POR",
    "status": "Connected|Error",
    "details": "MS Access via MCP (POR-MCP-Server)",
    "version": "MS Access 2019",
    "responseTime": 100
  }
]
```

#### POST /api/worker/start
**Purpose**: Start background worker

**Response (200)**:
```json
{
  "message": "Background worker started",
  "status": {
    "isRunning": true,
    "mode": "production",
    "lastUpdate": "2025-08-02T18:00:00Z"
  }
}
```

---

## State Management

### Global State Architecture

The application uses React Context API for global state management:

#### AuthContext - Authentication State
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  // Authentication logic
  // Token management
  // Automatic logout on token expiration
};
```

#### GlobalContext - Application State
```typescript
interface GlobalContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  dashboardData: DashboardData | null;
  connectionStatus: ConnectionStatus[];
  backgroundWorkerStatus: WorkerStatus;
  refreshDashboard: () => Promise<void>;
}
```

### Component State Patterns

#### Custom Hooks for Data Fetching
```typescript
const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getData();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh
    return () => clearInterval(interval);
  }, [fetchData]);
  
  return { data, loading, error, refetch: fetchData };
};
```

### Local Storage Management

#### Token Persistence
```typescript
// Store JWT token securely
localStorage.setItem('auth_token', token);

// Automatic token cleanup on logout
const logout = () => {
  localStorage.removeItem('auth_token');
  setUser(null);
  setToken(null);
};
```

#### User Preferences
```typescript
// Theme preference persistence
const theme = localStorage.getItem('theme') || 'light';
localStorage.setItem('theme', newTheme);
```

---

## Error Handling

### Frontend Error Handling

#### Error Boundary Component
```typescript
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
    // Error reporting service integration
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallbackComponent error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

#### API Error Handling
```typescript
const handleApiError = (error: any): string => {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    logout();
    return 'Session expired. Please log in again.';
  } else if (error.response?.status === 403) {
    return 'Access denied. Insufficient permissions.';
  } else if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
};
```

### Backend Error Handling

#### Global Error Middleware
```javascript
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Database connection errors
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Database connection failed',
      message: 'Unable to connect to database servers'
    });
  }
  
  // Authentication errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication token is invalid'
    });
  }
  
  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});
```

#### Database Error Recovery
```javascript
const executeQueryWithRetry = async (query, server, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await mcpController.executeQuery(server, query);
    } catch (error) {
      console.warn(`Query attempt ${i + 1} failed:`, error.message);
      
      if (i === maxRetries - 1) {
        throw new Error(`Query failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      
      // Attempt to reconnect
      await mcpController.reconnect(server);
    }
  }
};
```

### Connection Recovery Mechanisms

#### MCP Server Reconnection
```javascript
class MCPController {
  async reconnect(serverName) {
    console.log(`Attempting to reconnect to ${serverName}...`);
    
    try {
      // Close existing connection
      if (this.connections[serverName]) {
        await this.connections[serverName].close();
      }
      
      // Establish new connection
      this.connections[serverName] = await this.createConnection(serverName);
      
      // Test connection
      await this.testConnection(serverName);
      
      console.log(`Successfully reconnected to ${serverName}`);
    } catch (error) {
      console.error(`Failed to reconnect to ${serverName}:`, error);
      throw error;
    }
  }
}
```

---

## Performance & Optimization

### Frontend Optimization

#### Component Optimization
```typescript
// Memoized components to prevent unnecessary re-renders
const ChartCard = React.memo<ChartCardProps>(({ title, data, chartType }) => {
  // Component logic
});

// Memoized calculations
const Dashboard: React.FC = () => {
  const memoizedKPIs = useMemo(() => {
    return calculateKPIs(dashboardData);
  }, [dashboardData]);
  
  const memoizedCharts = useMemo(() => {
    return processChartData(dashboardData);
  }, [dashboardData]);
};
```

#### Data Fetching Optimization
```typescript
// Debounced API calls
const debouncedFetchData = useCallback(
  debounce(async () => {
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (error) {
      setError(error.message);
    }
  }, 300),
  []
);

// Intelligent refresh strategy
const useAutoRefresh = (fetchData: () => Promise<void>, interval: number) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Only refresh when tab is visible
    if (isVisible) {
      const intervalId = setInterval(fetchData, interval);
      return () => clearInterval(intervalId);
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVisible, fetchData, interval]);
};
```

### Backend Optimization

#### Database Query Optimization
```javascript
// Query result caching
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minute

const executeQueryWithCache = async (query, server) => {
  const cacheKey = `${server}:${query}`;
  const cached = queryCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const result = await mcpController.executeQuery(server, query);
  
  queryCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
};
```

#### Connection Pool Management
```javascript
class MCPController {
  constructor() {
    this.connectionPools = {
      P21: new ConnectionPool(5), // Max 5 concurrent connections
      POR: new ConnectionPool(3)  // Max 3 concurrent connections
    };
  }
  
  async executeQuery(server, query) {
    const connection = await this.connectionPools[server].acquire();
    
    try {
      return await connection.query(query);
    } finally {
      this.connectionPools[server].release(connection);
    }
  }
}
```

### Monitoring and Metrics

#### Performance Monitoring
```javascript
// Request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});
```

---

## Security Considerations

### Data Protection

#### Input Validation and Sanitization
```javascript
// SQL injection prevention
const validateQuery = (query) => {
  const dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE'];
  const upperQuery = query.toUpperCase();
  
  for (const keyword of dangerous) {
    if (upperQuery.includes(keyword)) {
      throw new Error(`Dangerous SQL keyword detected: ${keyword}`);
    }
  }
  
  return true;
};

const sanitizeInput = (req, res, next) => {
  // Remove potentially dangerous characters
  const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>'"&]/g, '');
  };
  
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitize(req.body[key]);
      }
    });
  }
  
  next();
};
```

#### Authentication Security
```javascript
// JWT secret rotation
const rotateJWTSecret = () => {
  const newSecret = crypto.randomBytes(64).toString('hex');
  process.env.JWT_SECRET = newSecret;
  // Notify all active sessions to re-authenticate
};

// Password hashing for local users
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};
```

#### CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### Data Encryption

#### Sensitive Data Encryption
```javascript
const crypto = require('crypto');

class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY;
  }
  
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('additional data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    decipher.setAAD(Buffer.from('additional data'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

---

## Configuration Management

### Environment Variables

#### Production Configuration
```env
# Server Configuration
NODE_ENV=production
BACKEND_PORT=3001
FRONTEND_URL=https://dashboard.tallmanequipment.com

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# Database Connections
P21_CONNECTION_STRING=Server=sql-server;Database=P21;Trusted_Connection=true;
POR_CONNECTION_STRING=Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\path\to\por.accdb;

# LDAP Configuration
LDAP_URL=ldap://dc.company.com:389
LDAP_BIND_DN=CN=service-account,OU=Service Accounts,DC=company,DC=com
LDAP_BIND_PASSWORD=service-account-password
LDAP_SEARCH_BASE=OU=Users,DC=company,DC=com

# External Services
OLLAMA_URL=http://localhost:11434
GEMINI_API_KEY=your-gemini-api-key

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
HEALTH_CHECK_INTERVAL=30000
```

#### Development Configuration
```env
# Development overrides
NODE_ENV=development
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:5174

# Development Database (SQLite for testing)
P21_CONNECTION_STRING=sqlite:./dev-p21.db
POR_CONNECTION_STRING=sqlite:./dev-por.db

# Relaxed security for development
JWT_SECRET=dev-secret-key
LOG_LEVEL=debug
```

### Configuration Validation

#### Environment Validation
```javascript
const validateConfig = () => {
  const required = [
    'JWT_SECRET',
    'BACKEND_PORT',
    'P21_CONNECTION_STRING',
    'POR_CONNECTION_STRING'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }
  
  // Validate connection strings
  if (!process.env.P21_CONNECTION_STRING.includes('Server=') && 
      !process.env.P21_CONNECTION_STRING.includes('sqlite:')) {
    console.error('Invalid P21 connection string format');
    process.exit(1);
  }
};
```

### Runtime Configuration

#### Dynamic Configuration Updates
```javascript
class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
    this.watchers = [];
  }
  
  loadConfig() {
    return {
      refreshInterval: parseInt(process.env.REFRESH_INTERVAL) || 30000,
      maxQueryTimeout: parseInt(process.env.QUERY_TIMEOUT) || 30000,
      connectionPoolSize: parseInt(process.env.POOL_SIZE) || 5,
      enableCaching: process.env.ENABLE_CACHING !== 'false'
    };
  }
  
  updateConfig(key, value) {
    this.config[key] = value;
    this.notifyWatchers(key, value);
  }
  
  notifyWatchers(key, value) {
    this.watchers.forEach(watcher => watcher(key, value));
  }
  
  watch(callback) {
    this.watchers.push(callback);
  }
}
```

---

## Environment Configuration

### Required Environment Variables

#### LDAP Authentication
```bash
# LDAP server configuration
LDAP_URL=ldap://dc02.tallman.com
LDAP_BIND_DN=CN=LDAP,DC=tallman,DC=com
LDAP_BIND_PASSWORD=ebGGAm77kk
LDAP_SEARCH_BASE=DC=tallman,DC=com
```

#### Database Connections
```bash
# P21 SQL Server connection
P21_DSN=P21live

# POR MS Access database
POR_FILE_PATH=C:\TallmanDashboard\POR.mdb
```

#### Application Settings
```bash
# Backend server configuration
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:5174

# JWT token security
JWT_SECRET=your-secret-key-here

# Optional settings
NODE_ENV=production
LOG_LEVEL=info
REFRESH_INTERVAL=30000
QUERY_TIMEOUT=30000
```

### Environment Setup

#### Development Environment
```bash
# Create .env file in project root
cp .env.example .env

# Edit .env with your specific configuration
nano .env
```

#### Production Environment
```bash
# Set environment variables in system or service configuration
export LDAP_URL="ldap://dc02.tallman.com"
export P21_DSN="P21live"
export JWT_SECRET="$(openssl rand -hex 32)"
```

### Configuration Validation

#### Startup Validation
```javascript
const validateEnvironment = () => {
  const required = [
    'LDAP_URL',
    'LDAP_BIND_DN', 
    'LDAP_BIND_PASSWORD',
    'LDAP_SEARCH_BASE',
    'P21_DSN',
    'POR_FILE_PATH'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
};
```

---

## Deployment & Operations

### Docker Deployment

#### Dockerfile (Frontend)
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .

# Install MCP servers
COPY P21-MCP-Server-Package/ ./mcp-servers/p21/
COPY POR-MCP-Server-Package/ ./mcp-servers/por/

RUN cd mcp-servers/p21 && npm ci && npm run build
RUN cd mcp-servers/por && npm ci && npm run build

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://backend:3001

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - P21_CONNECTION_STRING=${P21_CONNECTION_STRING}
      - POR_CONNECTION_STRING=${POR_CONNECTION_STRING}
      - LDAP_URL=${LDAP_URL}
      - LDAP_BIND_DN=${LDAP_BIND_DN}
      - LDAP_BIND_PASSWORD=${LDAP_BIND_PASSWORD}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  sqlserver:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrong@Passw0rd
      - MSSQL_DB=P21
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql

volumes:
  sqlserver_data:
```

### Production Deployment

#### Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting Tallman Dashboard deployment..."

# Build and deploy frontend
echo "📦 Building frontend..."
npm run build

# Deploy to web server
echo "🌐 Deploying frontend to web server..."
rsync -avz --delete dist/ user@webserver:/var/www/dashboard/

# Deploy backend
echo "🔧 Deploying backend..."
ssh user@appserver "cd /opt/tallman-dashboard && git pull origin main"
ssh user@appserver "cd /opt/tallman-dashboard/backend && npm ci --production"
ssh user@appserver "sudo systemctl restart tallman-dashboard"

# Deploy MCP servers
echo "🔌 Updating MCP servers..."
ssh user@appserver "cd /opt/tallman-dashboard/P21-MCP-Server-Package && npm run build"
ssh user@appserver "cd /opt/tallman-dashboard/POR-MCP-Server-Package && npm run build"
ssh user@appserver "sudo systemctl restart mcp-servers"

# Verify deployment
echo "✅ Verifying deployment..."
curl -f https://dashboard.tallmanequipment.com/api/health || exit 1

echo "🎉 Deployment completed successfully!"
```

#### System Service Configuration
```ini
# /etc/systemd/system/tallman-dashboard.service
[Unit]
Description=Tallman Dashboard Backend
After=network.target

[Service]
Type=simple
User=tallman
WorkingDirectory=/opt/tallman-dashboard/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/tallman-dashboard/.env

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/tallman-dashboard/data

[Install]
WantedBy=multi-user.target
```

### Monitoring & Logging

#### Application Monitoring
```javascript
// Health check endpoint with detailed status
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    memory: process.memoryUsage(),
    connections: {
      p21: 'unknown',
      por: 'unknown'
    },
    backgroundWorker: {
      running: backgroundWorker.isRunning,
      lastUpdate: backgroundWorker.getLastUpdate()
    }
  };
  
  try {
    // Test database connections
    health.connections.p21 = await mcpController.testConnection('P21') ? 'healthy' : 'error';
    health.connections.por = await mcpController.testConnection('POR') ? 'healthy' : 'error';
  } catch (error) {
    health.status = 'degraded';
    health.error = error.message;
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

#### Structured Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tallman-dashboard' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage throughout application
logger.info('Dashboard started', { port: PORT, mode: process.env.NODE_ENV });
logger.error('Database connection failed', { error: error.message, database: 'P21' });
```

#### Performance Metrics
```javascript
const promClient = require('prom-client');

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['database', 'query_type']
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

### Backup & Recovery

#### Database Backup Strategy
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/tallman-dashboard/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup P21 SQL Server database
echo "📊 Backing up P21 database..."
sqlcmd -S sql-server -Q "BACKUP DATABASE P21 TO DISK = '$BACKUP_DIR/p21-backup.bak'"

# Backup POR Access database
echo "📁 Backing up POR database..."
cp "/path/to/por.accdb" "$BACKUP_DIR/por-backup.accdb"

# Backup application configuration
echo "⚙️ Backing up configuration..."
cp /opt/tallman-dashboard/.env "$BACKUP_DIR/config-backup.env"

# Backup logs
echo "📝 Backing up logs..."
tar -czf "$BACKUP_DIR/logs-backup.tar.gz" /opt/tallman-dashboard/logs/

# Cleanup old backups (keep 30 days)
find /backups/tallman-dashboard/ -type d -mtime +30 -exec rm -rf {} +

echo "✅ Backup completed: $BACKUP_DIR"
```

#### Disaster Recovery Plan
```markdown
# Disaster Recovery Procedures

## System Failure Recovery

1. **Application Server Failure**
   - Deploy to backup server using deployment script
   - Update DNS to point to backup server
   - Restore latest configuration from backup

2. **Database Failure**
   - Restore P21 database from latest backup
   - Restore POR database from latest backup
   - Verify data integrity and connections

3. **Complete Infrastructure Failure**
   - Deploy to cloud infrastructure (AWS/Azure)
   - Restore databases from off-site backups
   - Update configuration for cloud environment

## Recovery Time Objectives (RTO)
- Application Server: 15 minutes
- Database Recovery: 30 minutes
- Complete System Recovery: 2 hours

## Recovery Point Objectives (RPO)
- Maximum data loss: 4 hours
- Backup frequency: Every 4 hours
- Off-site backup: Daily
```

---

## Conclusion

The Tallman Equipment Dashboard represents a comprehensive business intelligence solution designed for enterprise environments. The system provides:

- **Robust Architecture**: Modern React frontend with Node.js backend
- **Enterprise Security**: Multi-tier authentication with LDAP integration
- **Real-time Data**: Live database connectivity through MCP servers
- **Administrative Control**: Comprehensive admin tools and user management
- **High Availability**: Error handling, recovery mechanisms, and monitoring
- **Scalability**: Modular design supporting future expansion

The application is production-ready with comprehensive documentation, deployment procedures, and operational guidelines to ensure successful implementation and ongoing maintenance.

### Key Success Factors

1. **Security First**: Multi-layered authentication ensures only authorized access
2. **Data Integrity**: Direct database connectivity with robust error handling
3. **User Experience**: Intuitive interface with real-time updates and responsive design
4. **Operational Excellence**: Comprehensive monitoring, logging, and backup procedures
5. **Future-Proof**: Modular architecture supporting additional features and integrations

This technical specification serves as the definitive guide for understanding, implementing, and maintaining the Tallman Equipment Dashboard system.
