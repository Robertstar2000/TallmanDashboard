# TallmanDashboard Comprehensive Plan

## 1. Overview
This plan consolidates all requirements, architecture rules, testing strategies, and implementation details for the TallmanDashboard project. It covers integration with both P21 (SQL Server) and POR (MS Access) databases, dashboard data flow, SQL expression requirements, cache management, and robust testing/validation procedures.

---

## 2. Build and Environment Testing
- Test npm run dev and fix all errors
- Test npm run build and fix all errors
- Test npm start and fix all errors
- Test npm run lint and fix all errors
- Test npm run reset-db and verify database initialization
- Verify all environment variables are properly configured in .env file

---

## 3. Architecture & Data Flow

### 3.1 System Components
- **Admin Interface**: Spreadsheet-style editor for metric definitions, SQL expressions, and manual value overrides.
- **Dashboard UI**: Visualizes all chart groups, metrics, and historical data.
- **API Layer**: Handles all client-server communication; all DB access is server-side only.
- **Database Layer**: Utilizes SQLite for all application-specific data (e.g., user accounts, configurations) and local/test data. P21 (SQL Server) and POR (MS Access) are used for external data sources with strict separation.
- **Cache System**: In-memory and file-based cache, with explicit refresh marker files.
- **Background Worker**: System for periodic data updates with configurable execution intervals.

### 3.2 Data Flow Chain
1. **Initialization File (`single-source-data.ts`) → Database**
   - On startup or 'Load DB' action, full dataset is loaded into the database.
2. **Database → Admin Spreadsheet**
   - Admin UI displays/editable data from the DB.
3. **Spreadsheet → Database**
   - SQL expressions are executed per row; results overwrite the value field.
4. **Database → Initialization File**
   - On 'Save DB', all data is written back to the initialization file.
5. **Database → Chart Transformation → Dashboard**
   - Data is transformed and visualized in the dashboard.

### 3.3 File Structure Map
```
/TallmanDashboard_new
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── admin/              # Admin page
│   └── page.tsx            # Dashboard main page
├── components/             # React components
│   ├── admin/              # Admin components
│   ├── charts/             # Chart components
│   ├── dashboard/          # Dashboard components
│   └── ui/                 # UI components
├── lib/                    # Utility libraries
│   ├── db/                 # Database utilities
│   ├── stores/             # State management
│   └── types/              # TypeScript types
├── public/                 # Static assets
└── scripts/                # Utility scripts
```

---

## 4. Database Requirements

### 4.1 General
- All database access is server-side only (never direct from client).
- SQLite is used for all application-specific data (including user accounts and configurations) and can also be used for local/test data simulating P21/POR. P21/POR connections are for real external data.
- All queries must use correct dialect and schema for the target DB.
- All SQL expressions must be tested and return non-zero values in production.

### 4.2 P21 (SQL Server)
- Use T-SQL syntax with schema prefix (`dbo.`), `WITH (NOLOCK)` hints, and `GETDATE()` for current date.
- Connection via ODBC DSN (`P21Play`) with Windows Authentication.
- Key tables: SOMAST, ARINV, OE_HDR, ICINV, Customers, Invoices, Payments.

### 4.3 POR (MS Access)
- Use Jet SQL syntax (no schema prefix, no hints, `Date()` for current date, `#...#` for date literals).
- Connection via MDBReader or equivalent (client-side only for reading MDB files).
- Key tables: Rentals, Customers, Items, Payments, ContractLines.

---

## 5. Chart Groups & Metric Requirements

Refer to `chartgroup_specs.md` for full details. Each chart group has:
- Defined variables and axis steps (e.g., months, days, sites)
- Required SQL expressions (total: 174 rows)
- Mapping to server type (P21 or POR)

**Chart Groups:**
1. AR Aging (P21): 5 buckets
2. Accounts (P21): 3 variables × 12 months
3. Customer Metrics (P21): 2 variables × 12 months
4. Daily Orders (P21): 7 days
5. Historical Data (P21, POR): 3 variables × 12 months
6. Inventory (P21): 2 variables × 4 depts
7. Key Metrics (P21): 7 metrics
8. Site Distribution (P21): 3 sites
9. POR Overview (POR): 3 variables × 12 months
10. Web Orders (P21): 1 variable × 12 months

---

## 6. SQL Expression Rules
- Always match the SQL dialect to the target DB (see `SQL_dialect.txt`).
- Use proper table/column names (see `schema.txt`).
- All queries must return a single value as `value`.
- No fallback/test SQL expressions in production; all must be validated.
- Use parameters for date ranges and axis steps where appropriate.
- Null handling: use `ISNULL()` (P21) or `Nz()` (POR).

---

## 7. Integration & Synchronization
- Always keep `single-source-data.ts`, the database, and the dashboard display in sync.
- Use provided scripts (e.g., `comprehensive-data-sync.js`) for bulk updates.
- When updating SQL expressions, clear all cache mechanisms:
  - In-memory cache
  - Marker files: `data/refresh_required`, `data/cache-refresh.txt`, `data/force_refresh.json`, `.next-cache-reset`
  - DB cache_control table
- Restart the server or use the admin UI to force a refresh.

---

## 8. Implementation Plan

### 8.1 P21 Integration
- Verify SQL Server connection parameters
- Test all P21 SQL queries for accuracy
- Optimize query performance
- Implement error handling for P21 connection issues

### 8.2 POR Integration
- Verify MS Access file path and accessibility
- Test POR queries with mdb-reader limitations in mind
- Implement workarounds for SQL limitations
- Ensure proper error handling for POR-specific issues

### 8.3 Background Worker System
- Verify worker initialization and shutdown
- Test sequential query execution
- Implement error recovery mechanisms
- Optimize execution interval for performance

### 8.4 Chart Data Processing
- Verify data transformation for each chart type
- Test aggregation functions
- Implement caching for improved performance
- Ensure proper type conversion and formatting

### 8.5 Admin Spreadsheet
- Verify row editing functionality
- Test SQL expression validation
- Implement save/load functionality
- Ensure proper error reporting

---

## 9. Testing & Validation
Check each test before running to make sure recient code changes are consitered in the tests

### 9.1 Data Consistency and unit testing
- Run suite of unit tests
After updates, verify that all 174 required rows exist and are mapped to the correct chart, variable, and axis step.
- Ensure all values propagate from DB to spreadsheet to dashboard.

### 9.2 UI & Functional Testing
- Verify that all chart groups render with correct data.
- Check that admin spreadsheet updates reflect in dashboard.
- Test all refresh and cache-clear mechanisms.
- Confirm error reporting and health checks are visible in the admin UI.

### 9.3 Integration Testing
- Test P21 and POR connections via the admin dialog.
- Validate all API endpoints for query execution and connection management.
- Simulate network, authentication, and permission errors to verify error handling.

### 9.4 Dashboard Testing
- Verify all 10 chart groups display correctly
- Test data refresh functionality
- Verify metric calculations are accurate
- Test responsive layout on different screen sizes
- Verify error handling for failed data fetches

### 9.5 Admin Interface Testing
- Test SQL expression editing and saving
- Verify connection configuration for P21 and POR
- Test background worker start/stop functionality
- Verify SQL query testing features
- Test data initialization and reset

### 9.6 API Testing
- Test all API endpoints for correct responses
- Verify error handling for invalid requests
- Test rate limiting functionality
- Verify data transformation logic

### 9.7 SQL Testing
- Test each SQL expression
- Verify background worker performance


## 10. Deployment Process

### 10.1 Development Environment
- Configure local development environment
- Set up test databases (SQLite for development)
- Configure environment variables

### 10.2 Production Deployment
- Build production-ready application
- Configure IIS server for hosting
- Set up database connections
- Implement logging and monitoring

### 10.3 Continuous Integration
- Set up automated testing
- Implement build verification
- Configure deployment pipeline

---

## 11. Verification and Validation

### 11.1 Functional Verification
- Verify all features work as specified
- Test edge cases and error conditions
- Validate calculations and data presentation

### 11.2 Performance Validation
- Measure and optimize loading times
- Verify background worker efficiency
- Test with production-scale data volumes

### 11.3 Security Validation
- Test for SQL injection vulnerabilities
- Verify proper authentication
- Check for information disclosure issues

---

## 12. Maintenance & Update Procedures
- Always update `single-source-data.ts` via script (not manual edits).
- When schema or chart group requirements change, update all related SQL expressions and mappings.
- Document all changes in `plan.md` and related logs.
- Re-run all tests after major updates.

### 12.1 Regular Updates
- Schedule for dependency updates
- Performance optimization reviews
- Security patch application

### 12.2 Monitoring
- Error logging and alerting
- Performance monitoring
- Usage statistics

### 12.3 Backup and Recovery
- Database backup procedures
- Application state backup
- Recovery testing

---

## 13. Documentation

### 13.1 User Documentation
- Dashboard usage guide
- Admin interface instructions
- Troubleshooting guide

### 13.2 Technical Documentation
- Architecture overview
- Database schema documentation
- API documentation
- Deployment guide

---

## 14. References
- `README.md`, `SQL_dialect.txt`, `schema.txt`, `chartgroup_specs.md`, `key-metrics-results.txt`, `sql-test-summary.txt`, `comprehensive-data-sync.js`, `reset-and-fix-dashboard.js`
- See also: `POR-INTEGRATION-GUIDE.md`, `PORTables.md`, `README-schema-queries.md`, `README-additions.md`, and all `.txt` test summary files.

---

## 15. Quick Checklist
- [ ] Test all npm scripts (dev, build, start, lint, reset-db)
- [ ] Verify environment variables configuration
- [ ] All 174 metric rows defined and mapped
- [ ] All SQL expressions tested and non-zero
- [ ] Database, spreadsheet, and dashboard are in sync
- [ ] P21 and POR connections validated
- [ ] Cache cleared after updates
- [ ] UI, API, and error reporting tested
- [ ] All changes documented in `plan.md`
- [ ] Deployment process verified
- [ ] Backup and recovery procedures tested
