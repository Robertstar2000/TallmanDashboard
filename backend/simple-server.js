import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend server is running', timestamp: new Date().toISOString() });
});

// MCP execute query endpoint (simplified)
app.post('/api/mcp/execute-query', async (req, res) => {
    const { query, server } = req.body;
    console.log(`Received query for ${server}: ${query}`);
    
    // For now, return a simple response
    res.json({ message: `Query received for ${server}`, query: query });
});

app.listen(PORT, () => {
    console.log(`✅ Backend server running on port ${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});
