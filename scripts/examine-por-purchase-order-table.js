/**
 * Examine POR Purchase Order Table
 * 
 * This script examines the structure of the PurchaseOrder table in the POR database
 * to identify the correct field names for total amounts.
 */

const fs = require('fs');
const path = require('path');
const { default: MDBReader } = require('mdb-reader');

// Default POR database file path
const POR_FILE_PATH = process.env.POR_ACCESS_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';

async function examinePurchaseOrderTable() {
  console.log(`Examining PurchaseOrder table in database at: ${POR_FILE_PATH}`);
  
  try {
    // Check if the file exists
    if (!fs.existsSync(POR_FILE_PATH)) {
      console.error(`Error: File not found at path: ${POR_FILE_PATH}`);
      return;
    }
    
    // Read the database file
    console.log('Reading database file...');
    const buffer = fs.readFileSync(POR_FILE_PATH);
    const reader = new MDBReader(buffer);
    
    // Get the PurchaseOrder table
    const poTable = reader.getTable('PurchaseOrder');
    const columns = poTable.getColumnNames();
    const rowCount = poTable.rowCount;
    
    console.log(`\nPurchaseOrder Table Structure:`);
    console.log(`Total rows: ${rowCount}`);
    console.log(`Columns (${columns.length}):`);
    
    // Display all columns
    columns.forEach((column, index) => {
      console.log(`${index + 1}. ${column}`);
    });
    
    // Look for amount/total related columns
    const amountColumns = columns.filter(col => 
      col.toLowerCase().includes('total') || 
      col.toLowerCase().includes('amount') || 
      col.toLowerCase().includes('price') ||
      col.toLowerCase().includes('cost')
    );
    
    console.log(`\nPotential amount columns: ${amountColumns.join(', ')}`);
    
    // Get sample data
    console.log('\nSample data (first 5 rows):');
    const rows = poTable.getData(0, 5);
    
    // Display sample rows with focus on key fields
    const keyFields = ['PONumber', 'Date', 'Status', 'VendorNumber', 'VendorName', ...amountColumns];
    
    rows.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      keyFields.forEach(field => {
        if (columns.includes(field)) {
          console.log(`  ${field}: ${row[field] !== undefined && row[field] !== null ? row[field] : 'null'}`);
        }
      });
    });
    
    // Analyze non-zero values in amount columns
    console.log('\nAnalyzing amount columns for non-zero values:');
    
    const nonZeroAnalysis = {};
    amountColumns.forEach(column => {
      nonZeroAnalysis[column] = {
        nonZeroCount: 0,
        sum: 0,
        min: null,
        max: null
      };
    });
    
    // Get all rows for analysis
    const allRows = poTable.getData();
    
    allRows.forEach(row => {
      amountColumns.forEach(column => {
        const value = parseFloat(row[column] || 0);
        if (value !== 0) {
          nonZeroAnalysis[column].nonZeroCount++;
          nonZeroAnalysis[column].sum += value;
          
          if (nonZeroAnalysis[column].min === null || value < nonZeroAnalysis[column].min) {
            nonZeroAnalysis[column].min = value;
          }
          
          if (nonZeroAnalysis[column].max === null || value > nonZeroAnalysis[column].max) {
            nonZeroAnalysis[column].max = value;
          }
        }
      });
    });
    
    // Display analysis results
    Object.entries(nonZeroAnalysis).forEach(([column, analysis]) => {
      console.log(`${column}: ${analysis.nonZeroCount} non-zero values, Sum: ${analysis.sum.toFixed(2)}, Min: ${analysis.min !== null ? analysis.min.toFixed(2) : 'N/A'}, Max: ${analysis.max !== null ? analysis.max.toFixed(2) : 'N/A'}`);
    });
    
    // Recommend the best column for total amount
    const bestColumn = Object.entries(nonZeroAnalysis)
      .filter(([_, analysis]) => analysis.nonZeroCount > 0)
      .sort(([_, a], [__, b]) => b.nonZeroCount - a.nonZeroCount)[0];
    
    if (bestColumn) {
      console.log(`\nRecommended column for total amount: ${bestColumn[0]} (${bestColumn[1].nonZeroCount} non-zero values)`);
    } else {
      console.log('\nNo suitable column found for total amount');
    }
    
    // Save the analysis to a file
    const analysisResult = {
      tableName: 'PurchaseOrder',
      rowCount,
      columns,
      amountColumns,
      nonZeroAnalysis,
      recommendedColumn: bestColumn ? bestColumn[0] : null
    };
    
    fs.writeFileSync('por-purchase-order-analysis.json', JSON.stringify(analysisResult, null, 2));
    console.log('\nSaved analysis to por-purchase-order-analysis.json');
    
    return analysisResult;
  } catch (error) {
    console.error('Error examining PurchaseOrder table:', error.message);
  }
}

// Run the examination
examinePurchaseOrderTable().catch(error => {
  console.error('Unhandled error:', error.message);
});
