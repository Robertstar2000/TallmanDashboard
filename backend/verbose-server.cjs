console.log('🔍 Step 1: Starting verbose server...');

try {
    console.log('🔍 Step 2: Requiring express...');
    const express = require('express');
    console.log('✅ Express required successfully');
    
    console.log('🔍 Step 3: Requiring cors...');
    const cors = require('cors');
    console.log('✅ CORS required successfully');
    
    console.log('🔍 Step 4: Creating Express app...');
    const app = express();
    console.log('✅ Express app created');
    
    const PORT = 3001;
    console.log(`🔍 Step 5: Setting up port ${PORT}`);
    
    console.log('🔍 Step 6: Adding middleware...');
    app.use(cors());
    app.use(express.json());
    console.log('✅ Middleware added');
    
    console.log('🔍 Step 7: Adding routes...');
    app.get('/api/test', (req, res) => {
        console.log('📞 Test endpoint called');
        res.json({ 
            message: 'Backend server is working', 
            timestamp: new Date().toISOString(),
            port: PORT
        });
    });
    
    app.post('/api/auth/login', (req, res) => {
        const { username, password } = req.body;
        console.log(`🔐 Login attempt: ${username}`);
        
        if ((username === 'BobM' && password === 'password123') || 
            (username === 'admin' && password === 'admin123')) {
            console.log('✅ Login successful');
            res.json({ 
                token: 'test-token-123',
                user: { username },
                message: 'Login successful'
            });
        } else {
            console.log('❌ Login failed');
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
    console.log('✅ Routes added');
    
    console.log('🔍 Step 8: Starting server listen...');
    
    const server = app.listen(PORT, function() {
        console.log('🎯 Listen callback fired!');
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📍 Test: http://localhost:${PORT}/api/test`);
        console.log(`📍 Login: http://localhost:${PORT}/api/auth/login`);
        console.log('💓 Server is alive and listening...');
    });
    
    console.log('🔍 Step 9: Setting up error handlers...');
    server.on('error', (error) => {
        console.error('❌ Server error:', error);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
    });
    
    server.on('listening', () => {
        console.log('🎉 Server listening event fired!');
    });
    
    console.log('🔍 Step 10: Setting up process handlers...');
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
    
    console.log('✅ All setup complete - server should be running!');
    
    // Keep process alive
    setInterval(() => {
        console.log('💓 Server heartbeat');
    }, 30000);
    
} catch (error) {
    console.error('💥 Fatal error:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
}
