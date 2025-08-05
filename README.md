# Tallman Equipment Business Intelligence Dashboard

A comprehensive, enterprise-grade business intelligence dashboard providing real-time key performance indicators (KPIs) and business metrics for Tallman Equipment, a tool and equipment distribution company. The application features a modern React frontend, robust Node.js backend, multi-tier authentication system, and direct database connectivity through Model Context Protocol (MCP) servers.

## 🚀 Features

### Core Dashboard Functionality
- **Real-time KPI Tracking**: Monitor key business metrics including sales, orders, revenue, inventory, and performance indicators
- **Interactive Data Visualization**: Dynamic charts and graphs using Recharts library
- **Multi-Database Integration**: Connects to both P21 (SQL Server) and POR (MS Access) databases via MCP servers
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS

### Authentication & Security
- **Enhanced Multi-Tier Authentication System**:
  1. **LDAP + Database Verification** - Primary authentication requires both LDAP success AND approved user database verification
  2. **Local Development Mode** - Fallback authentication for development/testing (bypasses LDAP)
  3. **Backdoor Access** - Emergency access for system administrators
- **Case-Insensitive Username Support**: Accepts both "BobM" and "BobM@tallman.com" formats
- **Role-Based Access Control**: Admin and User roles with granular permissions
- **JWT Token Security**: Secure session management with 8-hour token expiration
- **Approved User Database**: Only pre-approved users can access the system after LDAP authentication

### Administration Tools
- **SQL Query Tool**: Direct database query interface for administrators
- **User Management**: Admin interface to manage user accounts and permissions
- **Connection Status Monitoring**: Real-time database connection health monitoring
- **Background Worker Management**: Control and monitor data processing operations

### Data Processing
- **Background Worker System**: Automated data collection and processing
- **MCP Integration**: Model Context Protocol servers for secure database connectivity
- **Demo/Production Modes**: Switch between demo data and live database connections
- **Real-time Updates**: Live data synchronization and dashboard updates

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── Dashboard.tsx    # Main dashboard view
│   ├── Admin.tsx        # Admin panel
│   ├── ChartCard.tsx    # Chart visualization components
│   └── SqlQueryTool.tsx # SQL query interface
├── contexts/            # React Context providers
│   ├── AuthContext.tsx  # Authentication state
│   └── GlobalContext.tsx # Global application state
├── services/            # API and external services
│   └── DatabaseService.ts # SQL.js database service (local storage)
├── constants.ts         # Application constants and key metrics
├── hooks/               # Custom React hooks
└── types.ts            # TypeScript type definitions
```

### Backend (Node.js + Express)
```
backend/
├── server.js           # Main Express server
├── backgroundWorker.js # Data processing worker
├── mcpController.js    # MCP server communication
└── package.json        # Node.js dependencies
```

### Database Layer (MCP Servers)
```
P21-MCP-Server-Package/  # SQL Server MCP integration
POR-MCP-Server-Package/  # MS Access MCP integration
database-schemas/        # Database schema definitions
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **SQL Server** (for P21 database)
- **MS Access** (for POR database)
- **Active Directory/LDAP** (optional, for corporate authentication)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd TallmanDashboard
   ```

2. **Install Dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Configure Environment Variables**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   # - Database connection strings
   # - LDAP settings
   # - JWT secret
   # - API keys
   ```

4. **Set up MCP Servers**
   ```bash
   # Install P21 MCP Server
   cd P21-MCP-Server-Package
   npm install
   npm run build
   
   # Install POR MCP Server
   cd ../POR-MCP-Server-Package
   npm install
   npm run build
   cd ..
   ```

5. **Initialize Databases**
   ```bash
   # Run database schema and population scripts
   # See database-schemas/ directory for SQL scripts
   ```

6. **Start the Application**
   ```bash
   # Use the convenient start script
   ./start-dashboard.bat
   
   # Or start manually:
   # Terminal 1 - Backend
   cd backend
   node server.js
   
   # Terminal 2 - Frontend
   npm run dev
   ```

## 🔐 Authentication System

### Enhanced Multi-Tier Authentication Flow
1. **LDAP + Database Verification** (Primary Production Mode)
   - **Step 1**: Validates credentials against Active Directory (LDAP)
   - **Step 2**: Checks if user exists in approved user database
   - **Both steps must pass** for successful authentication
   - Supports case-insensitive usernames (BobM or BobM@tallman.com)
   - Role assignment based on approved user database

2. **Local Development Mode** (Fallback for Testing)
   - Used when LDAP authentication fails
   - Predefined local accounts for development/testing
   - Manual role assignment
   - Bypasses LDAP requirement

3. **Backdoor Access** (Emergency)
   - Emergency access accounts
   - System administrator access
   - Bypass for system recovery

### Default Accounts
- **Admin Access**: `BobM` / `Rm2214ri#`
- **Backdoor Access**: `tallman` / `dashboard2025`
- **Emergency Access**: `emergency` / `TallmanAccess2025!`

## 📊 Dashboard Features

### KPI Cards
- **Sales Metrics**: Daily/Monthly/Yearly sales figures
- **Order Processing**: Order counts and processing times
- **Revenue Tracking**: Revenue by category and time period
- **Inventory Management**: Stock levels and turnover rates
- **Performance Indicators**: Key business performance metrics

### Charts & Visualizations
- **Sales by Category**: Bar charts showing sales distribution
- **Revenue Trends**: Line charts for revenue over time
- **Order Analysis**: Order processing and fulfillment metrics
- **Inventory Charts**: Stock level visualizations
- **Performance Dashboards**: KPI trend analysis

### Real-time Features
- **Live Data Updates**: Automatic data refresh every 30 seconds
- **Connection Status**: Real-time database connectivity monitoring
- **Background Processing**: Automated data collection and processing
- **Alert System**: Notifications for critical metrics

## 🛠️ Admin Tools

### SQL Query Tool
- **Direct Database Access**: Query P21 and POR databases directly
- **Query History**: Save and recall previous queries
- **Result Export**: Export query results to CSV/JSON
- **Syntax Highlighting**: SQL syntax highlighting and validation

### User Management
- **User Account Management**: Add, edit, delete user accounts
- **Role Assignment**: Assign Admin or User roles
- **Permission Control**: Granular permission management
- **Activity Monitoring**: User login and activity tracking

### System Administration
- **Background Worker Control**: Start/stop/monitor data processing
- **Connection Management**: Monitor and troubleshoot database connections
- **System Health**: Overall system status and performance metrics
- **Configuration Management**: System settings and configuration

## 🔄 Data Flow

1. **Data Collection**: Background worker queries P21 and POR databases via MCP servers
2. **Data Processing**: Raw data is processed and aggregated into KPIs and metrics
3. **Data Storage**: Processed data is cached for quick dashboard updates
4. **Real-time Updates**: Dashboard automatically refreshes with latest data
5. **User Interaction**: Users can query databases directly through admin tools

## 🚦 Deployment

### Development Environment
```bash
# Start development servers
npm run dev          # Frontend (Vite dev server)
cd backend && node server.js  # Backend (Express server)
```

### Production Environment
```bash
# Build frontend
npm run build

# Start production servers
# Configure reverse proxy (nginx/Apache)
# Set up SSL certificates
# Configure monitoring and logging
```

## 📈 Performance & Monitoring

- **Background Worker**: Automated data processing with configurable intervals
- **Connection Pooling**: Efficient database connection management
- **Caching**: Smart caching for improved response times
- **Error Handling**: Comprehensive error logging and recovery
- **Health Checks**: Built-in health monitoring endpoints

## 🔧 Configuration

### Environment Variables
```env
# Backend Configuration
BACKEND_PORT=3001
JWT_SECRET=your-jwt-secret

# Database Configuration
P21_CONNECTION_STRING=your-p21-connection
POR_CONNECTION_STRING=your-por-connection

# LDAP Configuration
LDAP_URL=ldap://your-domain-controller
LDAP_BIND_DN=your-service-account
LDAP_BIND_PASSWORD=your-service-password
LDAP_SEARCH_BASE=DC=domain,DC=com

# AI Services (Optional)
OLLAMA_URL=http://localhost:11434
GEMINI_API_KEY=your-gemini-key
```

## 📝 Documentation

- **[Spec.md](./Spec.md)**: Detailed technical specifications and app logic
- **[DATABASE_DEPLOYMENT_GUIDE.md](./DATABASE_DEPLOYMENT_GUIDE.md)**: Database setup and deployment
- **[IMPLEMENTATION_STATUS_REPORT.md](./IMPLEMENTATION_STATUS_REPORT.md)**: Current implementation status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for Tallman Equipment. All rights reserved.

## 📞 Support

For technical support or questions, contact the development team or system administrators.
