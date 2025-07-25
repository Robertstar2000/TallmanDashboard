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

-- User management table for LDAP authentication and access control
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT,
    display_name TEXT,
    access_level TEXT NOT NULL CHECK (access_level IN ('user', 'admin', 'super_admin')) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    created_by TEXT,
    notes TEXT
);

-- Authentication log table for tracking login attempts
CREATE TABLE IF NOT EXISTS auth_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    auth_method TEXT NOT NULL, -- 'ldap', 'backdoor'
    success BOOLEAN NOT NULL,
    error_message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session management table
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY, -- session token
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    access_level TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chart_data_timestamp ON chart_data(lastUpdated);
CREATE INDEX IF NOT EXISTS idx_chart_data_group_label ON chart_data(chartGroup, DataPoint);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_auth_log_timestamp ON auth_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
