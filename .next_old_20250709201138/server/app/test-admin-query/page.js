(()=>{var e={};e.id=5810,e.ids=[5810],e.modules={55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},25528:e=>{"use strict";e.exports=require("next/dist\\client\\components\\action-async-storage.external.js")},91877:e=>{"use strict";e.exports=require("next/dist\\client\\components\\request-async-storage.external.js")},25319:e=>{"use strict";e.exports=require("next/dist\\client\\components\\static-generation-async-storage.external.js")},84197:(e,a,s)=>{"use strict";s.r(a),s.d(a,{GlobalError:()=>n.a,__next_app__:()=>h,originalPathname:()=>m,pages:()=>u,routeModule:()=>E,tree:()=>d});var t=s(73137),r=s(54647),l=s(4183),n=s.n(l),i=s(71775),o={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>i[e]);s.d(a,o);let c=t.AppPageRouteModule,d=["",{children:["test-admin-query",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,71380)),"C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard_new\\app\\test-admin-query\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2996)),"C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard_new\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,51918,23)),"next/dist/client/components/not-found-error"]}],u=["C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard_new\\app\\test-admin-query\\page.tsx"],m="/test-admin-query/page",h={require:s,loadChunk:()=>Promise.resolve()},E=new c({definition:{kind:r.x.APP_PAGE,page:"/test-admin-query/page",pathname:"/test-admin-query",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},4906:(e,a,s)=>{Promise.resolve().then(s.bind(s,275))},275:(e,a,s)=>{"use strict";s.r(a),s.d(a,{default:()=>S});var t=s(60080),r=s(9885),l=s(97118),n=s(68191),i=s(37028),o=s(53577),c=s(40181),d=s(64046),u=s(81305),m=s(63211),h=s(60717),E=s(51707),p=s(65676),x=s(11440),b=s.n(x);function S(){let[e,a]=(0,r.useState)("P21"),[s,x]=(0,r.useState)("sy_param"),[S,C]=(0,r.useState)("SELECT DB_NAME() as db_name"),[T,y]=(0,r.useState)(null),[v,g]=(0,r.useState)(!1),[j,R]=(0,r.useState)(null),[O,N]=(0,r.useState)("unknown"),[_,Z]=(0,r.useState)(null),[L,P]=(0,r.useState)(null),[A,M]=(0,r.useState)(null),[D,B]=(0,r.useState)(!0),[f,I]=(0,r.useState)("SQL01"),[F,k]=(0,r.useState)("P21Play"),[w,H]=(0,r.useState)(!1),[W,Q]=(0,r.useState)(""),[q,z]=(0,r.useState)(""),[U,Y]=(0,r.useState)("P21Play"),[V,G]=(0,r.useState)("C:\\Users\\BobM\\Desktop\\POR.MDB"),[$,J]=(0,r.useState)("SELECT * FROM PO_HDR LIMIT 10"),[K,X]=(0,r.useState)(null),[ee,ea]=(0,r.useState)(!1),[es,et]=(0,r.useState)(null),[er,el]=(0,r.useState)(null),[en,ei]=(0,r.useState)("");(0,r.useEffect)(()=>{},[]);let eo=async()=>{g(!0),R(null),y(null),Z(null);try{console.log(`Testing connection to ${e} server`);let a={};"P21"===e?a=D?{server:f,database:F||"P21Play",trustedConnection:!0}:{dsn:U||"P21Play",database:F||"P21Play",trustedConnection:!0}:"POR"===e&&(a={filePath:V||process.env.POR_FILE_PATH||"C:\\POR\\PORENT.mdb"});let s=await fetch("/api/testConnection",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({server:e,config:a})}),t=await s.json();if(console.log("Connection test response:",t),t.success)N(`Connected to ${e} server successfully`);else throw Error(t.message||"Connection test failed")}catch(e){console.error("Error testing connection:",e),R(`Error: ${e.message}`)}finally{g(!1)}},ec=async()=>{g(!0),R(null),y(null),Z(null),P(null),X(null),el(null),et(null);try{P(S),console.log(`Executing query on ${e} server:`,S);let a={};"P21"===e?(a=D?{server:f,database:F||"P21Play",username:w?W:"",password:w?q:"",trustedConnection:!w}:{dsn:U||"P21Play",database:F||"P21Play",username:w?W:"",password:w?q:"",trustedConnection:!w},console.log("Using P21 config:",{...a,password:a.password?"***":void 0,authentication:w?"SQL Server Authentication":"Windows Authentication (trusted connection)"})):"POR"===e&&(a={filePath:V||process.env.POR_FILE_PATH||"C:\\POR\\PORENT.mdb"},console.log("Using POR config:",a));let s=await fetch("/api/admin/run-query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sqlQuery:S,targetDatabase:e,porFilePath:V})}),t=await s.json();if(Z(t),console.log("Query response:",t),t.success)t.data&&Array.isArray(t.data)?(console.log("Setting result with array data:",t.data),y(t.data)):void 0!==t.value?(console.log("Setting result with single value:",t.value),y([{value:t.value}])):(console.log("No data in response:",t),y([]));else throw Error(t.error||"Query execution failed")}catch(e){console.error("Error executing query:",e),R(`Query error: ${e.message}`),Z(a=>({...a,success:!1,error:e.message,errorType:"TypeError"===e.name?"connection":"execution"}))}finally{g(!1)}},ed=async()=>{ea(!0),et(null),X(null),el(null),y(null),Z(null),R(null),P(null);try{if(console.log("Executing POR MDB query:",$),!V)throw Error("Please provide a POR MDB file path");let e=await fetch("/api/admin/run-query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sqlQuery:$,targetDatabase:"POR",porFilePath:V})}),a=await e.json();if(el(a),console.log("POR MDB Query response:",a),a.success)a.data&&Array.isArray(a.data)?(console.log("Setting POR MDB result with array data:",a.data),X(a.data)):X([a]);else throw Error(a.message||a.error||"Query failed")}catch(e){console.error("Error executing POR MDB query:",e),et(`Error: ${e.message}`),el(a=>({...a,success:!1,error:e.message,errorType:"TypeError"===e.name?"connection":"execution"}))}finally{ea(!1)}};return(0,t.jsxs)("div",{className:"container mx-auto p-4",children:[(0,t.jsxs)(l.Z,{display:"flex",justifyContent:"space-between",alignItems:"center",mb:4,children:[t.jsx(n.Z,{variant:"h4",children:"Admin Query Test Tool"}),(0,t.jsxs)(l.Z,{display:"flex",gap:2,children:[t.jsx(b(),{href:"/TestScripts/test-all-por-sql",children:t.jsx(i.Z,{variant:"contained",color:"secondary",children:"POR SQL Test Tool"})}),t.jsx(b(),{href:"/admin",children:t.jsx(i.Z,{variant:"contained",color:"primary",children:"Return to Admin"})})]})]}),(0,t.jsxs)(o.Z,{elevation:3,className:"p-4 mb-4",children:[(0,t.jsxs)(l.Z,{mb:3,children:[(0,t.jsxs)(c.Z,{fullWidth:!0,variant:"outlined",className:"mb-4",children:[t.jsx(d.Z,{children:"Server Type"}),(0,t.jsxs)(u.Z,{value:e,onChange:e=>a(e.target.value),label:"Server Type",children:[t.jsx(m.Z,{value:"P21",children:"P21"}),t.jsx(m.Z,{value:"POR",children:"POR"})]})]}),t.jsx(c.Z,{fullWidth:!0,variant:"outlined",className:"mb-4",children:t.jsx(h.Z,{label:"Table Name",variant:"outlined",value:s,onChange:e=>x(e.target.value),placeholder:"Enter table name (optional)",fullWidth:!0,margin:"normal"})}),"P21"===e&&(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(c.Z,{fullWidth:!0,variant:"outlined",className:"mb-4",children:[t.jsx(d.Z,{id:"direct-connection-label",children:"Use Direct Connection"}),(0,t.jsxs)(u.Z,{labelId:"direct-connection-label",value:D?"true":"false",onChange:e=>B("true"===e.target.value),label:"Use Direct Connection",children:[t.jsx(m.Z,{value:"true",children:"Yes"}),t.jsx(m.Z,{value:"false",children:"No"})]})]}),!D&&(0,t.jsxs)(l.Z,{className:"p-4 border border-gray-300 rounded mb-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"ODBC Connection Details"}),t.jsx(h.Z,{label:"DSN Name",variant:"outlined",value:U,onChange:e=>Y(e.target.value),placeholder:"Enter DSN name",fullWidth:!0,margin:"normal"}),t.jsx(h.Z,{label:"Database Name",variant:"outlined",value:F,onChange:e=>k(e.target.value),placeholder:"Enter database name (e.g., P21)",fullWidth:!0,margin:"normal"}),(0,t.jsxs)(c.Z,{fullWidth:!0,variant:"outlined",className:"mb-4 mt-4",children:[t.jsx(d.Z,{id:"sql-auth-label",children:"Use SQL Server Authentication"}),(0,t.jsxs)(u.Z,{labelId:"sql-auth-label",value:w?"true":"false",onChange:e=>H("true"===e.target.value),label:"Use SQL Server Authentication",children:[t.jsx(m.Z,{value:"true",children:"Yes"}),t.jsx(m.Z,{value:"false",children:"No (Use Windows Authentication)"})]})]}),w&&(0,t.jsxs)(t.Fragment,{children:[t.jsx(h.Z,{label:"Username",variant:"outlined",value:W,onChange:e=>Q(e.target.value),placeholder:"Enter SQL Server username",fullWidth:!0,margin:"normal"}),t.jsx(h.Z,{label:"Password",variant:"outlined",value:q,onChange:e=>z(e.target.value),placeholder:"Enter SQL Server password",fullWidth:!0,margin:"normal",type:"password"})]})]}),D&&(0,t.jsxs)(l.Z,{className:"p-4 border border-gray-300 rounded mb-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"Direct Connection Details"}),t.jsx(h.Z,{label:"Server",variant:"outlined",value:f,onChange:e=>I(e.target.value),placeholder:"Enter server",fullWidth:!0,margin:"normal"}),t.jsx(h.Z,{label:"Database",variant:"outlined",value:F,onChange:e=>k(e.target.value),placeholder:"Enter database",fullWidth:!0,margin:"normal"}),(0,t.jsxs)(c.Z,{fullWidth:!0,variant:"outlined",className:"mb-4 mt-4",children:[t.jsx(d.Z,{id:"sql-auth-label",children:"Use SQL Server Authentication"}),(0,t.jsxs)(u.Z,{labelId:"sql-auth-label",value:w?"true":"false",onChange:e=>H("true"===e.target.value),label:"Use SQL Server Authentication",children:[t.jsx(m.Z,{value:"true",children:"Yes"}),t.jsx(m.Z,{value:"false",children:"No (Use Windows Authentication)"})]})]}),w&&(0,t.jsxs)(t.Fragment,{children:[t.jsx(h.Z,{label:"Username",variant:"outlined",value:W,onChange:e=>Q(e.target.value),placeholder:"Enter SQL Server username",fullWidth:!0,margin:"normal"}),t.jsx(h.Z,{label:"Password",variant:"outlined",value:q,onChange:e=>z(e.target.value),placeholder:"Enter SQL Server password",fullWidth:!0,margin:"normal",type:"password"})]})]})]}),"P21"!==e&&t.jsx(c.Z,{fullWidth:!0,variant:"outlined",className:"mb-4",children:t.jsx(h.Z,{label:"File Path",variant:"outlined",value:V,onChange:e=>G(e.target.value),placeholder:"Enter file path",fullWidth:!0,margin:"normal"})}),t.jsx(i.Z,{variant:"contained",color:"secondary",onClick:eo,disabled:v,className:"mb-4",children:v?t.jsx(E.Z,{size:24}):"Test Connection"}),O&&"unknown"!==O&&t.jsx(p.Z,{severity:O.includes("successful")?"success":"error",className:"mb-4",children:O}),j&&t.jsx(p.Z,{severity:"error",className:"mb-4",children:j})]}),t.jsx(h.Z,{label:"SQL Query",variant:"outlined",value:S,onChange:e=>C(e.target.value),placeholder:"Enter your SQL query",fullWidth:!0,multiline:!0,rows:4,margin:"normal"}),(0,t.jsxs)(l.Z,{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2,children:[t.jsx(i.Z,{variant:"contained",color:"primary",onClick:ec,disabled:v||!S,className:"mr-2",children:v?t.jsx(E.Z,{size:24}):"Execute Query"}),t.jsx(i.Z,{variant:"outlined",color:"primary",onClick:()=>{S.includes("P21.dbo.")?C(S.replace("P21.dbo.","")):S.includes("dbo.")?C(S.replace("dbo.","")):C(S.replace(/FROM\s+([^\s]+)/i,"FROM dbo.$1"))},disabled:v||!S,children:"Try Alternative Query"})]}),"P21"===e&&(0,t.jsxs)(l.Z,{className:"mt-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"Diagnostic Queries"}),(0,t.jsxs)(l.Z,{display:"flex",flexWrap:"wrap",gap:2,children:[t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT @@VERSION as version"),ec()},children:"Check SQL Version"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT DB_NAME() as database_name"),ec()},children:"Check Database Name"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT TOP 20 name, type_desc FROM sys.objects WHERE type_desc IN ('USER_TABLE', 'VIEW') ORDER BY name"),ec()},children:"List Tables"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT name, schema_id, type_desc FROM sys.objects WHERE name LIKE '%param%' OR name LIKE '%hdr%'"),ec()},children:"Find Similar Tables"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT name FROM sys.schemas"),ec()},children:"List Schemas"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT OBJECT_ID('sy_param') as sy_param_exists, OBJECT_ID('oe_hdr') as oe_hdr_exists"),ec()},children:"Check Key Tables"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT TOP 5 * FROM INFORMATION_SCHEMA.TABLES"),ec()},children:"Check Schema Info"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT name, database_id, create_date FROM sys.databases"),ec()},children:"List Databases"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT DB_NAME() as current_db, (SELECT COUNT(*) FROM sys.objects WHERE type_desc = 'USER_TABLE') as table_count"),ec()},children:"DB Info"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT name, database_id, create_date FROM sys.databases"),ec()},children:"List Databases"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT TOP 20 s.name as schema_name, t.name as table_name FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id ORDER BY s.name, t.name"),ec()},children:"Tables with Schemas"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT 1 AS test"),ec()},children:"Simple Test Query"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT @@VERSION AS version"),ec()},children:"Get SQL Version"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C("SELECT DB_NAME() AS current_database"),ec()},children:"Current Database"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C(`
-- Query system_parameters table
SELECT TOP 20 * FROM system_parameters
                  `),ec()},children:"Query System Parameters"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C(`
-- Query sys_params_p21 table
SELECT TOP 20 * FROM sys_params_p21
                  `),ec()},children:"Query P21 Sys Params"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C(`
DECLARE @sql NVARCHAR(MAX) = '';
DECLARE @dbname NVARCHAR(128);

-- Create a temp table to hold results
CREATE TABLE #Results (
    DatabaseName NVARCHAR(128),
    TableName NVARCHAR(128),
    SchemaName NVARCHAR(128)
);

-- Get all databases
DECLARE db_cursor CURSOR FOR 
SELECT name FROM sys.databases 
WHERE state_desc = 'ONLINE' 
AND name NOT IN ('master', 'tempdb', 'model', 'msdb')
ORDER BY name;

OPEN db_cursor;
FETCH NEXT FROM db_cursor INTO @dbname;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Build dynamic SQL to search each database
    SET @sql = '
    USE [' + @dbname + '];
    INSERT INTO #Results
    SELECT 
        ''' + @dbname + ''' AS DatabaseName,
        t.name AS TableName,
        SCHEMA_NAME(t.schema_id) AS SchemaName
    FROM sys.tables t
    WHERE t.name LIKE ''%param%'' OR t.name LIKE ''%hdr%''
    ';
    
    -- Execute the dynamic SQL
    BEGIN TRY
        EXEC sp_executesql @sql;
    END TRY
    BEGIN CATCH
        -- Ignore errors and continue
    END CATCH
    
    FETCH NEXT FROM db_cursor INTO @dbname;
END

CLOSE db_cursor;
DEALLOCATE db_cursor;

-- Return the results
SELECT * FROM #Results ORDER BY DatabaseName, SchemaName, TableName;

-- Clean up
DROP TABLE #Results;
                  `),ec()},children:"Search P21 Tables Across DBs"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C(`
-- Try a simpler query that works with more limited permissions
SELECT 
  DB_NAME() as current_database,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE') as table_count,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%PARAM%') as param_tables,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%HDR%') as hdr_tables
                  `),ec()},children:"Basic DB Info"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C(`
-- List tables using INFORMATION_SCHEMA which has broader permissions
SELECT 
  TABLE_SCHEMA as schema_name,
  TABLE_NAME as table_name,
  TABLE_TYPE as table_type
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME
                  `),ec()},children:"List Tables (Alt Method)"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C(`
-- List all databases on the server
SELECT name FROM master.sys.databases
WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
ORDER BY name
                  `),ec()},children:"List User Databases"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C(`
-- Try a direct query to master database
SELECT name, database_id, create_date, state_desc
FROM master.sys.databases
ORDER BY name
                  `),ec()},children:"List All Databases"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C(`
-- Try to switch to master database first
USE master;
SELECT name, database_id, create_date, state_desc
FROM sys.databases
ORDER BY name
                  `),ec()},children:"Use Master DB"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{C(`
-- Comprehensive P21 Database Diagnostics
-- Step 1: Get SQL Server Version
SELECT @@VERSION as SQLServerVersion;

-- Step 2: Check Current Database
SELECT DB_NAME() as CurrentDatabase;

-- Step 3: Try to switch to P21Play database
USE P21Play;
SELECT DB_NAME() as SwitchedToDatabase;

-- Step 4: Check if system_parameters table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'system_parameters')
    THEN 'system_parameters table exists'
    ELSE 'system_parameters table DOES NOT exist'
  END as SystemParametersCheck;

-- Step 5: Check if sys_params_p21 table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'sys_params_p21')
    THEN 'sys_params_p21 table exists'
    ELSE 'sys_params_p21 table DOES NOT exist'
  END as SysParamsP21Check;

-- Step 6: Sample data from system_parameters
SELECT TOP 5 * FROM system_parameters;
                  `),ec()},children:"Run Full Diagnostics"})]})]})]}),(0,t.jsxs)(o.Z,{elevation:3,className:"p-4 mb-4",children:[t.jsx(n.Z,{variant:"h5",gutterBottom:!0,children:"POR MDB Query Testing (mdb-reader)"}),t.jsx(l.Z,{mb:3,children:t.jsx(n.Z,{variant:"body2",gutterBottom:!0,children:"This section tests POR queries using the mdb-reader module, connecting directly to the MS Access database."})}),(0,t.jsxs)(l.Z,{mb:3,display:"flex",alignItems:"flex-start",children:[t.jsx(h.Z,{label:"POR MDB File Path",value:V,onChange:e=>{G(e.target.value),localStorage.setItem("por_file_path",e.target.value)},fullWidth:!0,margin:"normal",variant:"outlined",helperText:"Path to the POR MDB file (e.g., C:\\Users\\BobM\\Desktop\\POR.MDB)",style:{marginRight:"16px"}}),t.jsx(i.Z,{variant:"contained",color:"primary",onClick:()=>{G("C:\\Users\\BobM\\Desktop\\POR.MDB"),localStorage.setItem("por_file_path","C:\\Users\\BobM\\Desktop\\POR.MDB"),J("SHOW TABLES"),ed()},style:{marginTop:"16px",height:"56px"},children:"Connect to POR"})]}),t.jsx(l.Z,{mb:3,children:t.jsx(h.Z,{label:"POR MDB Query",value:$,onChange:e=>J(e.target.value),fullWidth:!0,multiline:!0,rows:4,margin:"normal",variant:"outlined",helperText:"Enter a query to execute against the POR MDB file (e.g., SELECT * FROM PO_HDR LIMIT 10, SHOW TABLES, DESCRIBE PO_HDR)"})}),t.jsx(l.Z,{mb:3,display:"flex",justifyContent:"flex-start",children:t.jsx(i.Z,{variant:"contained",color:"primary",onClick:ed,disabled:ee,style:{marginRight:"8px"},children:ee?t.jsx(E.Z,{size:24}):"Execute POR MDB Query"})}),(0,t.jsxs)(l.Z,{className:"mt-4 mb-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"POR MDB Diagnostic Queries"}),(0,t.jsxs)(l.Z,{display:"flex",flexWrap:"wrap",gap:2,children:[t.jsx(i.Z,{variant:"outlined",size:"small",color:"primary",onClick:()=>{J(`
                  -- Check POR database connection status
                  SHOW TABLES
                `),ed()},children:"Check Connection"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{J("SHOW TABLES"),ed()},children:"List Tables"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{J("SELECT * FROM PurchaseOrder"),ed()},children:"PurchaseOrder"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{J("SELECT * FROM PurchaseOrderDetail"),ed()},children:"PurchaseOrderDetail"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{J("SELECT * FROM CustomerFile_Tr_Bak"),ed()},children:"CustomerFile"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{J("SELECT * FROM Transactions"),ed()},children:"Transactions"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{J("SELECT * FROM TransactionItems"),ed()},children:"TransactionItems"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{J("SELECT * FROM ItemFile"),ed()},children:"ItemFile"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{J("SELECT * FROM MSysObjects WHERE Name LIKE '%Customer%' AND Type=1 AND Flags=0"),ed()},children:"Find Customer Tables"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{J("SELECT * FROM MSysObjects WHERE Name LIKE '%Transaction%' AND Type=1 AND Flags=0"),ed()},children:"Find Transaction Tables"}),t.jsx(i.Z,{variant:"outlined",size:"small",onClick:()=>{let e=prompt("Enter table name to describe:","PurchaseOrder");e&&(J(`DESCRIBE ${e}`),ed())},children:"Describe Table"}),(0,t.jsxs)(l.Z,{sx:{display:"flex",alignItems:"center",gap:1,mt:2,width:"100%"},children:[t.jsx(h.Z,{label:"Table Name",variant:"outlined",size:"small",value:en,onChange:e=>ei(e.target.value),sx:{flexGrow:1,maxWidth:200}}),t.jsx(i.Z,{variant:"contained",size:"small",onClick:()=>{en&&(J(`SELECT * FROM ${en}`),ed())},disabled:!en,children:"Query Table"})]})]})]}),es&&t.jsx(p.Z,{severity:"error",className:"mb-4",children:es}),er&&(0,t.jsxs)(o.Z,{elevation:3,className:"p-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"POR MDB Raw API Response"}),t.jsx("pre",{className:"bg-gray-100 p-2 rounded",children:JSON.stringify(er,null,2)})]}),er&&er.error&&(0,t.jsxs)(o.Z,{elevation:3,className:"p-4 mt-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"POR MDB Error Details"}),(0,t.jsxs)(p.Z,{severity:"error",className:"mb-2",children:[(0,t.jsxs)(n.Z,{variant:"subtitle1",children:[t.jsx("strong",{children:"Error Message:"})," ",er.error]}),er.errorType&&(0,t.jsxs)(n.Z,{variant:"subtitle2",children:[t.jsx("strong",{children:"Error Type:"})," ",er.errorType]})]})]}),K&&(0,t.jsxs)(o.Z,{elevation:3,className:"p-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"POR MDB Query Result"}),t.jsx("div",{className:"overflow-x-auto",children:(0,t.jsxs)("table",{className:"min-w-full bg-white border",children:[t.jsx("thead",{className:"bg-gray-100",children:t.jsx("tr",{children:K.length>0&&Object.keys(K[0]).map(e=>t.jsx("th",{className:"py-2 px-4 border",children:e},e))})}),t.jsx("tbody",{children:K.map((e,a)=>t.jsx("tr",{className:a%2==0?"bg-gray-50":"",children:Object.values(e).map((e,a)=>t.jsx("td",{className:"py-2 px-4 border",children:null===e?"NULL":"object"==typeof e?JSON.stringify(e):String(e)},a))},a))})]})})]})]}),L&&(0,t.jsxs)(o.Z,{elevation:3,className:"p-4 mb-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"Formatted Query"}),t.jsx("pre",{className:"bg-gray-100 p-2 rounded",children:L})]}),T&&(0,t.jsxs)(o.Z,{elevation:3,className:"p-4 mb-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"Query Result"}),t.jsx("pre",{className:"bg-gray-100 p-2 rounded",children:JSON.stringify(T,null,2)})]}),_&&(0,t.jsxs)(o.Z,{elevation:3,className:"p-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"Raw API Response"}),t.jsx("pre",{className:"bg-gray-100 p-2 rounded",children:JSON.stringify(_,null,2)})]}),_&&_.error&&(0,t.jsxs)(o.Z,{elevation:3,className:"p-4 mt-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"Error Details"}),(0,t.jsxs)(p.Z,{severity:"error",className:"mb-2",children:[(0,t.jsxs)(n.Z,{variant:"subtitle1",children:[t.jsx("strong",{children:"Error Message:"})," ",_.error]}),_.errorType&&(0,t.jsxs)(n.Z,{variant:"subtitle2",children:[t.jsx("strong",{children:"Error Type:"})," ",_.errorType]})]})]}),A&&(0,t.jsxs)(o.Z,{elevation:3,className:"p-4",children:[t.jsx(n.Z,{variant:"h6",gutterBottom:!0,children:"Connection Details"}),t.jsx("pre",{className:"bg-gray-100 p-2 rounded",children:A})]})]})}},71380:(e,a,s)=>{"use strict";s.r(a),s.d(a,{$$typeof:()=>n,__esModule:()=>l,default:()=>o});var t=s(17536);let r=(0,t.createProxy)(String.raw`C:\Users\BobM\CascadeProjects\TallmanDashboard_new\app\test-admin-query\page.tsx`),{__esModule:l,$$typeof:n}=r,i=r.default,o=i}};var a=require("../../webpack-runtime.js");a.C(e);var s=e=>a(a.s=e),t=a.X(0,[6545,1440,3956,1707,5481,5195,9593,5676,3211,9143],()=>s(84197));module.exports=t})();