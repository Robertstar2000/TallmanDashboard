import { DashboardDataPoint, CalculationType, ServerName } from '../types';

const OLLAMA_ENDPOINT = `${import.meta.env.VITE_OLLAMA_URL}/api/generate`;
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL;

// Rate limiting to avoid overloading external database servers
let lastCallTime = 0;
const MIN_CALL_INTERVAL = 1000; // 1 second minimum between calls

const rateLimitedDelay = async (): Promise<void> => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    if (timeSinceLastCall < MIN_CALL_INTERVAL) {
        const delayNeeded = MIN_CALL_INTERVAL - timeSinceLastCall;
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    lastCallTime = Date.now();
};

/**
 * Calls the Ollama service to get a JSON response.
 * @param prompt The prompt to send to the language model.
 * @returns The parsed JSON object from the model's response.
 */
async function callOllama(prompt: string): Promise<any> {
    try {
        const response = await fetch(OLLAMA_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                format: 'json', // Instructs Ollama to return valid JSON
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        
        // The actual JSON content is a string within the 'response' field that needs to be parsed again
        if (typeof data.response === 'string') {
            try {
                 return JSON.parse(data.response);
            } catch (jsonError) {
                console.error("Failed to parse the 'response' string from Ollama as JSON.", jsonError);
                console.error("Raw response string:", data.response);
                throw new Error("Ollama returned malformed JSON.");
            }
        }
        
        throw new Error("Invalid response format from Ollama. Expected a 'response' field with a JSON string.");

    } catch (error: any) {
        if (error.name === 'AbortError' || (error instanceof TypeError && error.message.includes('Failed to fetch'))) {
             const errorMessage = `Could not connect to Ollama. Please ensure Ollama is running and accessible at ${import.meta.env.VITE_OLLAMA_URL}.`;
             console.error(errorMessage, error);
             throw new Error(errorMessage);
        }
        console.error("Error calling Ollama API:", error);
        throw error;
    }
}


// This function simulates fetching data by using Ollama to generate realistic values.
export const generateDashboardMetrics = async (dataPoints: DashboardDataPoint[]): Promise<DashboardDataPoint[]> => {
    const prompt = `
        You are a business intelligence analyst for "Tallman", a tool and equipment distributor with $100 million in annual revenue.
        Your task is to generate a realistic set of values for the following list of dashboard metrics.
        The company operates on a standard fiscal year. Assume today is a typical business day.

        Company Profile:
        - Annual Revenue: $100,000,000
        - Approx. Monthly Sales: $8,300,000
        - Approx. Daily Revenue: $400,000
        - Inventory Value: Several million dollars.

        Metric Generation Guidelines:
        - Key Metrics: Should align with the company profile. 'Total Sales Monthly' should be around $8.3M.
        - AR Aging: The 'Current' bucket should have the highest value. Values should decrease as the age bracket increases (e.g., 1-30 > 31-60 > 61-90). Total AR should be a realistic percentage of monthly sales.
        - Accounts (Monthly): Generate plausible values for Payable, Receivable, and Overdue amounts for each month. Receivables should generally be higher than payables.
        - Inventory: Generate values for 'In Stock' and 'On Order' for different departments. 'In Stock' should be a significant dollar amount.
        - Historical Data: Show a plausible trend over the year.
        - Values should be numbers. Do not format them as strings with commas or currency symbols.

        Based on these guidelines, provide an updated JSON array for the following metrics.
        Each object in the array must have "variableName" and "newValue".
        
        Metrics to update:
        ${JSON.stringify(dataPoints.map(p => ({ variableName: p.variableName })), null, 2)}
        
        Your response must be ONLY the JSON array.
    `;

    try {
        const updatedValues: { variableName: string; newValue: number }[] = await callOllama(prompt);

        if (!updatedValues || updatedValues.length === 0) {
            throw new Error("AI returned empty or invalid data.");
        }

        const updatedDataPoints = dataPoints.map(dp => {
            const update = updatedValues.find(uv => uv.variableName === dp.variableName);
            return update ? {
                ...dp,
                value: update.newValue,
                lastUpdated: new Date().toISOString()
            } : dp;
        });

        return updatedDataPoints;

    } catch (error) {
        console.error("Error calling Ollama in generateDashboardMetrics. Falling back to random data.", error);
        return dataPoints.map(dp => ({
            ...dp,
            value: Math.floor(Math.random() * (dp.calculationType === CalculationType.SUM ? 1000000 : 500)),
            lastUpdated: new Date().toISOString(),
        }));
    }
};


export const simulateSqlQuery = async (query: string, server: ServerName): Promise<any> => {
    // Apply rate limiting to avoid overloading external database servers
    await rateLimitedDelay();
    
    // Get database connection details (these are for simulation context only)
    const p21Config = {
        server: '10.10.20.13',
        database: 'P21_LIVE',
        trustedConnection: 'true',
        dsn: 'P21Live'
    };
    
    const porConfig = {
        filePath: '\\\\ts03\\POR\\POR.MDB'
    };

    const prompt = `
        You are a SQL database simulator for a tool supply company named Tallman. You will be given a SQL query and a server name. Your response MUST be a single valid JSON object or array.

        Database Connection Details:
        - P21 Server: ${p21Config.server} (Database: ${p21Config.database}, DSN: ${p21Config.dsn})
        - POR Server: MS Access file at ${porConfig.filePath}

        IMPORTANT INSTRUCTION FOR 'POR' SERVER:
        The 'POR' server simulates a limited MS Access Jet SQL engine. For any query to the 'POR' server, you MUST IGNORE any 'WHERE' clause. Your task is to return ALL rows for the columns specified in the 'SELECT' list. For example, if the given query is "SELECT payable, month FROM rental_accounts WHERE month = 'Jan';", you must execute it as if it were "SELECT payable, month FROM rental_accounts" and return data for all months, not just January. The response should be a JSON array of objects, like [{"payable": 1500, "month": "Jan"}, {"payable": 1800, "month": "Feb"}, ...].

        General Instructions:
        - The 'P21' server is a Microsoft SQL Server that manages sales, inventory, etc. It executes queries normally.
        - If the query is 'SELECT @@VERSION;', return a single JSON object with database details. For P21 (SQL Server), example: {"version": "Microsoft SQL Server 2019 (RTM) - 15.0.2000.5 (X64)", "identifier": "P21_LIVE on ${p21Config.server}", "size": "150 GB"}. For POR (simulating Jet), example: {"version": "Simulated Jet Engine 4.0", "identifier": "POR_RENTAL_MASTER", "size": "80 GB"}.
        - If the query is 'list tables', return a JSON array of strings with realistic table names for the specified server. e.g., ["oe_hdr", "oe_line", "customer"].
        - If the query is 'describe [tableName]', return a JSON array of objects, where each object has 'column_name' and 'data_type' for that table. e.g., [{"column_name": "order_no", "data_type": "int"}, {"column_name": "customer_id", "data_type": "int"}].
        - For standard SELECT queries on P21, respond with a JSON array of objects, e.g., [{"result": 12345}].
        - For SELECT queries on POR, remember to return the full unfiltered column data as a JSON array of objects.
        - If the query is invalid SQL, return a JSON object like {"error": "Syntax error near..."}.
        
        Execute this query: "${query}" for server "${server}".
        Your response must be ONLY the JSON result.
    `;

    try {
        const result = await callOllama(prompt);
        return result;
    } catch (error: any) {
        console.error("Error calling Ollama for SQL simulation.", error);
        return { error: error.message || "Error communicating with the Ollama service." };
    }
};

export const simulateBatchSqlQueries = async (queries: { id: number; query: string; server: ServerName }[]): Promise<any> => {
    // Limit batch size to avoid overloading external database servers
    const MAX_BATCH_SIZE = 10;
    
    if (queries.length > MAX_BATCH_SIZE) {
        console.warn(`Batch size ${queries.length} exceeds maximum ${MAX_BATCH_SIZE}. Processing in smaller batches.`);
        
        // Process in smaller batches with rate limiting
        const results: any[] = [];
        for (let i = 0; i < queries.length; i += MAX_BATCH_SIZE) {
            const batch = queries.slice(i, i + MAX_BATCH_SIZE);
            
            // Apply rate limiting between batches
            if (i > 0) {
                await rateLimitedDelay();
            }
            
            const batchResults = await processBatch(batch);
            if (Array.isArray(batchResults)) {
                results.push(...batchResults);
            } else {
                // If there's an error, return it immediately
                return batchResults;
            }
        }
        return results;
    }
    
    // Apply rate limiting for single batch
    await rateLimitedDelay();
    
    return await processBatch(queries);
};

// Helper function to process a batch of queries
const processBatch = async (queries: { id: number; query: string; server: ServerName }[]): Promise<any> => {
    // Get database connection details (these are for simulation context only)
    const p21Config = {
        server: '10.10.20.13',
        database: 'P21_LIVE',
        trustedConnection: 'true',
        dsn: 'P21Live'
    };
    
    const porConfig = {
        filePath: '\\\\ts03\\POR\\POR.MDB'
    };

    const prompt = `
        You are a SQL database simulator for a tool supply company named Tallman.
        You will be given a JSON array of SQL queries to execute against two different servers: 'P21' (Microsoft SQL Server) and 'POR' (MS Access Jet SQL). Your response MUST be a single valid JSON array.

        Database Connection Details:
        - P21 Server: ${p21Config.server} (Database: ${p21Config.database}, DSN: ${p21Config.dsn})
        - POR Server: MS Access file at ${porConfig.filePath}

        IMPORTANT INSTRUCTION FOR 'POR' SERVER:
        The 'POR' server simulates a limited MS Access Jet SQL engine. For any query to the 'POR' server, you MUST IGNORE any 'WHERE' clause. Your task is to return ALL rows for the columns specified in the 'SELECT' list. For example, if a query is "SELECT payable, month FROM rental_accounts WHERE month = 'Jan';", you must execute it as if it were "SELECT payable, month FROM rental_accounts".

        GENERAL INSTRUCTIONS:
        - For each query in the input array, generate a realistic result based on its server type and content.
        - If a query is invalid, the 'result' for that item should be {"error": "Syntax error..."}.
        - Return a single JSON array as your response. Each object in the array must correspond to an input query object and have the following structure:
          {"id": <original_id>, "result": <query_result_json>}
        - The 'id' in your response MUST exactly match the 'id' from the corresponding input query object.
        - The 'query_result_json' should be a JSON array of objects, e.g., [{"result": 12345}] or [{"payable": 1500, "month": "Jan"}, ...].

        Execute this batch of queries (batch size: ${queries.length}):
        ${JSON.stringify(queries, null, 2)}
        
        Your response must be ONLY the JSON array.
    `;

    try {
        const result = await callOllama(prompt);
        return result;
    } catch (error: any) {
        console.error("Error in processBatch", error);
        return { error: error.message || "Failed to simulate batch SQL query via Ollama." };
    }
};
