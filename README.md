# TallmanDashboard

A Next.js-based business intelligence dashboard that connects to P21 (SQL Server) and POR (MS Access) databases to provide real-time key performance indicators (KPIs) and business metrics.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Windows environment (required for ODBC connections)
- Access to P21 SQL Server database
- Access to POR MS Access database file
- ODBC drivers installed:
  - SQL Server ODBC driver
  - Microsoft Access ODBC driver (*.mdb, *.accdb)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TallmanDashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env` to `.env.local`
   - Update the following variables in `.env.local`:
   ```env
   # P21 SQL Server Database
   P21_SERVER=10.10.20.13
   P21_DATABASE=P21_LIVE
   P21_TRUSTED_CONNECTION=true
   P21_DSN=P21Live
   
   # POR MS Access Database
   NEXT_PUBLIC_POR_DB_PATH=\\ts03\POR\POR.MDB
   ```

4. **Start the application**
   ```bash
   # Using the batch file (recommended)
   .\start-dashboard.bat
   
   # Or using npm directly
   npm run dev
   ```

5. **Access the dashboard**
   - Open your browser to `http://localhost:5500`
   - The application **MUST** run on port 5500 only

## 📋 Operating Instructions

### Dashboard Navigation

1. **Main Dashboard View**
   - Access the main dashboard at `http://localhost:5500`
   - View real-time KPIs organized by chart groups
   - Charts automatically refresh based on configured intervals

2. **Admin Panel**
   - Navigate to the admin section for configuration
   - Test database connections
   - Manage chart data and SQL queries
   - Configure refresh intervals and data sources

### Database Connection Testing

1. **P21 Database Connection**
   - Server: SQL01
   - Port: 1433
   - Database: P21Live
   - Authentication: Windows Authentication
   - Click "Test P21 Connection" to verify connectivity

2. **POR Database Connection**
   - File Path: `\\ts03\POR\POR.MDB`
   - Click "Test POR Connection" to verify file access

### Chart Management

1. **Viewing Charts**
   - Charts are organized into groups: Key Metrics, Accounts, Customer Metrics, etc.
   - Each chart displays real-time data from configured SQL queries
   - Hover over charts for detailed information

2. **Editing Chart Data**
   - Access the admin panel to modify chart configurations
   - Update SQL queries for data sources
   - Configure chart types and display options
   - Set refresh intervals for automatic updates

3. **Adding New Charts**
   - Use the admin interface to create new chart configurations
   - Define SQL queries for P21 or POR databases
   - Set chart properties and grouping

### Data Refresh

1. **Automatic Refresh**
   - Charts refresh automatically based on configured intervals
   - Background processes execute SQL queries periodically
   - Data updates are reflected in real-time on the dashboard

2. **Manual Refresh**
   - Use the refresh controls in the admin panel
   - Force immediate data updates for specific charts
   - Clear cache and reload all data sources

## 🔧 Troubleshooting

### Database Connection Issues

**Problem**: Database connections fail after system restart

**Solution**: 
1. Restart the Next.js development server to pick up environment variables
2. Use the batch file: `./start-dashboard.bat`
3. Verify `.env.local` contains correct database configurations

**Problem**: P21 connection fails

**Causes & Solutions**:
- **Missing DSN**: Ensure `P21_DSN=P21Live` is set in `.env.local`
- **ODBC Driver**: Verify SQL Server ODBC driver is installed
- **Network Access**: Check connectivity to SQL Server (SQL01:1433)
- **Authentication**: Ensure Windows Authentication is properly configured

**Problem**: POR connection fails

**Causes & Solutions**:
- **File Path**: Verify `NEXT_PUBLIC_POR_DB_PATH=\\ts03\POR\POR.MDB` is correct
- **File Access**: Ensure the network path is accessible
- **ODBC Driver**: Install Microsoft Access ODBC driver
- **Permissions**: Check file and network share permissions

### Application Issues

**Problem**: Application won't start

**Solutions**:
1. Check if port 5500 is already in use
2. Run `./start-dashboard.bat` which kills existing processes
3. Verify Node.js and npm are properly installed
4. Check for build errors in the console

**Problem**: Charts not displaying data

**Solutions**:
1. Test database connections in the admin panel
2. Verify SQL queries are valid and return data
3. Check console for JavaScript errors
4. Restart the application to refresh data connections

### Recent Fixes Applied

**Build Error Fix (Latest)**
- **Issue**: Next.js build failing due to misplaced `export const config` statement
- **Fix**: Moved `export const config = { runtime: 'nodejs' }` from top to end of API route file
- **File**: `app/api/admin/run-query/route.ts`
- **Impact**: Resolved build errors and enabled proper server startup

**Port Configuration**
- **Issue**: Application attempting to use multiple ports
- **Fix**: Enforced strict port 5500 usage across all configuration files
- **Files Updated**: `package.json`, `next.config.cjs`, `start-dashboard.bat`, `server.js`
- **Impact**: Consistent port usage prevents conflicts

**Environment Variable Loading**
- **Issue**: Database connections failing after restart
- **Fix**: Ensured proper environment variable loading from `.env.local`
- **Impact**: Reliable database connectivity after system restarts

## 📊 Chart Groups

The dashboard visualizes data organized into the following primary chart groups:

- **Key Metrics**: Core business KPIs and performance indicators
- **Accounts**: Account-related metrics and financial data
- **Customer Metrics**: Customer behavior and relationship data
- **Historical Data**: Time-series analysis and trends
- **Inventory**: Stock levels and inventory management
- **POR Overview**: POR database specific metrics
- **Site Distribution**: Geographic and location-based data
- **Daily Orders**: Order processing and fulfillment metrics
- **Web Orders**: E-commerce and online order tracking
- **AR Aging**: Accounts receivable and aging analysis

## 🔒 Security Notes

- **Query Safety**: API routes include safety checks to allow only SELECT statements
- **Environment Variables**: Sensitive data stored in `.env.local` (not committed to version control)
- **Database Access**: Uses Windows Authentication and secure ODBC connections
- **Input Validation**: All database queries are validated before execution

## 🛠️ Development

### Technology Stack
- **Frontend**: Next.js 13 with TypeScript
- **UI Components**: Material-UI (@mui/material), Radix UI
- **Database**: ODBC connections to SQL Server and MS Access
- **Styling**: Emotion React for styled components
- **Charts**: Custom chart components with real-time data

### Project Structure
```
TallmanDashboard/
├── app/                    # Next.js 13 app directory
│   ├── api/               # API routes
│   │   └── admin/         # Admin API endpoints
│   └── components/        # React components
├── lib/                   # Utility libraries
│   └── db/               # Database connection logic
├── public/               # Static assets
├── .env                  # Environment template
├── .env.local           # Local environment config
├── start-dashboard.bat  # Windows startup script
└── package.json         # Dependencies and scripts
```

### Key Files
- `start-dashboard.bat`: Startup script that handles port cleanup and cache clearing
- `.env.local`: Database connection configuration
- `lib/db/server.ts`: Database connection and query execution logic
- `app/api/admin/`: API routes for database testing and admin functions

## 📝 Maintenance

### Regular Tasks
1. **Monitor Database Connections**: Regularly test P21 and POR connections
2. **Update Dependencies**: Keep npm packages up to date
3. **Review Logs**: Check console output for errors or warnings
4. **Backup Configuration**: Ensure `.env.local` is backed up securely

### Performance Optimization
1. **Query Optimization**: Review and optimize SQL queries for better performance
2. **Cache Management**: Monitor and clear caches when necessary
3. **Resource Monitoring**: Watch memory and CPU usage during operation

## 📞 Support

For technical issues:
1. Check the troubleshooting section above
2. Review console logs for error messages
3. Verify database connectivity using the admin panel
4. Ensure all environment variables are properly configured

---

**Last Updated**: July 24, 2025
**Version**: Latest with build fixes and port standardization

- Provides data for dashboard value (with a POR in the server field) set via SQL expression

## 2. Admin Page Flow

# Overview
The Admin Page provides a user interface for managing dashboard variables. The admin spreadsheet needs to have one row of data for every data point on each of the graphs and metrics group elements. This means if a chart has 12 months of data for 2 variables, it will be represented by 24 rows in the admin spreadsheet. All the data in the spreadsheet is static except the value that represents a value retrieved by a SQL expression from either the P21 or POR server (the server used is selected by the server column in the row). The SQL expression and table are user editable, but all data is stored and retrieved using the Epicore P21 schema or the Point of Rental (POR) schema.

# Components
- Dashboard Layout: Provides the overall layout of the Dashboard page, charts and metrics group
- Admin Layout: Provides the overall layout of the Admin page
- AdminSpreadsheet.tsx: Main grid container
- DataRow.tsx: Editable row component for spreadsheet like functionality
- AdminControls.tsx: Contains buttons for run/stop, return to dashboard, connect P21, connect POR, and edit functions on spreadsheet (table and sql expression) fields
- P21 and POR official SQL schema for reference

# Data Flow (Production Mode)
- The `executeQuery` function is used to execute SQL expressions and retrieve data from the P21 and POR servers.
- Path: Lookup selected server -> switch to selected server {P21 or POR} -> lookup row sql expression -> execute sql expression -> sql result is datapoint value -> put value in AdminSpreadsheet.tsx -> value to admin.ts -> copy value to dashboard
1. Load on program start only: Admin spreadsheet initializes with zero set on every value for every row -> admin.ts -> AdminSpreadsheet.tsx -> Dashboard charts and metrics group element
2. Allow Edit: DataRow.tsx allows editing of SQL expressions and table names -> admin.ts -> SQL Server
3. When Run is selected: System sequences through rows step by step, executing each SQL expression using the selected server and updating the row's value this continues indefinalty until stoped by user
4. On row execution: Data is fetched from the selected connected SQL Server (POR or P21) -> admin.ts -> AdminSpreadsheet.tsx -> dashboard graphics or metrics group element
5. Changes persist globally until updated by the next cycle's SQL execution. Updates are directly reflected in dashboard graphs and metric displays
- In production mode, the `/api/executeQuery` endpoint is used to execute queries.

## 3. Dashboard Flow

# Overview
Every value on every row in the admin spreadsheet is directly linked to a corresponding data point on the dashboard display.

## 4. Admin Spreadsheet Variables
The admin spreadsheet uses the following variables:
-ID (Sequential Numeric row number) 
- name (i.e. date)
- subGroup
- value
- chartGroup (i.e. (Inventory)
- calculation (How the value is transformed) from the SQL expression result)
- sqlExpression(Created for the specific servers SQL schema: P21 or POR)
- DB Table name

## 5. Data Flow (Production Mode)
  
- The data source for values when in run mode and in production mode is from an external SQL Server (P21 or POR). The server is selected by the server field in the admin spreadsheet.

## 6. Data Flow (All Modes)

- At application startup, static data is loaded in the admin spreadsheet from the initial-data.ts, the static data it includes all of the admin spreadsheet fields and all rows. The value field is set to a estimate of the what a 50 million dollar tool supply company might be. The SQL expression and table are matched to the P21 or POR schema. initial-data.ts must fill in all fields.
- In stop mode, the sql expression and table fields can be edited and saved as a edit to the admin spreadsheet field and the initial-data.ts file stored in local storage
- In run mode, the admin spreadsheet executes each row's sql expression against the selected datasource (P21 or POR) and then steps to the next row every 2 seconds. Each sql expression evaluation gets one value and is stored in the value field of the admin spreadsheet
- One data point (AKA value) from one row is updated every 2 seconds from one source generating one value
- The Value is transformed to displayed in the admin spreadsheet and again transformed to displayed on the dashboard as a single data point on the chart or metrics group element it is linked to
- Chart updates are throttled to 2 second intervals

## 7. Components

- ChartComponents: D3-based visualizations
- AdminGrid: Data management interface
- StatusIndicators: System health monitoring and error reporting
- TimeDisplayApp: Real-time clock with configurable display modes
- AdminControls: Provides buttons for run/stop, return to dashboard, connect P21, connect POR, and edit functions
- DataRow: Editable row component for spreadsheet-like functionality
- DashboardLayout: Provides the overall layout of the Dashboard page
- AdminLayout: Provides the overall layout of the Admin page


## 8. Connection Error Checking

Automatic server health check in external and internal servers:
   - Verify SQL Server is running
   - Test network connectivity
   - Confirm firewall settings
   - Connection timeout: Check network latency
   - Authentication errors: Verify credentials
   - TLS/SSL issues: Ensure certificates are valid
   - For servers report issues and potential solutions on admin error reporting area (Below admin controls, above spreadsheet and with the color of the connect buttons)

## 9. File Structure
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
│       └── ├── components/
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
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── chart.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── custom-dialog.tsx
│   │   ├── data-table.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   └── etc...
├── config/
├── data/
├── hooks/
│   ├── use-toast.ts
│   └── useChartData.ts
├── lib/
│   ├── db.ts
│   ├── storage.ts
│   ├── types.ts
│   └── utils.ts
├── logs/
│   └── iisnode/
├── prisma/
│   └── schema.prisma
├── public/
└── styles/
    └── globals.css

## 10. Key Metrics Descriptions

The dashboard displays several key metrics that provide important business insights. Each metric is generated using a specific SQL query against the P21 database. Below are detailed descriptions of each key metric:

### 1. Total Orders
**Description**: Total number of orders in the last 7 days.
**SQL Query**:
```sql
SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) 
WHERE order_date >= DATEADD(day, -7, GETDATE())
```
**What it shows**: This metric provides a snapshot of recent order volume, helping to track short-term sales activity.

### 2. Open Orders
**Description**: Total number of orders that are not closed.
**SQL Query**:
```sql
SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) 
WHERE completed = 'N'
```
**What it shows**: This metric indicates the current workload in terms of orders that still need to be processed, shipped, or otherwise completed.

### 3. Open Orders 2
**Description**: Total dollar value of all open orders.
**SQL Query**:
```sql
SELECT ISNULL(SUM(l.extended_price), 0) as value 
FROM oe_hdr h WITH (NOLOCK)
JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
WHERE h.completed = 'N'
```
**What it shows**: This metric provides the financial value of all pending orders, giving insight into expected future revenue.

### 4. Daily Revenue
**Description**: Total dollar value of orders shipped yesterday.
**SQL Query**:
```sql
SELECT ISNULL(SUM(l.extended_price), 0) as value 
FROM oe_hdr h WITH (NOLOCK)
JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))
```
**What it shows**: This metric tracks daily sales performance, using yesterday's data as a complete day sample.

### 5. Open Invoices
**Description**: Total number of open invoices from the last month.
**SQL Query**:
```sql
SELECT COUNT(*) as value 
FROM invoice_hdr WITH (NOLOCK) 
WHERE invoice_date >= DATEADD(month, -1, GETDATE())
```
**What it shows**: This metric tracks recent invoicing activity, indicating the volume of sales that have been invoiced but may not yet be paid.

### 6. Orders Backlogged
**Description**: Total number of orders that are on hold or backlogged from the last 30 days.
**SQL Query**:
```sql
SELECT COUNT(*) as value 
FROM oe_hdr WITH (NOLOCK) 
WHERE completed = 'N' 
AND order_date >= DATEADD(day, -30, GETDATE())
```
**What it shows**: This metric highlights potential fulfillment issues by tracking recent orders that haven't been completed, helping to identify bottlenecks in the order processing workflow.

### 7. Total Monthly Sales
**Description**: Total dollar amount of all orders for the last 30 days.
**SQL Query**:
```sql
SELECT ISNULL(SUM(l.extended_price), 0) as value 
FROM oe_hdr h WITH (NOLOCK)
JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
WHERE h.order_date >= DATEADD(day, -30, GETDATE())
```
**What it shows**: This metric provides a rolling 30-day view of total sales value, offering insight into medium-term revenue performance.

# Testing Key Metrics

To test these key metrics and ensure they return non-zero values:

1. Create a test script that connects to the P21 database using ODBC
2. Execute each SQL query and verify the results
3. Write the results to a file for examination
4. Update the initial data configuration with successful queries

Example test script:
```javascript
const odbc = require('odbc');
const fs = require('fs');

// Connect to P21 database
const connectionString = 'DSN=P21Live;Trusted_Connection=Yes;';
const connection = await odbc.connect(connectionString);

// Test each key metric query
const results = [];
for (const metric of keyMetrics) {
  const result = await connection.query(metric.sql);
  results.push({
    name: metric.name,
    value: result[0]?.value,
    success: result[0]?.value > 0
  });
}

// Write results to file
fs.writeFileSync('key-metrics-results.txt', JSON.stringify(results, null, 2));
```

All SQL queries use the `WITH (NOLOCK)` hint to prevent locking issues and include `ISNULL()` functions where appropriate to handle null values.

## Key Metrics SQL Improvements

The following improvements have been made to the Key Metrics SQL expressions to ensure accurate data retrieval from the P21 database:

1. **Total Orders**: Now shows orders for the current month only, using a date range calculation that starts from the first day of the current month.

2. **Open Orders (/day)**: Limited to only show open orders from the current date, providing a daily snapshot.

3. **Daily Revenue**: Formatted as currency with proper decimal places using CAST to DECIMAL(18,2), showing yesterday's revenue.

4. **Open Invoices**: Fixed the SQL expression to use a simple date filter without status checks, which works reliably with the P21 database.

5. **Total Sales Monthly**: Updated to show sales for the current month only, using the same date range calculation as Total Orders, and formatted as currency.

## 11. Data Requirements

# Correct Date Ranges
- Monthly data (last 12 months for Open Orders, Total Orders, Total Sales, etc.)
- Daily data (last 7 days for Daily Orders)
- Orders Backlogged (last 30 days)
- Inventory Departments (Dept 100,101,102,1070)
- Site Distribution (Columbus, Addison, Lake City)
)
 
# Precise Metric Calculations
- Daily Revenue = Sum of today's orders
- Open Invoices = Count of unshipped POs in the current month
- Orders Backlogged = Count of orders in backlog for past 30 days
- Total Monthly Sales = Total sales per month (last 12 months)

# Inventory Buckets
- Use the standard inventory categories (Current, 1-30 days, 31-60 days, 61 to 90 days, 91+ days)

# Key Metrics
- Each metric will have one dedicated SQL expression.

## 12. Database Connection Management System

# Overview of the Connection Manager Architecture

The TallmanDashboard implements a robust database connection management system designed to establish and maintain reliable connections to external SQL Server databases (P21 and POR). This system ensures that real-time data can be retrieved from these databases to populate the dashboard metrics and charts.

# Key Components

1. **ConnectionManager Class**
   - Located in `lib/db/connection-manager.ts`
   - Serves as the central hub for managing database connections
   - Provides methods for testing connections and executing SQL queries
   - Maintains connection pools for performance optimization
   - Implements connection state tracking to prevent redundant connection attempts

2. **RealConnectionManager Class**
   - Located in `lib/db/real-connection-manager.ts`
   - Handles the actual connection to SQL Server databases
   - Creates and manages connection pools using the `mssql` library
   - Implements Windows Authentication and SQL Authentication methods
   - Provides detailed error reporting for connection failures

3. **ServerConfig Interface**
   - Located in `lib/db/connections.ts`
   -
