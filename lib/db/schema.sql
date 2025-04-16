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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chart_data_timestamp ON chart_data(lastUpdated);
CREATE INDEX IF NOT EXISTS idx_chart_data_group_label ON chart_data(chartGroup, DataPoint);
