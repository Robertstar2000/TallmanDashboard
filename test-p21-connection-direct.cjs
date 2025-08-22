// CommonJS direct ODBC connectivity test for P21
const odbc = require('odbc');

(async () => {
  const dsn = process.env.P21_DSN || 'P21Live';
  const connStr = `DSN=${dsn};Trusted_Connection=Yes;`;

  console.log('=== TESTING P21 DATABASE CONNECTION DIRECTLY (ODBC) ===');
  console.log(`Using DSN: ${dsn}`);
  console.log(`Connection String: ${connStr}`);

  try {
    console.log('\n1) Connecting via ODBC...');
    const connection = await odbc.connect(connStr);
    console.log('✅ Connected');

    console.log('\n2) SELECT 1 sanity check...');
    const ping = await connection.query('SELECT 1 AS test_value');
    console.log('✅ Ping OK:', ping);

    console.log('\n3) Listing a few user tables (sys.tables)...');
    const tables = await connection.query("SELECT TOP 5 name FROM sys.tables ORDER BY name ASC");
    console.log('✅ sys.tables sample:', tables);

    // Optional: Try a known P21 table if present. Non-fatal if it fails.
    try {
      console.log('\n4) Trying sample data query (first available table from sys.tables)...');
      const first = tables[0]?.name;
      if (first) {
        const sample = await connection.query(`SELECT TOP 1 * FROM [dbo].[${first}]`);
        console.log(`✅ Sample row from ${first}:`, sample[0] || {});
      } else {
        console.log('⚠️ No user tables returned to sample');
      }
    } catch (e) {
      console.log('⚠️ Sample table query error (non-fatal):', e.message || e);
    }

    await connection.close();
    console.log('\n✅ All direct ODBC tests completed');
  } catch (error) {
    console.error('\n❌ P21 ODBC connection failed:', error?.message || error);
    console.error('Full error object:', error);
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('- Confirm the DSN exists in Windows ODBC: 64-bit ODBC Data Sources > System DSN');
    console.log('- Try another DSN name by setting P21_DSN environment variable (e.g., P21Play)');
    console.log('- Verify SQL Server is reachable and Windows authentication is allowed');
    console.log('- Ensure firewall and network connectivity are open to the SQL Server host');
  }
})();
