-- SQL script to verify P21 tables used in dashboard expressions
-- Run this script against your P21 database to check if these tables exist

-- Tables to verify
SELECT 
    t.name AS TableName,
    s.name AS SchemaName,
    OBJECT_DEFINITION(t.object_id) AS TableDefinition
FROM 
    sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE 
    t.name IN ('ar_open_items','Rentals','default_table','historical_data','oe_hdr','site_data') OR
    t.name LIKE '%hdr%' OR
    t.name LIKE '%line%' OR
    t.name LIKE '%mast%' OR
    t.name LIKE '%item%'
ORDER BY 
    t.name;

-- Table columns
SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable,
    CASE 
        WHEN pk.column_id IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END AS IsPrimaryKey
FROM 
    sys.tables t
    INNER JOIN sys.columns c ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    LEFT JOIN (
        SELECT ic.object_id, ic.column_id
        FROM sys.index_columns ic
        INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        WHERE i.is_primary_key = 1
    ) pk ON t.object_id = pk.object_id AND c.column_id = pk.column_id
WHERE 
    t.name IN ('ar_open_items','Rentals','default_table','historical_data','oe_hdr','site_data') OR
    t.name LIKE '%hdr%' OR
    t.name LIKE '%line%' OR
    t.name LIKE '%mast%' OR
    t.name LIKE '%item%'
ORDER BY 
    t.name, c.column_id;
