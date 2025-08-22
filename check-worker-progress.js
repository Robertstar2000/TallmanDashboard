// Monitor background worker progress
import fs from 'fs';

function checkProgress() {
    console.log('🔍 Checking background worker progress...\n');
    
    try {
        const data = JSON.parse(fs.readFileSync('allData.json', 'utf8'));
        
        // Check for recent updates
        const recent = data.filter(item => item.lastUpdated.includes('2025-'));
        const processing = data.filter(item => item.status === 'processing');
        const completed = data.filter(item => item.status === 'completed');
        const errors = data.filter(item => item.value === 99999);
        
        console.log(`📊 Progress Summary:`);
        console.log(`   Total metrics: ${data.length}`);
        console.log(`   Recently updated (2025): ${recent.length}`);
        console.log(`   Currently processing: ${processing.length}`);
        console.log(`   Completed: ${completed.length}`);
        console.log(`   Errors (99999): ${errors.length}`);
        
        if (recent.length > 0) {
            console.log('\n✅ Recent updates found:');
            recent.slice(0, 5).forEach(item => {
                console.log(`   ${item.dataPoint}: ${item.value} (${item.lastUpdated})`);
            });
        }
        
        if (processing.length > 0) {
            console.log('\n⏳ Currently processing:');
            processing.slice(0, 3).forEach(item => {
                console.log(`   ${item.dataPoint} (${item.serverName})`);
            });
        }
        
        if (errors.length > 0) {
            console.log('\n❌ SQL Errors detected:');
            errors.slice(0, 3).forEach(item => {
                console.log(`   ${item.dataPoint}: ${item.productionSqlExpression.substring(0, 50)}...`);
            });
        }
        
    } catch (error) {
        console.log('❌ Error reading allData.json:', error.message);
    }
}

checkProgress();
