const https = require('http');

const testOllama = async () => {
  console.log('Testing Ollama server at http://10.10.20.24:11434...');
  
  // Test data for the API call
  const postData = JSON.stringify({
    model: 'gemma3:27b',
    prompt: 'Hello, can you tell me what you are in one sentence?',
    stream: false
  });

  const options = {
    hostname: '10.10.20.24',
    port: 11434,
    path: '/api/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`Status Code: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Response received:');
          console.log('Model:', response.model);
          console.log('Response:', response.response);
          console.log('Done:', response.done);
          console.log('Total Duration:', response.total_duration);
          resolve(response);
        } catch (error) {
          console.error('Error parsing response:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

// Run the test
testOllama()
  .then(() => {
    console.log('\n✅ Ollama Gemma3:27b model is working correctly!');
  })
  .catch((error) => {
    console.error('\n❌ Error testing Ollama:', error);
  });
