SELECT 
    t.name AS TableName,
    s.name AS SchemaName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM 
    sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN sys.columns c ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE 
    t.name IN ('ar_open_items','Rentals','default_table','historical_data','oe_hdr','site_data') OR
    t.name LIKE '%hdr%' OR
    t.name LIKE '%line%' OR
    t.name LIKE '%mast%' OR
    t.name LIKE '%item%'
ORDER BY 
    t.name, c.column_id
