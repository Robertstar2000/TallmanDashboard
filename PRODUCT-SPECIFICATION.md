# TallmanDashboard Product Specification

## Executive Summary

TallmanDashboard is a comprehensive business intelligence dashboard application built with Next.js that provides real-time key performance indicators (KPIs) and business metrics for a tool supply company. The system integrates with two primary data sources: P21 (SQL Server) for enterprise resource planning data and POR (MS Access) for point-of-rental operations data.

## Product Overview

### Purpose
To provide executives and managers with real-time visibility into critical business metrics across multiple operational systems, enabling data-driven decision making and operational efficiency improvements.

### Target Users
- **Primary**: Business executives, operations managers, and department heads
- **Secondary**: IT administrators and system analysts
- **Tertiary**: Data analysts and business intelligence specialists

### Key Value Propositions
1. **Unified Data View**: Consolidates data from disparate systems (P21 and POR) into a single dashboard
2. **Real-time Monitoring**: Provides live updates of critical business metrics
3. **Operational Efficiency**: Reduces time spent gathering data from multiple systems
4. **Data-Driven Decisions**: Enables quick identification of trends and issues

## Technical Architecture

### Technology Stack
- **Frontend Framework**: Next.js 13 with TypeScript
- **UI Components**: 
  - Material-UI (@mui/material)
  - Radix UI components
  - Custom chart components
- **Database Connectivity**: 
  - ODBC for P21 (SQL Server)
  - ODBC/ADODB for POR (MS Access)
  - SQLite for local data storage and caching
- **Styling**: Tailwind CSS with Emotion React
- **Authentication**: Custom JWT-based authentication system
- **Data Visualization**: Custom React components with Chart.js integration

### System Requirements
- **Operating System**: Windows Server 2022 (required for ODBC connections)
- **Runtime**: Node.js 16+
- **Database Drivers**:
  - SQL Server ODBC driver
  - Microsoft Access ODBC driver (*.mdb, *.accdb)
- **Network Access**: 
  - P21 SQL Server (SQL01:1433)
  - POR MS Access file (\\ts03\POR\POR.MDB)

### Deployment Architecture
- **Port Configuration**: Fixed to port 5500 for consistency
- **Environment**: Windows-based deployment with IIS integration
- **Data Storage**: Local SQLite database for configuration and caching
- **Connection Management**: Persistent ODBC connections with automatic retry logic

## Core Functionality

### 1. Dashboard Display System

#### Main Dashboard Interface
- **Grid Layout**: Responsive grid system displaying metrics and charts
- **Real-time Updates**: Automatic refresh every 30 seconds
- **Visual Components**:
  - Key Metrics Cards (7 primary KPIs)
  - Chart Groups (10 distinct chart categories)
  - Interactive data visualization

#### Chart Groups and Data Categories
1. **Key Metrics**: Core business KPIs and performance indicators
2. **Accounts**: Account-related metrics and financial data
3. **Customer Metrics**: Customer behavior and relationship data
4. **Historical Data**: Time-series analysis and trends
5. **Inventory**: Stock levels and inventory management
6. **POR Overview**: POR database specific metrics
7. **Site Distribution**: Geographic and location-based data
8. **Daily Orders**: Order processing and fulfillment metrics
9. **Web Orders**: E-commerce and online order tracking
10. **AR Aging**: Accounts receivable and aging analysis

### 2. Admin Management System

#### Admin Spreadsheet Interface
- **Data Grid**: Editable spreadsheet-like interface for managing all dashboard data points
- **Row-by-Row Configuration**: Each dashboard data point corresponds to one spreadsheet row
- **Real-time Editing**: Live editing of SQL expressions and table configurations
- **Visual Feedback**: Active row highlighting during query execution

#### Admin Spreadsheet Data Structure
Each row contains the following fields:
- **ID**: Sequential numeric row identifier
- **Chart Group**: Category classification (e.g., "Inventory", "Key Metrics")
- **Variable Name**: Descriptive name for the data point
- **Data Point**: Display label for the dashboard
- **Server Name**: Data source selection (P21 or POR)
- **Table Name**: Database table reference
- **Production SQL Expression**: Custom SQL query for data retrieval
- **Value**: Current data value (updated by SQL execution)
- **Calculation Type**: Data transformation method (SUM, AVG, COUNT, LATEST)
- **Axis Step**: Chart axis configuration
- **Last Updated**: Timestamp of last data refresh

#### Admin Control Functions
- **Run/Stop Controls**: Start/stop automated data refresh cycles
- **Connection Testing**: Verify P21 and POR database connectivity
- **Data Export/Import**: Backup and restore configuration data
- **Real-time Monitoring**: Live view of query execution status

### 3. Database Integration System

#### P21 Integration (SQL Server)
- **Connection Method**: ODBC DSN-based connection
- **Authentication**: Windows Authentication (trusted connection)
- **Data Schema**: Epicor P21 enterprise schema
- **Query Execution**: Parameterized SQL queries with safety validation
- **Performance**: Connection pooling and query optimization

#### POR Integration (MS Access)
- **Connection Method**: ODBC/ADODB hybrid approach
- **File Access**: Network file path (\\ts03\POR\POR.MDB)
- **Fallback Strategy**: MDBReader for simple COUNT queries
- **Data Schema**: Point of Rental (POR) custom schema
- **Error Handling**: Automatic fallback between connection methods

#### Local Data Management
- **SQLite Database**: Local storage for configuration and caching
- **Schema Management**: Automatic table creation and migration
- **Data Persistence**: Configuration data stored locally
- **Backup Strategy**: Automatic data backup and recovery

### 4. Authentication and Security

#### User Authentication System
- **Login Interface**: Custom login page with credential validation
- **Session Management**: JWT-based session tokens
- **User Roles**: Admin and standard user role differentiation
- **Security Features**: 
  - Password encryption
  - Session timeout
  - SQL injection prevention
  - Input validation and sanitization

#### Database Security
- **Query Safety**: Restricted to SELECT statements only
- **Connection Security**: Windows Authentication for P21
- **Environment Variables**: Sensitive data stored in .env.local
- **Access Control**: Role-based access to admin functions

## Data Flow Architecture

### 1. Application Startup Sequence
1. **Environment Loading**: Load configuration from .env.local
2. **Database Initialization**: Create/verify SQLite schema
3. **Initial Data Load**: Populate admin spreadsheet with default values
4. **Connection Testing**: Verify P21 and POR connectivity
5. **Dashboard Rendering**: Display initial dashboard with cached data

### 2. Production Data Flow (Run Mode)
1. **Sequential Processing**: Process admin spreadsheet rows one by one
2. **Server Selection**: Route query to P21 or POR based on serverName field
3. **SQL Execution**: Execute productionSqlExpression against selected server
4. **Data Transformation**: Apply calculationType to raw query results
5. **Value Update**: Store result in admin spreadsheet value field
6. **Dashboard Refresh**: Update corresponding dashboard visualization
7. **Cycle Continuation**: Move to next row after 2-second interval

### 3. Admin Edit Flow (Stop Mode)
1. **Edit Mode Activation**: Enable spreadsheet cell editing
2. **Real-time Validation**: Validate SQL syntax and table references
3. **Local Storage**: Save changes to SQLite database
4. **Configuration Backup**: Update initial-data.ts with changes
5. **Change Persistence**: Maintain edits until next production run

### 4. Error Handling and Recovery
1. **Connection Monitoring**: Continuous health checks for database connections
2. **Query Validation**: Pre-execution SQL syntax validation
3. **Fallback Mechanisms**: Alternative connection methods for POR
4. **Error Reporting**: Detailed error messages in admin interface
5. **Automatic Recovery**: Retry logic for failed connections

## Key Metrics Specifications

### Core Business KPIs

#### 1. Total Orders
- **Description**: Total number of orders in the last 7 days
- **SQL Query**: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())`
- **Data Source**: P21 (oe_hdr table)
- **Update Frequency**: Every 2 seconds during run mode
- **Business Value**: Short-term sales activity tracking

#### 2. Open Orders (Count)
- **Description**: Total number of orders that are not closed
- **SQL Query**: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N'`
- **Data Source**: P21 (oe_hdr table)
- **Update Frequency**: Every 2 seconds during run mode
- **Business Value**: Current workload visibility

#### 3. Open Orders (Value)
- **Description**: Total dollar value of all open orders
- **SQL Query**: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'`
- **Data Source**: P21 (oe_hdr, oe_line tables)
- **Update Frequency**: Every 2 seconds during run mode
- **Business Value**: Expected future revenue visibility

#### 4. Daily Revenue
- **Description**: Total dollar value of orders shipped yesterday
- **SQL Query**: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`
- **Data Source**: P21 (oe_hdr, oe_line tables)
- **Update Frequency**: Every 2 seconds during run mode
- **Business Value**: Daily sales performance tracking

#### 5. Open Invoices
- **Description**: Total number of open invoices from the last month
- **SQL Query**: `SELECT COUNT(*) as value FROM invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())`
- **Data Source**: P21 (invoice_hdr table)
- **Update Frequency**: Every 2 seconds during run mode
- **Business Value**: Recent invoicing activity tracking

#### 6. Orders Backlogged
- **Description**: Total number of orders on hold or backlogged from the last 30 days
- **SQL Query**: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())`
- **Data Source**: P21 (oe_hdr table)
- **Update Frequency**: Every 2 seconds during run mode
- **Business Value**: Fulfillment bottleneck identification

#### 7. Total Monthly Sales
- **Description**: Total dollar amount of all orders for the last 30 days
- **SQL Query**: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())`
- **Data Source**: P21 (oe_hdr, oe_line tables)
- **Update Frequency**: Every 2 seconds during run mode
- **Business Value**: Medium-term revenue performance

## User Interface Specifications

### Dashboard Layout
- **Header Section**: Application title, admin link, logout button
- **Metrics Row**: 7 key metric cards in responsive grid
- **Charts Grid**: 3-column responsive grid for chart components
- **Responsive Design**: Adapts to desktop, tablet, and mobile viewports

### Admin Interface Layout
- **Control Panel**: Run/stop buttons, connection status, navigation
- **Connection Status**: Visual indicators for P21 and POR connectivity
- **Spreadsheet Grid**: Full-width editable data grid
- **Status Messages**: Error reporting and system status area

### Visual Design Standards
- **Color Scheme**: Professional blue and gray palette
- **Typography**: Clean, readable fonts with proper hierarchy
- **Icons**: Consistent iconography using Heroicons and Radix icons
- **Spacing**: Consistent padding and margins using Tailwind classes
- **Animations**: Subtle transitions and loading states

## Performance Requirements

### Response Time Targets
- **Dashboard Load**: < 3 seconds initial load
- **Data Refresh**: < 2 seconds per metric update
- **Admin Interface**: < 1 second for spreadsheet interactions
- **Database Queries**: < 5 seconds for complex queries

### Scalability Considerations
- **Data Volume**: Support for 1000+ data points
- **Concurrent Users**: Up to 50 simultaneous dashboard viewers
- **Query Frequency**: 2-second intervals sustainable long-term
- **Memory Usage**: < 512MB RAM under normal operation

### Reliability Requirements
- **Uptime Target**: 99.5% availability during business hours
- **Error Recovery**: Automatic retry for failed database connections
- **Data Consistency**: Ensure data integrity across all updates
- **Backup Strategy**: Daily configuration backups

## Security Requirements

### Data Protection
- **Encryption**: Environment variables encrypted at rest
- **Access Control**: Role-based access to admin functions
- **SQL Injection Prevention**: Parameterized queries only
- **Input Validation**: All user inputs validated and sanitized

### Network Security
- **Connection Security**: Windows Authentication for P21
- **File Access**: Secure network path access for POR
- **Port Management**: Fixed port configuration (5500)
- **Firewall Compatibility**: Works within corporate firewall rules

### Audit and Compliance
- **Activity Logging**: All admin actions logged
- **Change Tracking**: Configuration changes tracked with timestamps
- **User Sessions**: Session management with timeout
- **Data Access**: Read-only access to production databases

## Deployment and Operations

### Installation Requirements
1. **System Prerequisites**: Windows Server 2022, Node.js 16+
2. **ODBC Drivers**: SQL Server and Access drivers installed
3. **Network Access**: Connectivity to P21 and POR systems
4. **Environment Configuration**: .env.local file setup
5. **Port Configuration**: Port 5500 available and configured

### Startup Procedures
1. **Environment Validation**: Check all required environment variables
2. **Database Connectivity**: Test P21 and POR connections
3. **Service Startup**: Launch Next.js application on port 5500
4. **Health Checks**: Verify all systems operational
5. **Initial Data Load**: Populate dashboard with cached data

### Monitoring and Maintenance
- **Connection Health**: Continuous monitoring of database connections
- **Performance Metrics**: Track query execution times and response rates
- **Error Logging**: Comprehensive error logging and alerting
- **Data Validation**: Regular validation of data accuracy
- **System Updates**: Scheduled maintenance windows for updates

### Troubleshooting Procedures
1. **Connection Issues**: Step-by-step database connection troubleshooting
2. **Performance Problems**: Query optimization and system resource monitoring
3. **Data Discrepancies**: Data validation and reconciliation procedures
4. **Application Errors**: Error log analysis and resolution steps
5. **Recovery Procedures**: System recovery and data restoration processes

## Future Enhancements

### Planned Features
1. **Mobile Application**: Native mobile app for dashboard viewing
2. **Advanced Analytics**: Predictive analytics and trend analysis
3. **Custom Alerts**: Configurable threshold-based alerting
4. **Data Export**: Enhanced export capabilities (PDF, Excel)
5. **Multi-tenant Support**: Support for multiple company instances

### Technical Improvements
1. **Caching Layer**: Redis-based caching for improved performance
2. **API Optimization**: GraphQL API for more efficient data fetching
3. **Real-time Updates**: WebSocket-based real-time data streaming
4. **Advanced Security**: Multi-factor authentication and SSO integration
5. **Cloud Migration**: Azure/AWS deployment options

### Integration Opportunities
1. **ERP Systems**: Additional ERP system integrations
2. **CRM Integration**: Customer relationship management data
3. **Financial Systems**: Accounting and financial system integration
4. **Business Intelligence**: Integration with BI tools (Power BI, Tableau)
5. **API Ecosystem**: RESTful API for third-party integrations

## Success Metrics

### Business Metrics
- **Decision Speed**: 50% reduction in time to access critical business data
- **Data Accuracy**: 99%+ accuracy in reported metrics
- **User Adoption**: 90%+ of target users actively using the system
- **Operational Efficiency**: 25% reduction in manual data gathering time

### Technical Metrics
- **System Uptime**: 99.5% availability during business hours
- **Response Time**: < 3 seconds average dashboard load time
- **Error Rate**: < 1% query failure rate
- **Data Freshness**: < 2 minutes average data age

### User Satisfaction
- **Ease of Use**: User satisfaction score > 4.0/5.0
- **Feature Completeness**: 95% of user requirements met
- **Performance Satisfaction**: Response time satisfaction > 90%
- **Support Quality**: Issue resolution time < 4 hours average

## Conclusion

TallmanDashboard represents a comprehensive business intelligence solution that successfully integrates disparate data sources into a unified, real-time dashboard experience. The system's architecture provides the flexibility needed for ongoing business requirements while maintaining the performance and reliability expected in a production environment.

The combination of real-time data processing, intuitive user interfaces, and robust administrative controls makes this system well-suited for executive decision-making and operational monitoring. The technical architecture ensures scalability and maintainability while the security framework protects sensitive business data.

This specification serves as the foundation for ongoing development, maintenance, and enhancement of the TallmanDashboard system, ensuring that it continues to meet the evolving needs of the business while maintaining technical excellence and operational reliability.

---

**Document Version**: 1.0  
**Last Updated**: January 29, 2025  
**Document Owner**: Development Team  
**Review Cycle**: Quarterly
