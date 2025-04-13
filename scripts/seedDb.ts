import Database from 'better-sqlite3';
import { singleSourceData } from '../lib/db/single-source-data';
import type { SourceDataDefinition } from '../lib/db/single-source-data';
import type { ChartDataRow } from '../lib/db/types';

// Path to your SQLite database file
const dbPath = './data/dashboard.db'; // Correct path used by the application

// Function to seed the database
async function seedDatabase() {
  console.log(`Connecting to database at: ${dbPath}`);
  const db = new Database(dbPath); // No need for { verbose: console.log } in production seeding

  // Define the table schema
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS chart_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT, -- Standard auto-incrementing primary key
        rowId TEXT UNIQUE,                   -- From source data, should be unique
        chartGroup TEXT NOT NULL,
        variableName TEXT,                   -- Seems optional in some source data? Nullable.
        DataPoint TEXT NOT NULL,
        serverName TEXT NOT NULL,
        tableName TEXT,                      -- Seems optional? Nullable.
        productionSqlExpression TEXT,        -- Nullable?
        calculationType TEXT,                -- Nullable?
        chartName TEXT NOT NULL,
        axisStep TEXT NOT NULL,
        value REAL,                          -- Using REAL for potential floating point numbers
        lastUpdated TEXT                     -- Store as ISO8601 string
    );
  `;

  try {
    // Ensure the table exists
    console.log('Ensuring chart_data table exists...');
    db.exec(createTableSql);
    console.log('Table schema ensured.');

    console.log('Preparing to seed chart_data table...');

    // Start a transaction for efficiency and atomicity
    db.exec('BEGIN TRANSACTION;');

    // Clear existing data from the chart_data table
    console.log('Clearing existing data from chart_data...');
    const deleteStmt = db.prepare('DELETE FROM chart_data');
    const deleteInfo = deleteStmt.run();
    console.log(`Deleted ${deleteInfo.changes} rows.`);

    // Prepare the insert statement
    // Assuming chart_data table has columns: id (PK, auto-increment), chartGroup, variableName, DataPoint, serverName, tableName, productionSqlExpression, calculationType, chartName, axisStep, value, lastUpdated
    // We need to map SourceDataDefinition to ChartDataRow structure for insertion
    const insertStmt = db.prepare(`
      INSERT INTO chart_data (
        rowId,
        chartGroup,
        variableName,
        DataPoint,
        serverName,
        tableName,
        productionSqlExpression,
        calculationType,
        chartName,
        axisStep,
        value, 
        lastUpdated
      ) VALUES (
        @rowId,
        @chartGroup,
        @variableName,
        @DataPoint,
        @serverName,
        @tableName,
        @productionSqlExpression,
        @calculationType,
        @chartName,
        @axisStep,
        @value,
        @lastUpdated
      )
    `);

    console.log(`Preparing to insert ${singleSourceData.length} rows...`);
    let insertedCount = 0;
    const now = new Date().toISOString();

    // Insert data from singleSourceData
    for (const sourceRow of singleSourceData) {
      // Type assertion to ensure compatibility, though properties should match
      const rowToInsert = sourceRow as unknown as ChartDataRow; 
      
      // Set default/initial values for dynamic fields
      rowToInsert.value = 1; // Set initial value to 1 for testing visibility
      rowToInsert.lastUpdated = now;
      
      // Ensure rowId is handled correctly (assuming it maps directly)
      // If 'id' is the PK and auto-increment, we don't provide it.
      // If 'rowId' from source data maps to a specific column (like 'rowId'), include it.

      // Bind parameters (safer than string interpolation)
      const result = insertStmt.run({
        rowId: sourceRow.rowId, // Assuming rowId from source maps to db rowId
        chartGroup: sourceRow.chartGroup,
        variableName: sourceRow.variableName,
        DataPoint: sourceRow.DataPoint,
        serverName: sourceRow.serverName,
        tableName: sourceRow.tableName,
        productionSqlExpression: sourceRow.productionSqlExpression,
        calculationType: sourceRow.calculationType,
        chartName: sourceRow.chartName,
        axisStep: sourceRow.axisStep,
        value: rowToInsert.value, // Use the assigned null/0 value
        lastUpdated: rowToInsert.lastUpdated // Use the assigned timestamp
      });

      if (result.changes > 0) {
        insertedCount++;
      }
    }

    // Commit the transaction
    db.exec('COMMIT;');
    console.log(`Successfully inserted ${insertedCount} rows into chart_data.`);

  } catch (error) {
    // Rollback transaction in case of error
    db.exec('ROLLBACK;');
    console.error('Error seeding database:', error);
    process.exit(1); // Exit with error code
  } finally {
    // Close the database connection
    db.close();
    console.log('Database connection closed.');
  }
}

// Run the seeding function
seedDatabase().catch((error) => {
  console.error('Unhandled error during seeding:', error);
  process.exit(1);
});
