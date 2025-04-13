'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getAllVariables, getVariablesByGroup } from '@/lib/db/indexedDB';
function testDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting Database Tests...\n');
        try {
            // Test 1: Get all variables
            const allVariables = yield getAllVariables();
            console.log(`Total variables: ${allVariables.length}\n`);
            // Test 2: Variables by group
            const groups = [
                'Metrics',
                'Historical Trends',
                'Daily Shipments',
                'Site Distribution',
                'Top Products Online',
                'Top Products Inside',
                'Top Products Outside'
            ];
            for (const group of groups) {
                const variables = yield getVariablesByGroup(group);
                console.log(`${group}: ${variables.length} variables`);
                if (variables.length > 0) {
                    console.log('Sample:', {
                        name: variables[0].name,
                        value: variables[0].value
                    });
                }
                console.log('');
            }
        }
        catch (error) {
            console.error('Test failed:', error);
        }
    });
}
// Run the tests
testDatabase();
