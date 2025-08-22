// Debug server startup to identify issues
console.log('🔍 Starting debug server...');

try {
    console.log('📦 Importing modules...');
    
    console.log('  - express');
    const express = await import('express');
    
    console.log('  - cors');
    const cors = await import('cors');
    
    console.log('  - dotenv');
    const dotenv = await import('dotenv');
    
    console.log('  - path/url modules');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    
    console.log('✅ All modules imported successfully');
    
    // Load environment variables
    console.log('🔧 Loading environment variables...');
    dotenv.config({ path: '../.env' });
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const app = express.default();
    const PORT = process.env.BACKEND_PORT || 3001;
    
    console.log(`🚀 Creating Express app on port ${PORT}`);
    
    // Basic middleware
    app.use(cors.default());
    app.use(express.default.json());
    
    // Simple test route
    app.get('/api/test', (req, res) => {
        console.log('📞 Test endpoint called');
        res.json({ 
            message: 'Debug server is working', 
            timestamp: new Date().toISOString(),
            port: PORT
        });
    });
    
    // Start server
    console.log('🎯 Starting server...');
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Debug server running on port ${PORT}`);
        console.log(`📍 Test: http://localhost:${PORT}/api/test`);
        console.log(`🕐 Started at: ${new Date().toISOString()}`);
    });
    
    server.on('error', (error) => {
        console.error('❌ Server error:', error);
        process.exit(1);
    });
    
    // Keep server alive
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down...');
        server.close(() => {
            process.exit(0);
        });
    });
    
    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down...');
        server.close(() => {
            process.exit(0);
        });
    });
    
} catch (error) {
    console.error('💥 Fatal error during startup:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
