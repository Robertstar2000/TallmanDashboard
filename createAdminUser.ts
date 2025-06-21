// createAdminUser.ts (minimal test)
console.log('--- MINIMAL SCRIPT: [1] Hello from createAdminUser.ts ---');

const a = 1;
const b = 2;
const c = a + b;
console.log(`--- MINIMAL SCRIPT: [2] ${a} + ${b} = ${c} ---`);

// Test an async operation to see if IIFE structure is an issue
(async () => {
  console.log('--- MINIMAL SCRIPT: [3] Async IIFE started ---');
  await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
  console.log('--- MINIMAL SCRIPT: [4] Async IIFE finished ---');
})();

console.log('--- MINIMAL SCRIPT: [5] End of script ---');
