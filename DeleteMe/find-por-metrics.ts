import fs from 'fs';
import MDBReader from 'mdb-reader';

// Set the correct POR database path
const POR_DB_PATH = 'C:\\Users\\BobM\\Desktop\\POR.MDB';

/**
 * Main function to find relevant tables for POR metrics
 */
async function main() {
  console.log('Searching for relevant tables in POR database...');
  
  // Get the POR database path
  const porFilePath = process.env.POR_FILE_PATH || POR_DB_PATH;
  console.log(`Using POR database path: ${porFilePath}`);
  
  // Check if the file exists
  if (!fs.existsSync(porFilePath)) {
    console.error(`POR database file not found at path: ${porFilePath}`);
    process.exit(1);
  }
  
  try {
    // Read the database file
    const buffer = fs.readFileSync(porFilePath);
    const reader = new MDBReader(buffer);
    
    // Get table names
    const tableNames = reader.getTableNames();
    console.log(`Found ${tableNames.length} tables in the database`);
    
    // Metrics we're looking for
    const metrics = [
      { name: "Open Rentals", description: "Number of open rental contracts" },
      { name: "New Rentals", description: "Number of contracts this month" },
      { name: "Rental Value", description: "Total value of all open contracts" }
    ];
    
    // Tables that might contain rental information
    const rentalTables = tableNames.filter(table => 
      table.toLowerCase().includes('rent') || 
      table.toLowerCase().includes('contract') || 
      table.toLowerCase().includes('order') ||
      table.toLowerCase().includes('invoice') ||
      table.toLowerCase().includes('transaction')
    );
    
    console.log('\nPotential rental-related tables:');
    rentalTables.forEach(table => console.log(`- ${table}`));
    
    // Analyze each table for relevant columns
    const tableAnalysis = [];
    
    for (const tableName of rentalTables) {
      try {
        const table = reader.getTable(tableName);
        const columns = table.getColumnNames();
        const rows = table.getData();
        
        // Look for relevant columns
        const dateColumns = columns.filter(col => 
          col.toLowerCase().includes('date') || 
          col.toLowerCase().includes('time')
        );
        
        const statusColumns = columns.filter(col => 
          col.toLowerCase().includes('status') || 
          col.toLowerCase().includes('state') ||
          col.toLowerCase().includes('type')
        );
        
        const valueColumns = columns.filter(col => 
          col.toLowerCase().includes('value') || 
          col.toLowerCase().includes('amount') ||
          col.toLowerCase().includes('price') ||
          col.toLowerCase().includes('cost') ||
          col.toLowerCase().includes('total')
        );
        
        // Analyze the table for each metric
        const metricRelevance = [];
        
        for (const metric of metrics) {
          let relevance = 0;
          let relevanceReason = [];
          
          // Check for open rentals (status columns with open/active values)
          if (metric.name === "Open Rentals" && statusColumns.length > 0) {
            relevance += 1;
            relevanceReason.push("Has status columns");
            
            // Check if any rows have status values that might indicate "open"
            if (rows.length > 0) {
              for (const statusCol of statusColumns) {
                const statusIndex = columns.indexOf(statusCol);
                const statusValues = new Set();
                
                // Get unique status values
                for (let i = 0; i < Math.min(rows.length, 100); i++) {
                  const value = rows[i][statusIndex];
                  if (value) statusValues.add(String(value).toLowerCase());
                }
                
                // Check for open/active status values
                const openStatuses = Array.from(statusValues).filter(val => 
                  typeof val === 'string' && (
                    val.includes('open') || 
                    val.includes('active') || 
                    val.includes('current') ||
                    val.includes('out')
                  )
                );
                
                if (openStatuses.length > 0) {
                  relevance += 2;
                  relevanceReason.push(`Status column '${statusCol}' has values: ${openStatuses.join(', ')}`);
                }
              }
            }
          }
          
          // Check for new rentals (date columns for filtering by current month)
          if (metric.name === "New Rentals" && dateColumns.length > 0) {
            relevance += 2;
            relevanceReason.push(`Has date columns: ${dateColumns.join(', ')}`);
          }
          
          // Check for rental value (value columns for summing)
          if (metric.name === "Rental Value" && valueColumns.length > 0) {
            relevance += 2;
            relevanceReason.push(`Has value columns: ${valueColumns.join(', ')}`);
          }
          
          metricRelevance.push({
            metric: metric.name,
            relevance,
            reason: relevanceReason.join('; ')
          });
        }
        
        tableAnalysis.push({
          tableName,
          rowCount: rows.length,
          dateColumns,
          statusColumns,
          valueColumns,
          metricRelevance
        });
        
      } catch (error) {
        console.error(`Error analyzing table ${tableName}:`, error);
      }
    }
    
    // Sort tables by relevance for each metric
    console.log('\nRecommended tables for each metric:');
    
    for (const metric of metrics) {
      console.log(`\n${metric.name} (${metric.description}):`);
      
      // Sort tables by relevance for this metric
      const relevantTables = tableAnalysis
        .map(table => {
          const relevanceInfo = table.metricRelevance.find(r => r.metric === metric.name);
          return {
            tableName: table.tableName,
            relevance: relevanceInfo ? relevanceInfo.relevance : 0,
            reason: relevanceInfo ? relevanceInfo.reason : '',
            columns: metric.name === "Open Rentals" ? table.statusColumns :
                     metric.name === "New Rentals" ? table.dateColumns :
                     metric.name === "Rental Value" ? table.valueColumns : []
          };
        })
        .filter(table => table.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance);
      
      if (relevantTables.length > 0) {
        relevantTables.forEach((table, index) => {
          console.log(`${index + 1}. ${table.tableName} (Relevance: ${table.relevance})`);
          console.log(`   Reason: ${table.reason}`);
          console.log(`   Relevant columns: ${table.columns.join(', ')}`);
        });
      } else {
        console.log('No highly relevant tables found');
      }
    }
    
    // Generate example SQL queries for each metric
    console.log('\nExample SQL queries for POR metrics:');
    
    for (const metric of metrics) {
      console.log(`\n${metric.name} (${metric.description}):`);
      
      // Get the most relevant table for this metric
      const relevantTables = tableAnalysis
        .map(table => {
          const relevanceInfo = table.metricRelevance.find(r => r.metric === metric.name);
          return {
            table,
            relevance: relevanceInfo ? relevanceInfo.relevance : 0
          };
        })
        .filter(item => item.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance);
      
      if (relevantTables.length > 0) {
        const bestTable = relevantTables[0].table;
        
        if (metric.name === "Open Rentals") {
          // Find the best status column
          const statusColumn = bestTable.statusColumns[0] || 'Status';
          console.log(`SELECT Count(*) as value FROM ${bestTable.tableName} WHERE ${statusColumn} IN ('Open', 'Active', 'Out')`);
        } 
        else if (metric.name === "New Rentals") {
          // Find the best date column
          const dateColumn = bestTable.dateColumns[0] || 'CreatedDate';
          console.log(`SELECT Count(*) as value FROM ${bestTable.tableName} WHERE Month(${dateColumn}) = Month(Date()) AND Year(${dateColumn}) = Year(Date())`);
        }
        else if (metric.name === "Rental Value") {
          // Find the best value column
          const valueColumn = bestTable.valueColumns[0] || 'TotalAmount';
          const statusColumn = bestTable.statusColumns[0] || 'Status';
          console.log(`SELECT Sum(${valueColumn}) as value FROM ${bestTable.tableName} WHERE ${statusColumn} IN ('Open', 'Active', 'Out')`);
        }
      } else {
        console.log('No relevant tables found for generating a query');
      }
    }
    
  } catch (error) {
    console.error('Error analyzing POR database:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
