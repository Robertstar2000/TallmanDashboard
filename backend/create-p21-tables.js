import MCPController from './mcpControllerSDK.js';
import fs from 'fs';
import path from 'path';

async function createP21Tables() {
    const mcp = new MCPController();
    
    try {
        console.log('🔧 Creating P21 tables...');
        
        // Read the schema file
        const schemaPath = path.join(process.cwd(), '..', 'database-schemas', 'P21-schema.sql');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Extract individual CREATE TABLE statements
        const createStatements = schemaContent
            .split('GO')
            .filter(stmt => stmt.includes('CREATE TABLE'))
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        console.log(`📋 Found ${createStatements.length} CREATE TABLE statements`);
        
        // Execute each CREATE TABLE statement
        for (let i = 0; i < createStatements.length; i++) {
            const statement = createStatements[i];
            const tableName = statement.match(/CREATE TABLE \[dbo\]\.\[(\w+)\]/)?.[1];
            
            console.log(`\n${i + 1}. Creating table: ${tableName}`);
            
            try {
                const result = await mcp.executeQuery('P21', statement);
                console.log(`✅ Table ${tableName} created successfully`);
            } catch (error) {
                console.log(`⚠️ Table ${tableName}: ${error.message}`);
                // Continue with other tables even if one fails
            }
        }
        
        // Test that ar_invoices table exists
        console.log('\n🧪 Testing ar_invoices table...');
        const testResult = await mcp.executeQuery('P21', 'SELECT COUNT(*) as value FROM dbo.ar_invoices;');
        console.log(`✅ ar_invoices table accessible, count: ${testResult}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mcp.cleanup();
        process.exit(0);
    }
}

createP21Tables();
