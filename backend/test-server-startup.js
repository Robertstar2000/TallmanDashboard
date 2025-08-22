// Simple test to debug server startup issues
console.log('Testing server startup...');

try {
    console.log('1. Testing basic imports...');
    
    // Test express import
    const express = await import('express');
    console.log('✅ Express imported');
    
    // Test cors import
    const cors = await import('cors');
    console.log('✅ CORS imported');
    
    // Test dotenv import
    const dotenv = await import('dotenv');
    console.log('✅ Dotenv imported');
    
    // Test BackgroundWorker import
    const BackgroundWorker = await import('./backgroundWorker.js');
    console.log('✅ BackgroundWorker imported');
    
    // Test MCPController import
    const MCPController = await import('./mcpControllerFixed.js');
    console.log('✅ MCPController imported');
    
    console.log('\n2. Testing basic server creation...');
    const app = express.default();
    console.log('✅ Express app created');
    
    console.log('\n3. Testing MCP Controller instantiation...');
    const mcpController = new MCPController.default();
    console.log('✅ MCP Controller created');
    
    console.log('\n4. Testing Background Worker instantiation...');
    const backgroundWorker = new BackgroundWorker.default();
    console.log('✅ Background Worker created');
    
    console.log('\n✅ All components loaded successfully!');
    console.log('The server should be able to start normally.');
    
} catch (error) {
    console.error('❌ Error during startup test:', error.message);
    console.error('Stack trace:', error.stack);
}
