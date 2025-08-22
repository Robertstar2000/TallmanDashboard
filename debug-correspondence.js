// Debug version of correspondence verification
const fs = require('fs');

try {
    console.log('=== DEBUGGING CORRESPONDENCE VERIFICATION ===\n');
    
    // Check if allData.json exists
    if (!fs.existsSync('allData.json')) {
        console.log('❌ allData.json not found!');
        process.exit(1);
    }
    
    console.log('✅ allData.json found');
    
    // Load and parse allData.json
    const allDataRaw = fs.readFileSync('allData.json', 'utf8');
    console.log(`📁 File size: ${allDataRaw.length} characters`);
    
    const allData = JSON.parse(allDataRaw);
    console.log(`📊 Total JSON entries: ${allData.length}`);
    
    // Basic validation
    if (!Array.isArray(allData)) {
        console.log('❌ allData is not an array!');
        process.exit(1);
    }
    
    if (allData.length === 0) {
        console.log('❌ allData is empty!');
        process.exit(1);
    }
    
    // Check first few entries
    console.log('\n🔍 First 3 entries:');
    allData.slice(0, 3).forEach((entry, index) => {
        console.log(`${index + 1}. ID: ${entry.id}, Group: ${entry.chartGroup}, Server: ${entry.serverName}`);
    });
    
    // Group by server
    const p21Entries = allData.filter(entry => entry.serverName === 'P21');
    const porEntries = allData.filter(entry => entry.serverName === 'POR');
    
    console.log(`\n📈 Server Distribution:`);
    console.log(`P21 entries: ${p21Entries.length}`);
    console.log(`POR entries: ${porEntries.length}`);
    
    // Group by chart group
    const chartGroups = {};
    allData.forEach(entry => {
        if (!chartGroups[entry.chartGroup]) {
            chartGroups[entry.chartGroup] = [];
        }
        chartGroups[entry.chartGroup].push(entry);
    });
    
    console.log(`\n📊 Chart Groups (${Object.keys(chartGroups).length}):`);
    Object.keys(chartGroups).forEach(group => {
        console.log(`  - ${group}: ${chartGroups[group].length} entries`);
    });
    
    console.log('\n✅ Basic correspondence verification complete');
    
} catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
