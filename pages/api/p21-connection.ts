import { NextApiRequest, NextApiResponse } from 'next';
import { ConnectionManager } from '@/lib/db/connection-manager';
import { ServerConfig } from '@/lib/db/connections';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        const config: ServerConfig = {
          type: server,
          database: server === 'P21' ? 'P21Play' : 'POR',
          username: '',
          password: '',
          useWindowsAuth: true
        };

        // Get a connection to the server
        const connection = await ConnectionManager.getConnection(config);
        
        if (!connection) {
          return res.status(500).json({ error: `Failed to get connection to ${server}` });
        }

        // Execute the query
        const result = await ConnectionManager.executeQuery(config, query);
        
        // Return the result
        return res.status(200).json({ data: result });
      } catch (error) {
        console.error(`Error executing ${server} query:`, error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    } else if (action === 'testConnection') {
      // Test the connection to the server
      const result = await ConnectionManager.testConnection(serverType || 'P21');
      return res.status(200).json({ success: result });
    } else {
      return res.status(400).json({ error: `Invalid action: ${action}` });
    }
  } catch (error) {
    console.error('Error in P21 connection API:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
