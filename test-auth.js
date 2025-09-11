const { checkBackdoorAuth } = require('./lib/auth/auth-service-server.ts');

console.log('Testing backdoor authentication...');

try {
  const result = checkBackdoorAuth('robertstar', 'Rm2214ri#');
  console.log('Backdoor auth result:', result);
} catch (error) {
  console.error('Backdoor auth error:', error);
}
