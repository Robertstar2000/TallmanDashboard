# 12_26_Dashboard_sb1-d3u4pppd

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/Robertstar2000/12_26_Dashboard_sb1-d3u4pppd)

## Data Flow Architecture

### 1. Data Sources & Storage
- Primary Storage: IndexedDB (dashboardDB)
- Store Name: variables
- Persists all dashboard variables
- Initialized with data from initial-data.ts

### 2. Admin Page Flow
Path: AdminSpreadsheet.tsx -> admin.ts -> indexedDB.ts

Components:
- AdminSpreadsheet.tsx: Main grid container
- DataRow.tsx: Editable row component

Flow:
1. Load: indexedDB.ts -> admin.ts -> AdminSpreadsheet.tsx
2. Edit: DataRow.tsx -> admin.ts -> indexedDB.ts
3. All fields editable (name, value, chartGroup, etc.)
4. Changes persist immediately

### 3. Dashboard Flow
- Real-time updates using WebSocket
- Cached data in IndexedDB
- Fallback to REST API when offline
- Chart updates throttled to 1s intervals

### 4. Components
- TimeDisplayApp: Real-time clock with configurable display modes
- ChartComponents: D3-based visualizations
- AdminGrid: Data management interface
- StatusIndicators: System health monitoring

## Server Connection Guide

### Database Configuration
The application uses SQL Server for data storage and management. Here's how to configure your database connection:

#### Connection String Setup
1. Locate the `web.config` file in the root directory
2. Update the connection string in the following format:
```xml
<connectionStrings>
    <add name="DashboardDB" 
         connectionString="Server=YOUR_SERVER;Database=YOUR_DB;User Id=YOUR_USER;Password=YOUR_PASSWORD;TrustServerCertificate=True;"
         providerName="System.Data.SqlClient" />
</connectionStrings>
```

### Key Variables and Their Purpose
The dashboard uses several critical SQL variables for data management:

#### Core Variables Table
```sql
CREATE TABLE DashboardVariables (
    VariableID INT PRIMARY KEY,
    VariableName NVARCHAR(100),
    Value DECIMAL(18,2),
    ChartGroup NVARCHAR(50),
    UpdatedAt DATETIME,
    IsActive BIT
)
```

### Server Architecture

#### Connection Flow
1. Application Startup:
   - Web application initializes in `Global.asax.cs`
   - Connection pool established via Entity Framework
   - Initial data loaded into IndexedDB for offline capability

2. Real-time Updates:
   - WebSocket connection maintained through SignalR
   - Fallback to REST API when WebSocket unavailable
   - Automatic reconnection handling

#### Data Synchronization
- Server pushes updates every 1 second
- Client maintains local cache in IndexedDB
- Two-way sync ensures data consistency

### Troubleshooting Connection Issues

1. Check Server Availability:
   - Verify SQL Server is running
   - Test network connectivity
   - Confirm firewall settings

2. Common Issues:
   - Connection timeout: Check network latency
   - Authentication errors: Verify credentials
   - TLS/SSL issues: Ensure certificates are valid

### Security Considerations

1. Connection Security:
   - Use Windows Authentication when possible
   - Implement connection encryption
   - Regular credential rotation

2. Data Protection:
   - Sensitive data encryption at rest
   - TLS 1.2+ for data in transit
   - Audit logging enabled

### File Structure
```
/TallmanDashboard
├── web.config           # Main configuration file
├── App_Start/
│   └── Startup.cs      # Application initialization
├── Services/
│   ├── DatabaseService.cs    # Database connection handling
│   └── SignalRHub.cs         # Real-time communication
└── Models/
    └── DashboardVariable.cs  # Data models
```

### Environment Setup

1. Development Environment:
   - Visual Studio 2022 or later
   - SQL Server Management Studio
   - Node.js for front-end tooling

2. Production Environment:
   - IIS 10 or later
   - SQL Server 2019+
   - .NET Framework 4.8