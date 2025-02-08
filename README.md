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