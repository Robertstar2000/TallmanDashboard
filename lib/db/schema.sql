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
    id TEXT PRIMARY KEY, -- Corresponds to the row ID from dashboardState
    value REAL,          -- The numeric result of the query
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- When the data was fetched
    error TEXT,          -- Any error message during fetch
    chart_group TEXT,    -- Group the data belongs to (e.g., AR Aging, Daily Orders)
    label TEXT           -- Specific label for the data point (e.g., '1-30 Days', 'Mon')
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chart_data_timestamp ON chart_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_chart_data_group_label ON chart_data(chart_group, label);
