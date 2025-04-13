CREATE TABLE IF NOT EXISTS chart_data (
  id TEXT PRIMARY KEY,
  chart_name TEXT,
  variable_name TEXT,
  server_name TEXT,
  db_table_name TEXT,
  sql_expression TEXT,
  sql_expression TEXT,
  value TEXT,
  transformer TEXT,
  last_updated TEXT
)
