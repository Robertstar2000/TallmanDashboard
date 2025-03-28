import { executeQuery } from '../lib/db/sqlite';

interface ConnectionConfig {
    serverName: string;
    ipAddress: string;
    port: string;
    database: string;
    username: string;
    password: string;
    instance?: string;
    domain: string;
}

export async function executeDbQuery(sqlExpression: string) {
  try {
    return executeQuery('P21', 'DashboardVariables', sqlExpression);
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

export async function executeQuery(serverType: 'P21' | 'POR', tableName: string, sqlExpression: string): Promise<any> {
    // Use test database settings
    const config: any = {
        server: '10.10.20.28',  // P21 test server IP
        database: 'P21play',    // P21 test database
        user: 'SA',            // Test username
        password: 'Password123',  // Test password
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
            connectTimeout: 30000,
            port: 1433
        }
    };

    try {
        console.log('Executing query:', sqlExpression);
        const result = await executeDbQuery(sqlExpression);
        return result;
    } catch (err) {
        console.error('SQL Query execution error:', err);
        throw err;
    }
}
