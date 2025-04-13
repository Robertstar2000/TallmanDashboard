/**
 * Test script for the ConnectionManager
 *
 * This script tests the connection to P21 and POR databases
 * using the ConnectionManager class.
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
import { ConnectionManager } from '../lib/db/connection-manager';
function testConnections() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Testing P21 connection...');
        // Test P21 connection
        try {
            const p21Config = {
                type: 'P21'
            };
            const p21Result = yield ConnectionManager.testP21Connection(p21Config);
            console.log('P21 Connection Test Result:', p21Result);
            if (p21Result.success) {
                // Test executing a query
                console.log('Testing P21 query execution...');
                try {
                    const queryResult = yield ConnectionManager.executeP21Query('SELECT TOP 5 * FROM Company');
                    console.log('P21 Query Result (first 5 companies):');
                    console.log(queryResult);
                }
                catch (error) {
                    console.error('Error executing P21 query:', error.message);
                }
            }
        }
        catch (error) {
            console.error('Error testing P21 connection:', error.message);
        }
        // Close all connections
        console.log('Closing all connections...');
        yield ConnectionManager.closeAllConnections();
        console.log('Connection tests completed.');
    });
}
// Run the tests
testConnections().catch(error => {
    console.error('Error in test script:', error);
});
