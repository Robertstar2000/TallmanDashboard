// Script to validate SQL expression fixes and test value generation
const path = require('path');
const sqlite3 = require('better-sqlite3');
const fs = require('fs');

// Initialize the database connections
const dashboardDbPath = path.join(process.cwd(), 'data', 'dashboard.db');
const testDbPath = path.join(process.cwd(), 'data', 'test.db');

console.log(`Dashboard DB path: ${dashboardDbPath}`);
console.log(`Test DB path: ${testDbPath}`);

// Function to validate SQL expressions in the dashboard database
function validateSqlExpressions() {
  console.log('\n=== Validating SQL Expressions ===');
  const db = sqlite3(dashboardDbPath);
  
  try {
    // Check if both sql_expression and production_sql_expression columns exist
    const columns = db.prepare("PRAGMA table_info(chart_data)").all();
    const hasSqlExpr = columns.some(col => col.name === 'sql_expression');
    const hasProdSqlExpr = columns.some(col => col.name === 'production_sql_expression');
    
    console.log(`SQL Expression column exists: ${hasSqlExpr}`);
    console.log(`Production SQL Expression column exists: ${hasProdSqlExpr}`);
    
    if (!hasSqlExpr || !hasProdSqlExpr) {
      console.error('Error: One or both SQL expression columns are missing');
      return false;
    }
    
    // Count rows with missing SQL expressions
    const missingTestSql = db.prepare("SELECT COUNT(*) as count FROM chart_data WHERE sql_expression IS NULL OR sql_expression = ''").get().count;
    const missingProdSql = db.prepare("SELECT COUNT(*) as count FROM chart_data WHERE production_sql_expression IS NULL OR production_sql_expression = ''").get().count;
    
    console.log(`Rows with missing test SQL: ${missingTestSql}`);
    console.log(`Rows with missing production SQL: ${missingProdSql}`);
    
    if (missingTestSql > 0 || missingProdSql > 0) {
      console.warn('Warning: Some rows have missing SQL expressions');
    }
    
    return true;
  } catch (error) {
    console.error('Error validating SQL expressions:', error);
    return false;
  } finally {
    db.close();
  }
}

// Function to validate test data mapping
function validateTestDataMapping() {
  console.log('\n=== Validating Test Data Mapping ===');
  const db = sqlite3(dashboardDbPath);
  
  try {
    // Check if test_data_mapping table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test_data_mapping'").get();
    
    console.log(`Test data mapping table exists: ${!!tableExists}`);
    
    if (!tableExists) {
      console.error('Error: test_data_mapping table does not exist');
      return false;
    }
    
    // Count rows in test_data_mapping
    const mappingCount = db.prepare("SELECT COUNT(*) as count FROM test_data_mapping").get().count;
    const chartDataCount = db.prepare("SELECT COUNT(*) as count FROM chart_data").get().count;
    
    console.log(`Test data mappings: ${mappingCount}`);
    console.log(`Chart data rows: ${chartDataCount}`);
    
    if (mappingCount < chartDataCount) {
      console.warn(`Warning: Not all chart data rows have test data mappings (${mappingCount}/${chartDataCount})`);
    }
    
    // Sample test data mappings
    const samples = db.prepare("SELECT id, test_value FROM test_data_mapping LIMIT 5").all();
    console.log('Sample test data mappings:');
    samples.forEach(sample => {
      console.log(`- Row ${sample.id}: ${sample.test_value}`);
    });
    
    return true;
  } catch (error) {
    console.error('Error validating test data mapping:', error);
    return false;
  } finally {
    db.close();
  }
}

// Function to validate server_configs table
function validateServerConfigs() {
  console.log('\n=== Validating Server Configs ===');
  const db = sqlite3(dashboardDbPath);
  
  try {
    // Check if server_configs table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='server_configs'").get();
    
    console.log(`Server configs table exists: ${!!tableExists}`);
    
    if (!tableExists) {
      console.error('Error: server_configs table does not exist');
      return false;
    }
    
    // Check if server column exists
    const columns = db.prepare("PRAGMA table_info(server_configs)").all();
    const hasServerColumn = columns.some(col => col.name === 'server');
    
    console.log(`Server column exists: ${hasServerColumn}`);
    
    if (!hasServerColumn) {
      console.error('Error: server column does not exist in server_configs table');
      return false;
    }
    
    // Get server configs
    const configs = db.prepare("SELECT id, server, server_name FROM server_configs").all();
    console.log('Server configs:');
    configs.forEach(config => {
      console.log(`- ${config.id}: ${config.server} (${config.server_name})`);
    });
    
    return true;
  } catch (error) {
    console.error('Error validating server configs:', error);
    return false;
  } finally {
    db.close();
  }
}

// Function to simulate query execution in test mode
function simulateTestQuery(rowId) {
  console.log(`\n=== Simulating Test Query for Row ${rowId} ===`);
  const dashboardDb = sqlite3(dashboardDbPath);
  const testDb = sqlite3(testDbPath);
  
  try {
    // Get the row from chart_data
    const row = dashboardDb.prepare("SELECT id, chart_name, variable_name, server_name, sql_expression FROM chart_data WHERE id = ?").get(rowId);
    
    if (!row) {
      console.error(`Error: Row ${rowId} not found in chart_data table`);
      return false;
    }
    
    console.log(`Row details: ${row.chart_name} - ${row.variable_name} (${row.server_name})`);
    console.log(`SQL Expression: ${row.sql_expression || 'MISSING'}`);
    
    if (!row.sql_expression) {
      console.error('Error: No SQL expression available for this row');
      return false;
    }
    
    // Check if test_data_mapping table exists in test database
    const tableExists = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test_data_mapping'").get();
    
    if (!tableExists) {
      console.warn('Warning: test_data_mapping table does not exist in test database');
    } else {
      // Get the test value from the mapping table
      const mapping = testDb.prepare("SELECT test_value FROM test_data_mapping WHERE id = ?").get(rowId);
      
      if (mapping && mapping.test_value) {
        console.log(`Found test value for row ${rowId}: ${mapping.test_value}`);
        return true;
      } else {
        console.warn(`Warning: No test value mapping found for row ${rowId}`);
      }
    }
    
    // Get the test value from the dashboard database
    const dashboardMapping = dashboardDb.prepare("SELECT test_value FROM test_data_mapping WHERE id = ?").get(rowId);
    
    if (dashboardMapping && dashboardMapping.test_value) {
      console.log(`Found test value in dashboard database for row ${rowId}: ${dashboardMapping.test_value}`);
      return true;
    }
    
    console.warn(`Warning: No test value found for row ${rowId} in either database`);
    return false;
  } catch (error) {
    console.error(`Error simulating test query for row ${rowId}:`, error);
    return false;
  } finally {
    dashboardDb.close();
    testDb.close();
  }
}

// Main validation function
async function validateFixes() {
  console.log('Starting validation of SQL expression fixes...');
  
  try {
    // Validate SQL expressions
    const sqlExpressionsValid = validateSqlExpressions();
    
    // Validate test data mapping
    const testDataMappingValid = validateTestDataMapping();
    
    // Validate server configs
    const serverConfigsValid = validateServerConfigs();
    
    // Simulate test queries for a few rows
    const testQueries = [
      simulateTestQuery('1'),
      simulateTestQuery('10'),
      simulateTestQuery('20')
    ];
    
    // Summary
    console.log('\n=== Validation Summary ===');
    console.log(`SQL Expressions: ${sqlExpressionsValid ? 'VALID' : 'INVALID'}`);
    console.log(`Test Data Mapping: ${testDataMappingValid ? 'VALID' : 'INVALID'}`);
    console.log(`Server Configs: ${serverConfigsValid ? 'VALID' : 'INVALID'}`);
    console.log(`Test Queries: ${testQueries.every(Boolean) ? 'VALID' : 'PARTIALLY VALID'}`);
    
    const overallStatus = sqlExpressionsValid && testDataMappingValid && serverConfigsValid;
    console.log(`\nOverall Status: ${overallStatus ? 'VALID' : 'NEEDS ATTENTION'}`);
    
    if (!overallStatus) {
      console.log('\nRecommendations:');
      if (!sqlExpressionsValid) console.log('- Fix missing SQL expressions in chart_data table');
      if (!testDataMappingValid) console.log('- Ensure all rows have test data mappings');
      if (!serverConfigsValid) console.log('- Fix server_configs table structure');
    }
  } catch (error) {
    console.error('Error during validation:', error);
  }
}

// Run the validation
validateFixes().catch(console.error);
