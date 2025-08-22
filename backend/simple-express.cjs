const express = require('express');
const cors = require('cors');

console.log('🚀 Starting simple Express server...');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('📞 Test endpoint called');
    res.json({ 
        message: 'Backend server is working', 
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`🔐 Login attempt: ${username}`);
    
    // Simple test credentials
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

// Start server
console.log(`🎯 Starting server on port ${PORT}...`);
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Test: http://localhost:${PORT}/api/test`);
    console.log(`📍 Login: http://localhost:${PORT}/api/auth/login`);
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

// Keep alive
console.log('💓 Server started, keeping alive...');
