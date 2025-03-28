-- POR Overview Admin Integration SQL
-- Generated: 3/14/2025, 8:03:10 PM

-- Create a backup of the current admin_variables table
CREATE TABLE IF NOT EXISTS admin_variables_backup AS SELECT * FROM admin_variables;

-- Insert POR Overview rows

-- New Rentals March '25
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  6919,
  'New Rentals March '25',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals March '25',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #3/1/2025# 
                          AND [Date] <= #3/31/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #2/1/2025# 
                          AND [Date] <= #2/28/2025#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals February '25
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  5323,
  'New Rentals February '25',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals February '25',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #2/1/2025# 
                          AND [Date] <= #2/28/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #1/1/2025# 
                          AND [Date] <= #1/31/2025#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals January '25
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  7065,
  'New Rentals January '25',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals January '25',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #1/1/2025# 
                          AND [Date] <= #1/31/2025#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #12/1/2024# 
                          AND [Date] <= #12/31/2024#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals December '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  3017,
  'New Rentals December '24',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals December '24',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #12/1/2024# 
                          AND [Date] <= #12/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #11/1/2024# 
                          AND [Date] <= #11/30/2024#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals November '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  9036,
  'New Rentals November '24',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals November '24',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #11/1/2024# 
                          AND [Date] <= #11/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #10/1/2024# 
                          AND [Date] <= #10/31/2024#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals October '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  8266,
  'New Rentals October '24',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals October '24',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #10/1/2024# 
                          AND [Date] <= #10/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #9/1/2024# 
                          AND [Date] <= #9/30/2024#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals September '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  3037,
  'New Rentals September '24',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals September '24',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #9/1/2024# 
                          AND [Date] <= #9/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #8/1/2024# 
                          AND [Date] <= #8/31/2024#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals August '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  792,
  'New Rentals August '24',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals August '24',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #8/1/2024# 
                          AND [Date] <= #8/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #7/1/2024# 
                          AND [Date] <= #7/31/2024#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals July '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  2882,
  'New Rentals July '24',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals July '24',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #7/1/2024# 
                          AND [Date] <= #7/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #6/1/2024# 
                          AND [Date] <= #6/30/2024#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals June '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  8112,
  'New Rentals June '24',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals June '24',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #6/1/2024# 
                          AND [Date] <= #6/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #5/1/2024# 
                          AND [Date] <= #5/31/2024#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals May '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  607,
  'New Rentals May '24',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals May '24',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #5/1/2024# 
                          AND [Date] <= #5/31/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #4/1/2024# 
                          AND [Date] <= #4/30/2024#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- New Rentals April '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  7025,
  'New Rentals April '24',
  '6747',
  'POR',
  'POR Overview',
  'New Rentals April '24',
  'POR',
  '(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #4/1/2024# 
                          AND [Date] <= #4/30/2024#) - (SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= #3/1/2024# 
                          AND [Date] <= #3/31/2024#
                          AND [Status] <> ''Closed'')',
  'PurchaseOrder'
);

-- Open Rentals March '25
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  3524,
  'Open Rentals March '25',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals March '25',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #3/1/2025# 
                AND [Date] <= #3/31/2025#',
  'PurchaseOrder'
);

-- Open Rentals February '25
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  2133,
  'Open Rentals February '25',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals February '25',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #2/1/2025# 
                AND [Date] <= #2/28/2025#',
  'PurchaseOrder'
);

-- Open Rentals January '25
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  8869,
  'Open Rentals January '25',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals January '25',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #1/1/2025# 
                AND [Date] <= #1/31/2025#',
  'PurchaseOrder'
);

-- Open Rentals December '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  9626,
  'Open Rentals December '24',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals December '24',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #12/1/2024# 
                AND [Date] <= #12/31/2024#',
  'PurchaseOrder'
);

-- Open Rentals November '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  4702,
  'Open Rentals November '24',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals November '24',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #11/1/2024# 
                AND [Date] <= #11/30/2024#',
  'PurchaseOrder'
);

-- Open Rentals October '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  4661,
  'Open Rentals October '24',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals October '24',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #10/1/2024# 
                AND [Date] <= #10/31/2024#',
  'PurchaseOrder'
);

-- Open Rentals September '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  7230,
  'Open Rentals September '24',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals September '24',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #9/1/2024# 
                AND [Date] <= #9/30/2024#',
  'PurchaseOrder'
);

-- Open Rentals August '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  576,
  'Open Rentals August '24',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals August '24',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #8/1/2024# 
                AND [Date] <= #8/31/2024#',
  'PurchaseOrder'
);

-- Open Rentals July '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  5872,
  'Open Rentals July '24',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals July '24',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #7/1/2024# 
                AND [Date] <= #7/31/2024#',
  'PurchaseOrder'
);

-- Open Rentals June '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  7325,
  'Open Rentals June '24',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals June '24',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #6/1/2024# 
                AND [Date] <= #6/30/2024#',
  'PurchaseOrder'
);

-- Open Rentals May '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  7483,
  'Open Rentals May '24',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals May '24',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #5/1/2024# 
                AND [Date] <= #5/31/2024#',
  'PurchaseOrder'
);

-- Open Rentals April '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  3847,
  'Open Rentals April '24',
  '6747',
  'POR',
  'POR Overview',
  'Open Rentals April '24',
  'POR',
  'SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= #4/1/2024# 
                AND [Date] <= #4/30/2024#',
  'PurchaseOrder'
);

-- Rental Value March '25
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  8019,
  'Rental Value March '25',
  '0',
  'POR',
  'POR Overview',
  'Rental Value March '25',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #3/1/2025# 
                AND [Date] <= #3/31/2025#',
  'PurchaseOrder'
);

-- Rental Value February '25
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  645,
  'Rental Value February '25',
  '0',
  'POR',
  'POR Overview',
  'Rental Value February '25',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #2/1/2025# 
                AND [Date] <= #2/28/2025#',
  'PurchaseOrder'
);

-- Rental Value January '25
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  3715,
  'Rental Value January '25',
  '0',
  'POR',
  'POR Overview',
  'Rental Value January '25',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #1/1/2025# 
                AND [Date] <= #1/31/2025#',
  'PurchaseOrder'
);

-- Rental Value December '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  8511,
  'Rental Value December '24',
  '0',
  'POR',
  'POR Overview',
  'Rental Value December '24',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #12/1/2024# 
                AND [Date] <= #12/31/2024#',
  'PurchaseOrder'
);

-- Rental Value November '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  4768,
  'Rental Value November '24',
  '0',
  'POR',
  'POR Overview',
  'Rental Value November '24',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #11/1/2024# 
                AND [Date] <= #11/30/2024#',
  'PurchaseOrder'
);

-- Rental Value October '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  337,
  'Rental Value October '24',
  '0',
  'POR',
  'POR Overview',
  'Rental Value October '24',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #10/1/2024# 
                AND [Date] <= #10/31/2024#',
  'PurchaseOrder'
);

-- Rental Value September '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  1925,
  'Rental Value September '24',
  '0',
  'POR',
  'POR Overview',
  'Rental Value September '24',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #9/1/2024# 
                AND [Date] <= #9/30/2024#',
  'PurchaseOrder'
);

-- Rental Value August '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  7261,
  'Rental Value August '24',
  '0',
  'POR',
  'POR Overview',
  'Rental Value August '24',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #8/1/2024# 
                AND [Date] <= #8/31/2024#',
  'PurchaseOrder'
);

-- Rental Value July '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  9476,
  'Rental Value July '24',
  '0',
  'POR',
  'POR Overview',
  'Rental Value July '24',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #7/1/2024# 
                AND [Date] <= #7/31/2024#',
  'PurchaseOrder'
);

-- Rental Value June '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  9393,
  'Rental Value June '24',
  '0',
  'POR',
  'POR Overview',
  'Rental Value June '24',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #6/1/2024# 
                AND [Date] <= #6/30/2024#',
  'PurchaseOrder'
);

-- Rental Value May '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  2613,
  'Rental Value May '24',
  '0',
  'POR',
  'POR Overview',
  'Rental Value May '24',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #5/1/2024# 
                AND [Date] <= #5/31/2024#',
  'PurchaseOrder'
);

-- Rental Value April '24
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  2315,
  'Rental Value April '24',
  '0',
  'POR',
  'POR Overview',
  'Rental Value April '24',
  'POR',
  'SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= #4/1/2024# 
                AND [Date] <= #4/30/2024#',
  'PurchaseOrder'
);
