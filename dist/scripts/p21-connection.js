var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ConnectionManager } from '@/lib/db/connection-manager';
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }
        try {
            const { action, query, serverType } = req.body;
            if (!action) {
                return res.status(400).json({ error: 'Missing action parameter' });
            }
            if (action === 'executeQuery') {
                if (!query) {
                    return res.status(400).json({ error: 'Missing query parameter' });
                }
                const server = serverType || 'P21';
                console.log(`Executing ${server} query: ${query}`);
                try {
                    // Get the server configuration
                    const config = {
                        type: server,
                        database: server === 'P21' ? 'P21Play' : 'POR',
                        username: '',
                        password: '',
                        useWindowsAuth: true
                    };
                    // Get a connection to the server
                    const connection = yield ConnectionManager.getConnection(config);
                    if (!connection) {
                        return res.status(500).json({ error: `Failed to get connection to ${server}` });
                    }
                    // Execute the query
                    const result = yield ConnectionManager.executeQuery(config, query);
                    // Return the result
                    return res.status(200).json({ data: result });
                }
                catch (error) {
                    console.error(`Error executing ${server} query:`, error);
                    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
                }
            }
            else if (action === 'testConnection') {
                // Test the connection to the server
                const result = yield ConnectionManager.testConnection(serverType || 'P21');
                return res.status(200).json({ success: result });
            }
            else {
                return res.status(400).json({ error: `Invalid action: ${action}` });
            }
        }
        catch (error) {
            console.error('Error in P21 connection API:', error);
            return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
}
