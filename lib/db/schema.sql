-- Base schema for the Tallman Dashboard local SQLite database

PRAGMA foreign_keys = ON;

-- Admin variables to store connection strings, API keys, etc.
CREATE TABLE IF NOT EXISTS admin_variables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    server TEXT, -- Indicates P21, POR, or LOCAL/Internal
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_sql_expression BOOLEAN DEFAULT FALSE, -- Flag if 'value' holds SQL
    sql_expression TEXT -- Store the actual SQL expression if needed
);

-- Table to store the results of dashboard queries
CREATE TABLE IF NOT EXISTS chart_data (
    id TEXT PRIMARY KEY,                 -- Auto-generated UUID
    rowId TEXT UNIQUE NOT NULL,          -- From single-source-data.ts
    chartGroup TEXT NOT NULL,            -- Group the data belongs to (e.g., AR Aging)
    variableName TEXT NOT NULL,          -- Name of the variable being tracked
    DataPoint TEXT NOT NULL,             -- Full description of the data point
    chartName TEXT,                      -- Name of the chart this data belongs to
    serverName TEXT NOT NULL,            -- P21 or POR
    tableName TEXT,                      -- Source table name
    productionSqlExpression TEXT,        -- SQL query to get the value
    value REAL,                          -- The numeric result of the query
    lastUpdated DATETIME,                -- When the data was last updated
    calculationType TEXT,                -- SUM, AVG, COUNT, or LATEST
    axisStep TEXT,                       -- Position on chart axis
    error TEXT                           -- Any error message during fetch
);

-- Optional: Add other table schemas if needed (e.g., for storing historical trends, user settings, etc.)

-- Example: Table for storing raw results if needed (consider size implications)
-- CREATE TABLE IF NOT EXISTS raw_query_results (
--     result_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     admin_variable_id TEXT,
--     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
--     raw_data TEXT, -- Store as JSON string or similar
--     FOREIGN KEY (admin_variable_id) REFERENCES admin_variables(id)
-- );

-- User authentication table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Using TEXT for UUIDs is common, or INTEGER for auto-increment
    email TEXT UNIQUE NOT NULL,
    password TEXT, -- Can be NULL for LDAP users not using local fallback, or if password is not yet set
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending_verification', 'locked')),
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    is_ldap_user BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER DEFAULT 0,
    lock_until TEXT, -- ISO8601 date string (YYYY-MM-DD HH:MM:SS.SSS) or NULL
    last_login TEXT, -- ISO8601 date string or NULL
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, -- SQLite will store as TEXT in YYYY-MM-DD HH:MM:SS format
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update 'updated_at' timestamp on user update
CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Indexes for users table for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);


-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chart_data_timestamp ON chart_data(lastUpdated);
CREATE INDEX IF NOT EXISTS idx_chart_data_group_label ON chart_data(chartGroup, DataPoint);
