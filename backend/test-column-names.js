const { MCPController } = require('./mcpControllerSDK.js');
const fs = require('fs');

async function testColumnNames() {
    const mcpController = new MCPController();
    
    try {
        // Load allData.json to get SQL expressions
        const allData = JSON.parse(fs.readFileSync('../allData.json', 'utf8'));
        
        console.log('Testing P21 SQL expressions for column name errors...\n');
        
        // Test a few representative queries from different chart groups
        const testQueries = [
            // AR_AGING query
            { id: 1, group: 'AR_AGING', sql: allData[0].productionSqlExpression },
            // DAILY_ORDERS query  
            { id: 66, group: 'DAILY_ORDERS', sql: allData.find(item => item.id === 66)?.productionSqlExpression },
            // CUSTOMER_METRICS query
            { id: 42, group: 'CUSTOMER_METRICS', sql: allData.find(item => item.id === 42)?.productionSqlExpression },
            // INVENTORY query
            { id: 109, group: 'INVENTORY', sql: allData.find(item => item.id === 109)?.productionSqlExpression },
            // KEY_METRICS query
            { id: 121, group: 'KEY_METRICS', sql: allData.find(item => item.id === 121)?.productionSqlExpression }
        ];
        
        const errors = [];
        
        for (const query of testQueries) {
            if (!query.sql) {
                console.log(`❌ Query ID ${query.id} (${query.group}): SQL not found`);
                continue;
            }
            
            console.log(`Testing Query ID ${query.id} (${query.group}):`);
            console.log(`SQL: ${query.sql}`);
            
            try {
                const result = await mcpController.executeQuery('P21', query.sql);
                console.log(`✅ Success: ${result}`);
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
                errors.push({
                    id: query.id,
                    group: query.group,
                    sql: query.sql,
                    error: error.message
                });
            }
            console.log('---');
        }
        
        if (errors.length > 0) {
            console.log('\n🔍 COLUMN NAME ERRORS DETECTED:');
            errors.forEach(err => {
                console.log(`\nQuery ID ${err.id} (${err.group}):`);
                console.log(`SQL: ${err.sql}`);
                console.log(`Error: ${err.error}`);
            });
            
            // Save errors to file for analysis
            fs.writeFileSync('column-errors.json', JSON.stringify(errors, null, 2));
            console.log('\n📁 Errors saved to column-errors.json');
        } else {
            console.log('\n✅ All test queries executed successfully!');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mcpController.cleanup();
    }
}

testColumnNames();
