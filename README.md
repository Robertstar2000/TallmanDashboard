AccountingAPIQueueCustomer, AccountingAPIQueueGL, AccountingAPIQueueGLDimensions, AccountingAPIQueuePO, 
AccountingAPIQueuePODetail, AccountingAPIQueuePODimensions, AccountingAPIQueueTRDetail, 
AccountingAPIQueueTRDimensions, AccountingAPIQueueVendor, AccountingClass, AccountingCustomer, 
AccountingDepartment, AccountingEmployee, AccountingJobsite, AccountingLocation, AccountingMethod, 
AccountingProject, AccountingSalesman, AccountingTransaction, AccountingVendor, AccountNumbers, 
AccountsReceivable, AccountsReceivableAssigned, Attachments, AttachmentsLinkType, AutoContinuationTemplates, 
BankDeposits, BulkSerializationMethod, BulkSerializationMethod_Tr, CalendarSpecial, CalendarWeek, 
CallLogType, CallLogType_Tr, CashDrawer, CashDrawer_1229, CashDrawer_BAK, CategoryIncome, 
CategoryIncomeDetail, CategoryIncomeDetail_1229, CertificationDetail, CertificationDetailBackup_2016, 
CertificationType, CertificationType_Tr, CheckCardFile, ColumnOrder, CommissionLevelCustomer, 
CommissionLevelCustomer_Tr, CommissionLevelExcessiveDiscounts, CommissionLevelItem, CommissionLevelItem_Tr, 
CommissionLevelSalesman, Contract, ContractColumns, ContractColumns_Tr, ContractDetail, ContractFooter, 
ContractFormat, ContractFormat_Tr, ContractHeader, ContractSalesRepType, CountryCodes, CRMTerritories, 
CurrencyExchange, CurrentStoreTransfers, CustomerCard, CustomerComments, CustomerComments_Tr, CustomerEdit, 
CustomerEntityType, CustomerFile, CustomerFile_Tr, CustomerGroup, CustomerGroup_Tr, CustomerHeard, 
CustomerHeard_Tr, CustomerJobSite, CustomerJobSite_Tr, CustomerJobSiteType_Tr, CustomerMessage, 
CustomerMessage_Tr, CustomerNameFormat, CustomerNotifications, CustomerPicture, CustomerRestriction, 
CustomerStatus, CustomerStatus_Tr, CustomerType_Tr, CustomerTypePricing, CustomerTypePricing_Tr, 
DailyDeliveryPickupMax, Dates, DeliveryTrucks, DeliveryTrucks_Tr, DeliveryWindows, DisbursementDetail, 
DisbursementItems, DisbursementItems_Tr, DiscountTable_Tr, DiscountTableByCategory, District, 
DistrictStores, EmailMessages, EmailMessages_Tr, EmployeeHours, EmployeeLogType, EmployeePay, 
EntityTypes, EpicorContractHistory, EpicorContractLines, EpicorProfile, EpicorSKUIntegration, 
EpicorVersion, ErrorLog, ExportFormat, FeatureLicense, FeatureLicenseType, FeatureLimitType, 
FeaturePermissionType, FieldDefinitions, FileDescriptions, FulfillmentActions_Tr, FulFillmentVersion, 
GLDetailLevel, GLMode, GroupFile, GroupFile_Tr, GroupType, Images, ImagesLinkType, ImportTableDefinitions, 
IncomeType, IntacctDimensionCandidates, IntacctDimensions, IntegrationResources, ItemCategory_Tr, 
ItemCategoryPicture, ItemCategorySuper, ItemCategorySuper_Tr, ItemComments, ItemComments_Tr, 
ItemDepartment_Tr, ItemDepr179Working, ItemDepreciation, ItemDepreciationDetail, ItemDepreciationMethods, 
ItemDepreciationMethods_Tr, ItemDepreciationStoreDetail, ItemDivision, ItemDivision_Tr, ItemEdit, 
ItemEngine, ItemFile, ItemFile_Tr, ItemIncome, ItemKits, ItemKitsAuto, ItemKitsRepairs, 
ItemLocationDefaults, ItemLocations, ItemMaintenance, ItemMaintenanceDescription, 
ItemMaintenanceDescription_Tr, ItemMaintenanceDetail, ItemMaintenanceType, ItemMaintenanceType_Tr, 
ItemPicture, ItemPurchaseDetail, ItemPurchaseDetailFinancing, ItemQuantityChange, ItemQYOTLedger, 
ItemRateCode, ItemRates, ItemRatesDaily, ItemSerialization, ItemsForSale, ItemsRelatedType, 
ItemStatus, ItemType, ItemType_Tr, ItemWarranty, KitsActionTypes, KitsActionTypes_Tr, LanguageCode, 
LedgerCode, LedgerContractLineDetail, LedgerDetail, LedgerDetailCode, LedgerKeyContract, Letters, 
LicenseInfo, Locks, LoyaltyDetail, LoyaltyLevel, MapAddressAliases, MapColLayout, MapGPSMessages, 
MapGPSWorkOrders, MapIt, MapNotifyDetail, MapNotifyDetailLog, MapNotifyTriggerDefinitions, 
MapRouteDetails, MapRouteEdits, MapRouteNames, MapRouterOptions, MeterReadingCalledOffRent, 
MissedRentalReasons, MissedRentalReasons_Tr, MissedRentals, PurchaseOrder, PurchaseOrderColumns, 
PurchaseOrderEdit, PurchaseOrderFormat, PurchaseOrderGL, PurchaseOrderRejectedReasons, 
PurchaseOrderRejectedReasons_Tr, PurchaseOrderShipTo, PurchaseOrderTransport, SFSync_TransactionOpportunities, 
SFSync_TransactionPDFs, TotalsContractsAccrual, TotalsContractsCash, TransactionClassification, 
TransactionEdit, TransactionFulfillmentLog, TransactionItems, TransactionItems_Tr, 
TransactionItemsSerialization, TransactionItemsSerializationAction, TransactionItemsSerializationActionSources, 
TransactionItemsSubstatus, TransactionKey, TransactionKeyBackup, TransactionNotificationMessages, 
TransactionNotificationMessagesType, TransactionNotifications, TransactionOperation, TransactionOperation_Tr, 
Transactions, Transactions_Tr, TransactionSecondaryStatus, TransactionService, TransactionServiceType, 
TransactionServiceType_Tr, TransactionSignature, TransactionsRelated, TransactionsRelatedType, 
TransactionsRelatedType_Tr, TransactionStatus, TransactionsVoided, TransactionTaxDefinition, 
TransactionTaxDetail, TransactionType, TransactionType_Tr, TransferToRent, WorkOrderFormat, zCustomersIn, 
Contract_Tr, CustomerFile_Tr_Bak, CustomerJobSiteType, CustomerRestriction_Tr, CustomerType, 
LedgerKeyContractLine, PurchaseOrderDetail, PurchaseOrderPaymentMethods, SFSync_CustomerFileAccounts, 
TransactionItemsSubStatus_Tr, TransactionSecondaryStatus_Tr, TransactionStatus_Tr

# Dashboard Overview

This dashboard provides key performance indicators (KPIs) derived from the P21 (SQL Server) and POR (MS Access) databases.

## Chart Groups

The dashboard visualizes data organized into the following primary chart groups:

*   Key Metrics
*   Accounts
*   Customer Metrics
*   Historical Data
*   Inventory
*   POR Overview
*   Site Distribution
*   Daily Orders
*   Web Orders
*   AR Aging

(Detailed descriptions of each group and its metrics can be found in `chart_descriptions.md`)

## Key Metric Examples (POR Database - `Transactions` table)

1. **Open Rentals** - Number of open rental contracts
   ```sql
   SELECT Count(*) as value FROM Transactions 
   WHERE TransactionStatus IN ('Open', 'Active', 'Out')
   ```
   Alternative tables: `Contract`, `TransactionItems`

2. **New Rentals** - Number of contracts created in the current month
   ```sql
   SELECT Count(*) as value FROM Transactions 
   WHERE Month(DateCreated) = Month(Date()) AND Year(DateCreated) = Year(Date())
   ```
   Alternative tables: `Contract`, `TransactionItems`

3. **Rental Value** - Total value of all open contracts
   ```sql
   SELECT Sum(TotalAmount) as value FROM Transactions 
   WHERE TransactionStatus IN ('Open', 'Active', 'Out')
   ```
   Alternative tables: `Contract`, `TransactionItems`

#### Key Table Columns for POR Metrics

1. **Transactions Table**:
   - `TransactionStatus` - Status of the transaction (Open, Active, Out, etc.)
   - `DateCreated` - Date the transaction was created
   - `TotalAmount` - Total amount of the transaction

2. **Contract Table**:
   - `ContractStatus` - Status of the contract
   - `ContractDate` - Date the contract was created
   - `ContractAmount` - Total amount of the contract

3. **TransactionItems Table**:
   - `Status` - Status of the transaction item
   - `DateCreated` - Date the item was created
   - `ItemAmount` - Amount for the item

### POR Query Limitations
Due to the use of `mdb-reader` for MS Access connectivity, the following limitations apply:

1. **SQL Syntax**: Must use MS Access/Jet SQL syntax:
   - No schema prefixes (no "dbo.")
   - No table hints (no "WITH (NOLOCK)")
   - Uses Date() for current date
   - Uses DateAdd/DateDiff with quoted interval types
   - Uses Nz() for NULL handling

2. **Table Names**: The actual tables in the POR database may differ from the expected schema. The API will attempt to find similar table names if the exact table is not found.

3. **Query Types**: Only SELECT queries are supported. The API will parse the query to extract the table name and conditions, then use mdb-reader to filter the data.

### Background Worker System

The dashboard implements a background worker system that periodically executes SQL queries against the connected databases to update the dashboard data.

## Key Features
- **Configurable Execution Interval**: Default is 2 seconds between queries
- **Sequential Execution**: Queries are executed one at a time to prevent overloading the database. Queris are run in background and work independatly of the page selected or mode of the application,  they are only started or stoped by the UI interface.
- **Error Handling**: Failed queries are logged and retried 4 times and then skipped
- **Status Reporting**: Current execution status is displayed in the admin interface
- **Manual Control**: Worker can be started and stopped from the admin interface

## Implementation
The background worker is implemented using:
- Server-side API routes for worker control (`/api/admin/run/start`, `/api/admin/run/stop`, `/api/admin/run/status`)
- Client-side state management for tracking execution status
- WebSocket-like polling for real-time status updates

### Data Transformation System

Raw data from database queries is transformed into the format required by the dashboard charts through a series of transformation steps:

1. **Query Execution**: SQL queries retrieve raw data from the database
2. **Data Type Conversion**: String values are converted to appropriate types (number, date)
3. **Aggregation**: Related data points are grouped together for dashboard chart consumption
4. **Formatting**: Values are formatted for display (currency, percentages, etc.)
5. **Chart Preparation**: Data is structured according to the requirements of each chart type

## Transformation Types
The system supports various transformation types specified in the `calculation` field:
- `number` - Convert to numeric value
- `percentage` - Convert to percentage
- `currency` - Format as currency
- `date` - Parse and format date
- `count` - Count number of records
- `sum` - Sum numeric values
- `average` - Calculate average of numeric values
- `total` - Calculate total of numeric values

### Development and Deployment

## Development Environment Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` file with required environment variables
4. Start development server: `npm run dev`
5. Access the dashboard at `http://localhost:3200`

## Production Deployment
1. Build the application: `npm run build`
2. Deploy to IIS server using the provided deployment scripts:
   - `deploy-iis.cmd` - Deploy to IIS
   - `deploy-production.ps1` - Production deployment script

## Environment Variables
- `DATABASE_URL` - SQLite database URL for local development
- `P21_SERVER` - P21 SQL Server hostname
- `P21_DATABASE` - P21 database name
- `POR_FILE_PATH` - Path to POR MS Access database file
- `NEXT_PUBLIC_API_URL` - API URL for production deployment

### Troubleshooting
s

## Database Connection Issues
- **P21 Connection Failures**: 
  - Verify SQL Server is running
  - Check network connectivity
  - Confirm firewall settings
  - Verify credentials

- **POR Connection Failures**:
  - Verify file path is correct
  - Check file permissions
  - Ensure MS Access file is not locked by another process

## Query Execution Errors
- **Syntax Errors**: Check SQL syntax in the admin spreadsheet
- **Permission Errors**: Verify user has appropriate permissions
- **Timeout Errors**: Optimize queries or increase timeout settings

## Dashboard Display Issues
- **Missing Data**: Check if queries are returning expected results
- **Chart Rendering Problems**: Verify data format matches chart requirements
- **Performance Issues**: Optimize queries and reduce data volume

## Diagnostic Tools
- **Server Logs**: Check server logs for errors
- **Network Diagnostics**: Use network tools to verify connectivity
- **Database Profiler**: Use SQL Server Profiler to analyze query performance
- **Browser Developer Tools**: Check for JavaScript errors and network issues

### Data Flow Architecture

## 1. Data Sources & Storage
- Primary Storage: SQL Server
- In development mode, initial data is loaded from the `initialData` object in `lib/db.ts`.
- Connection configurations for P21 and POR servers are stored in the `p21Connection` and `porConnection` variables, respectively.
- The `getConnection` function is used to retrieve the appropriate connection based on the server type.

# 1a. External Data Source P21
- P21:  (ExternalDB)
- Provides data for dashboard value (with a P21 in the server field) set via SQL expression

# 1b. External Data Source POR
- POR:  (ExternalDB)
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
const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
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
