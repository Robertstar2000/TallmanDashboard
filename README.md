# TallmanDashboard

## Project Setup
- Project Location: `C:\Users\BobM\CascadeProjects\TallmanDashboard_new`
- Development Server: `localhost:3200`
- Production Server (IIS): `localhost:5000`

## Data Flow Architecture

### 1. Data Sources & Storage
- Primary Storage: IndexedDB (dashboardDB)
- Store Name: variables
- Persists all dashboard variables
- Initialized with data from initial-data.ts

### 2. Admin Page Flow

#### Overview
The Admin Page provides a user interface for managing dashboard variables. The data flow differs between test and production modes.

#### Components
- AdminSpreadsheet.tsx: Main grid container
- DataRow.tsx: Editable row component
- AdminControls.tsx: Contains buttons for adding, deleting, and resetting data

#### Data Flow (Test Mode)
- Path: AdminSpreadsheet.tsx -> admin.ts -> indexedDB.ts
1. Load: indexedDB.ts -> admin.ts -> AdminSpreadsheet.tsx
2. Edit: DataRow.tsx -> admin.ts -> indexedDB.ts
3. All fields editable (name, value, chartGroup, etc.)
4. Changes persist immediately to IndexedDB

#### Data Flow (Production Mode)
- Path: AdminSpreadsheet.tsx -> admin.ts -> dashboard
1. Load on program start only: Admin spreadsheet initializes with zero values for every row -> admin.ts -> AdminSpreadsheet.tsx
2. Allow Edit: DataRow.tsx allows editing of SQL expressions and table names -> admin.ts -> SQL Server
3. When Run is selected: System sequences through rows step by step, executing each SQL expression using the selected server and updating the row's value
4. On row execution: Data is fetched from the selected connected SQL Server (POR or P21) -> admin.ts -> AdminSpreadsheet.tsx
5. Changes persist globally until updated by the next cycle's SQL execution. Updates are directly reflected in dashboard graphs and metric displays

#### Admin Controls
- Add: Adds a new row to the data table (IndexedDB in Test, SQL Server in Prod)
- Delete: Deletes the selected row from the data table (IndexedDB in Test, SQL Server in Prod)
- Reset: Resets the data table to the initial data (initial-data.ts in Test, SQL Server default values in Prod)

### 3. Dashboard Flow

#### Overview
The Dashboard displays real-time data and charts. The data source and update mechanism differ between test and production modes.

#### Data Flow (Test Mode)
- Data is loaded from IndexedDB
- Chart updates are throttled to 1s intervals

#### Data Flow (Production Mode)
- Real-time updates using WebSocket
- Data is loaded from SQL Server
- Fallback to REST API when WebSocket unavailable
- Chart updates are throttled to 1s intervals

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
/TallmanDashboard_new
├── .env.example
├── .eslintrc.json
├── .gitignore
├── jsconfig.json
├── netlify.toml
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── tailwind.config.ts
├── tsconfig.json
├── web.config
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── admin/
│       └── page.tsx
├── components/
│   ├── AdminButton.tsx
│   ├── DatabaseConnectionDialog.tsx
│   ├── DataDetailsDialog.tsx
│   ├── EditableChart.tsx
│   ├── EditableMetricCard.tsx
│   ├── EditableSqlCell.tsx
│   ├── icons.tsx
│   ├── Metrics.tsx
│   ├── ServerConnectionDialog.tsx
│   ├── TimeDisplayApp.tsx
│   ├── admin/
│   │   ├── AdminControls.tsx
│   │   ├── AdminSpreadsheet.tsx
│   │   ├── DataRow.tsx
│   │   ├── GroupRow.tsx
│   │   ├── HelpDialog.tsx
│   │   ├── MultilineCell.tsx
│   │   ├── ResetDialog.tsx
│   │   └── ServerConnectionDialog.tsx
│   ├── charts/
│   │   ├── AccountsPayableChart.tsx
│   │   ├── ARAgingChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── CustomerChart.tsx
│   │   ├── CustomersChart.tsx
│   │   ├── DailyOrdersChart.tsx
│   │   ├── DailyShipmentsChart.tsx
│   │   ├── EditableChart.tsx
│   │   ├── EditableChartDialog.tsx
│   │   ├── GrowthMetricsChart.tsx
│   │   ├── HistoricalDataChart.tsx
│   │   ├── HistoricalTrendsChart.tsx
│   │   ├── InventoryChart.tsx
│   │   ├── InventoryValueChart.tsx
│   │   ├── LineChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── PORChart.tsx
│   │   ├── ProductsDialog.tsx
│   │   ├── ProductsTable.tsx
│   │   ├── SiteDistributionChart.tsx
│   │   ├── TopProductsCard.tsx
│   │   └── WebMetricsChart.tsx
│   ├── dashboard/
│   │   ├── ChartDialog.tsx
│   │   ├── ChartsSection.tsx
│   │   ├── DailyShipmentsPopup.tsx
│   │   ├── Dashboard.tsx
│   │   ├── MetricsSection.tsx
│   │   ├── SideSection.tsx
│   │   ├── SpreadsheetPopup.tsx
│   │   └── SpreadsheetSection.tsx
│   ├── dialogs/
│   │   └── ServerConnectionDialog.tsx
│   ├── layouts/
│   │   └── DashboardLayout.tsx
│   ├── metrics/
│   │   ├── EditableMetric.tsx
│   │   ├── MetricCard.tsx
│   │   ├── MetricDialog.tsx
│   │   ├── MetricsCard.tsx
│   │   ├── MetricTitle.tsx
│   │   └── MetricValue.tsx
│   └── ui/
│       ├── accordion.tsx
│       ├── AdminButton.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── custom-dialog.tsx
│       ├── data-table.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       └── etc...
├── config/
├── data/
├── hooks/
│   ├── use-toast.ts
│   └── useChartData.ts
├── lib/
│   ├── db.ts
│   ├── storage.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── db/
│   ├── hooks/
│   ├── services/
│   ├── state/
│   ├── store/
│   ├── types/
│   └── utils/
├── logs/
│   └── iisnode/
├── prisma/
│   └── schema.prisma
├── public/
└── styles/
    └── globals.css
