SELECT 
    t.name AS TableName,
    s.name AS SchemaName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable,
    CASE 
        WHEN pk.column_id IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END AS IsPrimaryKey,
    CASE 
        WHEN fk.parent_column_id IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END AS IsForeignKey
FROM 
    sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN sys.columns c ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    LEFT JOIN (
        SELECT ic.object_id, ic.column_id
        FROM sys.index_columns ic
        INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        WHERE i.is_primary_key = 1
    ) pk ON t.object_id = pk.object_id AND c.column_id = pk.column_id
    LEFT JOIN sys.foreign_key_columns fk ON t.object_id = fk.parent_object_id AND c.column_id = fk.parent_column_id
ORDER BY 
    t.name, c.column_id
