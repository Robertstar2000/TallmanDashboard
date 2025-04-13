/**
 * Test API Endpoint
 *
 * This script tests the /api/test-sql endpoint to verify it's working correctly.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from 'node-fetch';
// Configuration
const CONFIG = {
    SERVER_URL: 'http://localhost:3003',
    API_ENDPOINT: '/api/test-sql'
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Testing API Endpoint');
        console.log('===================\n');
        try {
            // Test a simple SQL query against the POR database
            const sql = 'SELECT Count(*) AS value FROM PurchaseOrderDetail';
            console.log(`Testing SQL: ${sql}`);
            const response = yield fetch(`${CONFIG.SERVER_URL}${CONFIG.API_ENDPOINT}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sqlExpression: sql,
                    serverType: 'POR'
                })
            });
            if (!response.ok) {
                const errorText = yield response.text();
                console.error(`API error (${response.status}): ${errorText}`);
                return;
            }
            const data = yield response.json();
            if (data.error) {
                console.error(`SQL error: ${data.error}`);
            }
            else {
                console.log('API endpoint is working!');
                console.log('Response:', JSON.stringify(data, null, 2));
            }
        }
        catch (error) {
            console.error('Error testing API endpoint:', error.message);
        }
    });
}
main().catch(console.error);
