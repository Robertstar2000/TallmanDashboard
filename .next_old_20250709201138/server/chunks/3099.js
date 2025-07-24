"use strict";exports.id=3099,exports.ids=[3099],exports.modules={23099:(e,r,t)=>{let a;t.d(r,{DZ:()=>N,G5:()=>v,GY:()=>R,KV:()=>g,Nq:()=>D,_e:()=>x,cw:()=>f,executePORQueryServer:()=>A,gl:()=>O,kb:()=>y,pJ:()=>_,qu:()=>C,r4:()=>w,t0:()=>P,xh:()=>U});var s=t(85890),n=t.n(s),o=t(57147),l=t.n(o),i=t(71017),c=t.n(i),u=t(80437),d=t(6113),p=t.n(d),h=t(46715),E=t.n(h);let m=c().join(process.cwd(),"data","dashboard.db"),S=c().dirname(m);if(l().existsSync(S)||l().mkdirSync(S,{recursive:!0}),!process.env.ADODB_JS_CSCRIPT_PATH){let e=c().join(process.env.windir||"C:/Windows","System32","cscript.exe");process.env.ADODB_JS_CSCRIPT_PATH=e}let T=()=>{if(!a)try{(a=new(n())(m,{verbose:console.log})).pragma("journal_mode = WAL"),a.pragma("foreign_keys = ON"),function(e){let r=c().join(process.cwd(),"lib","db","schema.sql"),t=l().readFileSync(r,"utf8");try{e.exec(t)}catch(e){throw console.error("Error executing schema.sql:",e),e}}(a),console.log("Database connection established and schema ensured.")}catch(e){throw console.error("Failed to initialize the database:",e),e}return a};process.on("exit",()=>{a&&a.open&&(a.close(),console.log("Database connection closed."))}),process.on("SIGINT",()=>{a&&a.open&&(a.close(),console.log("Database connection closed due to app termination.")),process.exit(0)}),T();let g=()=>{let e=T();try{console.log("[getAllChartData] Preparing to execute SELECT * FROM chart_data");let r=e.prepare("SELECT * FROM chart_data ORDER BY id ASC"),t=r.all();return t}catch(e){throw console.error("Error fetching all chart data:",e),e}},v=()=>g(),y=(e,r)=>{let t=T();try{let a=t.prepare("UPDATE chart_data SET value = ?, lastUpdated = CURRENT_TIMESTAMP WHERE rowId = ?"),s=a.run(r,e);return s.changes>0}catch(r){return console.error(`Error updating value for rowId ${e}:`,r),!1}},f=e=>{let r=T();try{return r.transaction(()=>{let t=r.prepare("DELETE FROM chart_data");t.run();let a=r.prepare(`
        INSERT INTO chart_data (
          id, rowId, chartGroup, variableName, DataPoint, chartName, 
          serverName, tableName, productionSqlExpression, value, 
          lastUpdated, calculationType, axisStep, error
        ) VALUES (
          @id, @rowId, @chartGroup, @variableName, @DataPoint, @chartName, 
          @serverName, @tableName, @productionSqlExpression, @value, 
          CURRENT_TIMESTAMP, @calculationType, @axisStep, @error
        )
      `);for(let r of e)a.run({...r,id:p().randomUUID(),lastUpdated:new Date().toISOString()})})(),!0}catch(e){return console.error("Error replacing all chart data:",e),!1}},N=e=>{let r=T();try{let t=r.prepare(`
      UPDATE chart_data 
      SET 
        chartGroup = @chartGroup, 
        variableName = @variableName, 
        DataPoint = @DataPoint, 
        chartName = @chartName,
        serverName = @serverName, 
        tableName = @tableName, 
        productionSqlExpression = @productionSqlExpression, 
        value = @value,
        calculationType = @calculationType, 
        axisStep = @axisStep,
        error = @error,
        lastUpdated = CURRENT_TIMESTAMP
      WHERE rowId = @rowId
    `),a=r.transaction(e=>{let r=0;for(let a of e){let e=t.run({chartGroup:a.chartGroup,variableName:a.variableName,DataPoint:a.DataPoint,chartName:a.chartName,serverName:a.serverName,tableName:a.tableName,productionSqlExpression:a.productionSqlExpression,value:a.value,calculationType:a.calculationType,axisStep:a.axisStep,rowId:a.rowId});r+=e.changes}return r});console.log(`Starting transaction to update ${e.length} rows in chart_data...`);let s=a(e);return console.log(`Successfully updated chart_data. Total changes: ${s}`),s>0||0===e.length}catch(e){return console.error("Error updating spreadsheet data in chart_data:",e),!1}},_=()=>{let e=T();try{e.exec(`
      CREATE TABLE IF NOT EXISTS admin_variables (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        value TEXT,
        description TEXT,
        type TEXT CHECK(type IN ('P21', 'POR', 'LOCAL', 'Other')) DEFAULT 'Other',
        is_active INTEGER DEFAULT 1, 
        last_updated TEXT
      );
    `);let r=e.prepare("SELECT id, name, type, value, description, is_active, last_updated FROM admin_variables"),t=r.all(),a=t.map(e=>({id:String(e.id),name:String(e.name),type:["P21","POR","LOCAL","Other"].includes(e.type)?e.type:"Other",value:null!==e.value?String(e.value):null,description:null!==e.description?String(e.description):null,isActive:!!e.is_active,lastUpdated:null!==e.last_updated?String(e.last_updated):null}));return console.log(`Server: Fetched ${a.length} rows from admin_variables.`),a}catch(e){return console.error("Server: Failed to get admin variables:",e),[]}},P=(e,r)=>{let t=T(),a=Object.keys(r).filter(e=>"id"!==e&&"lastUpdated"!==e);if(0===a.length)return console.warn("No fields provided to update for admin variable ID:",e),!1;let s=[],n=[],o={name:"name",type:"type",value:"value",description:"description",isActive:"is_active"};for(let e in r){let t=o[e];t&&void 0!==r[e]&&(s.push(`${t} = ?`),"isActive"===e?n.push(r[e]?1:0):n.push(r[e]))}if(s.push("last_updated = CURRENT_TIMESTAMP"),s.length<=1)return console.warn("Server: updateAdminVariable called with no valid fields to update."),!1;n.push(e);let l=`UPDATE admin_variables SET ${s.join(", ")} WHERE id = ?`;try{let r=t.prepare(l),a=r.run(n);return console.log(`Server: Admin variable ${e} update result: ${a.changes} changes.`),a.changes>0}catch(r){return console.error(`Server: Failed to update admin variable ${e}:`,r),!1}};(()=>{let e=c().join(process.cwd(),"lib","db","types.ts");if(!l().existsSync(e)){let r=`
export interface ChartDataRow {
  id: number;
  rowId: string; 
  chartGroup: string; 
  chartName: string;
  variableName: string; 
  DataPoint: string; 
  serverName: 'P21' | 'POR';
  tableName: string | null;
  productionSqlExpression: string | null;
  value: number | null;
  lastUpdated: string | null;
  calculationType: 'SUM' | 'AVG' | 'COUNT' | 'LATEST' | null; 
  axisStep: string;
}

export interface SpreadsheetRow {
  
}

export interface ConnectionConfig {
  serverType: 'P21' | 'POR';
  serverAddress: string;
  databaseName: string;
  userName?: string; 
  password?: string; 
  // Add other relevant connection parameters like port, options, etc.
}
`;l().writeFileSync(e,r,"utf8"),console.log("Created placeholder lib/db/types.ts")}})();let R=e=>{let r=T();try{let t=r.prepare("SELECT * FROM users WHERE email = ?"),a=t.get(e.toLowerCase());return a||null}catch(r){return console.error(`Error finding user by email ${e}:`,r),null}},b=e=>{let r=T();try{let t=r.prepare("SELECT * FROM users WHERE id = ?"),a=t.get(e);return a||null}catch(r){return console.error(`Error finding user by id ${e}:`,r),null}},w=e=>{let r=T(),t=p().randomUUID(),a=e.password?E().hashSync(e.password,10):null,s=r.prepare(`
    INSERT INTO users (id, email, password, name, status, role, is_ldap_user, failed_login_attempts, lock_until, last_login, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);try{return s.run(t,e.email.toLowerCase(),a,e.name,e.status||"active",e.role||"user",e.isLdapUser||!1,0,null,null),b(t)}catch(r){return console.error("Error creating user:",r),r instanceof Error&&r.message.includes("UNIQUE constraint failed: users.email")&&console.error(`User creation failed: email ${e.email} already exists.`),null}},D=(e,r)=>{let t=T(),a=[],s=[];for(let[e,t]of Object.entries(r))"id"!==e&&"created_at"!==e&&"updated_at"!==e&&("password"===e&&"string"==typeof t?(a.push("password = ?"),s.push(E().hashSync(t,10))):"email"===e&&"string"==typeof t?(a.push("email = ?"),s.push(t.toLowerCase())):"isLdapUser"===e?(a.push("is_ldap_user = ?"),s.push(t?1:0)):(a.push(`${e} = ?`),s.push(t)));if(0===a.length)return console.warn("No valid fields provided for user update."),!1;a.push("updated_at = CURRENT_TIMESTAMP");let n=`UPDATE users SET ${a.join(", ")} WHERE id = ?`;s.push(e);try{let e=t.prepare(n),r=e.run(...s);return r.changes>0}catch(r){return console.error(`Error updating user ${e}:`,r),!1}};async function O(e){let r=Date.now();try{let a;let s=process.env.P21_DSN;if(!s)return{success:!1,error:"P21_DSN environment variable is not set."};let n=(await Promise.resolve().then(t.t.bind(t,10757,23))).default??await Promise.resolve().then(t.t.bind(t,10757,23));try{a=await n.connect(`DSN=${s}`);let t=await a.query(e),o=t.length>0?Object.keys(t[0]):[];return{success:!0,data:t,columns:o,executionTime:Date.now()-r}}finally{a&&await a.close()}}catch(e){return{success:!1,error:e.message}}}async function A(e,r,t){let a=Date.now();try{if(!l().existsSync(e))return{success:!1,error:`POR file not found: ${e}`};let s=/select\s+([\w*]+)\s+from\s+(\w+)/i.exec(t.trim());if(!s)return{success:!1,error:"Unsupported SQL for POR reader"};let[,n,o]=s,i=l().readFileSync(e),c=new u.Z(i,{password:r}),d=c.getTable(o);if(!d)return{success:!1,error:`Table ${o} not found in POR`};let p=d.getData(),h=d.getColumnNames(),E="*"===n?-1:h.indexOf(n),m=p.map(e=>Array.isArray(e)?-1===E?e:e[E]:"*"===n?e:e[n]);return{success:!0,data:m,columns:h,executionTime:Date.now()-a}}catch(e){return{success:!1,error:e.message}}}async function x(e){try{let r,a;let s=e&&e.dsn||process.env.P21_DSN,n=e.server||process.env.P21_SERVER,o=e.database||process.env.P21_DATABASE;if(s)r=`DSN=${s};`;else{if(!n||!o)return{success:!1,message:"Missing DSN or server/database details for P21 connection."};r=`Driver={ODBC Driver 17 for SQL Server};Server=${n};Database=${o};Trusted_Connection=Yes;`}let l=(await Promise.resolve().then(t.t.bind(t,10757,23))).default??await Promise.resolve().then(t.t.bind(t,10757,23));try{return a=await l.connect(r),await a.query("SELECT 1"),{success:!0,message:"Successfully connected to P21."}}finally{a&&await a.close()}}catch(e){return console.error("[testP21ConnectionServer] Error:",e),{success:!1,message:e.message}}}async function C(e){try{let r=e.filePath||process.env.POR_PATH,t=e.password||process.env.POR_DB_PASSWORD;if(!r)return{success:!1,message:"filePath is required for POR connection test (set POR_PATH in .env)."};if(!l().existsSync(r))return{success:!1,message:`File not found: ${r}`};let a=new u.Z(l().readFileSync(r),{password:t}),s=a.getTableNames();return{success:!0,message:`Successfully opened POR DB. Tables found: ${s.length}`}}catch(e){return console.error("[testPORConnectionServer] Error:",e),{success:!1,message:e.message}}}let U=e=>{let r=T();try{let t=r.prepare("DELETE FROM users WHERE LOWER(email) = LOWER(?)"),a=t.run(e);return a.changes>0}catch(r){return console.error(`Error deleting user ${e}:`,r),!1}}}};