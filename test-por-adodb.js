const ADODB = require('node-adodb');

const POR_FILE_PATH = '\\\\ts03\\POR\\POR.MDB';

console.log('Testing POR database with node-adodb...');
console.log('File path:', POR_FILE_PATH);

async function testPORConnection() {
    try {
        // Initialize ADODB connection
        const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${POR_FILE_PATH};`);
        console.log('✅ ADODB connection created');
        
        // Test simple query
        console.log('\n🧪 Testing simple query: SELECT 1 as test');
        try {
            const result1 = await connection.query('SELECT 1 as test');
            console.log('✅ Simple query result:', result1);
        } catch (error) {
            console.error('❌ Simple query failed:', error.message);
        }
        
        // Test table listing
        console.log('\n📋 Testing table listing...');
        try {
            const tables = await connection.query(`
                SELECT Name 
                FROM MSysObjects 
                WHERE Type=1 AND Flags=0 AND Name NOT LIKE 'MSys*'
                ORDER BY Name
            `);
            console.log('✅ Tables found:', tables.length);
            tables.slice(0, 10).forEach((table, index) => {
                console.log(`  ${index + 1}. ${table.Name}`);
            });
            if (tables.length > 10) {
                console.log(`  ... and ${tables.length - 10} more tables`);
            }
            
            // Test sample data from first table
            if (tables.length > 0) {
                const firstTable = tables[0].Name;
                console.log(`\n🔍 Testing sample data from table: ${firstTable}`);
                try {
                    const sampleData = await connection.query(`SELECT TOP 3 * FROM [${firstTable}]`);
                    console.log(`✅ Sample data (${sampleData.length} rows):`, JSON.stringify(sampleData, null, 2));
                } catch (error) {
                    console.error(`❌ Error reading from ${firstTable}:`, error.message);
                }
            }
            
        } catch (error) {
            console.error('❌ Table listing failed:', error.message);
        }
        
        // Close connection
        await connection.close();
        console.log('✅ Connection closed successfully');
        
    } catch (error) {
        console.error('❌ ADODB connection failed:', error.message);
        console.error('Full error:', error);
    }
}

testPORConnection();
