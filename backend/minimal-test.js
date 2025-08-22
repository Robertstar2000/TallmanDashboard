console.log('🔍 Starting minimal test...');

// Test basic Node.js functionality
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Platform:', process.platform);

// Test setTimeout to keep process alive
console.log('⏰ Setting timeout...');
setTimeout(() => {
    console.log('✅ Timeout fired - Node.js is working');
}, 2000);

// Keep process alive for 10 seconds
let counter = 0;
const interval = setInterval(() => {
    counter++;
    console.log(`💓 Heartbeat ${counter}/5`);
    if (counter >= 5) {
        console.log('🏁 Test complete');
        clearInterval(interval);
        process.exit(0);
    }
}, 1000);

console.log('🚀 Test running...');
