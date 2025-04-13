/**
 * Check Admin Variables
 *
 * This script checks the admin_variables table to verify that
 * the POR Overview queries have been properly integrated.
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
import { executeWrite } from '../lib/db/sqlite';
function checkAdminVariables() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Checking admin variables...');
            // Get all admin variables
            const sql = 'SELECT * FROM admin_variables';
            const result = yield executeWrite(sql);
            const adminVars = Array.isArray(result) ? result : [];
            if (adminVars.length > 0) {
                console.log(`Found ${adminVars.length} admin variables`);
                // Group by chart_group
                const groupedVars = adminVars.reduce((groups, variable) => {
                    const group = variable.chart_group || 'Ungrouped';
                    if (!groups[group]) {
                        groups[group] = [];
                    }
                    groups[group].push(variable);
                    return groups;
                }, {});
                // Display variables by group
                for (const [group, variables] of Object.entries(groupedVars)) {
                    console.log(`\n${group} (${variables.length} variables):`);
                    variables.forEach((variable) => {
                        console.log(`  - ${variable.variable_name || variable.name}`);
                        console.log(`    Server: ${variable.server_name}`);
                        console.log(`    SQL: ${variable.sql_expression}`);
                        console.log(`    Production SQL: ${variable.sql_expression}`);
                        console.log(`    Value: ${variable.value}`);
                        console.log();
                    });
                }
            }
            else {
                console.log('No admin variables found');
            }
        }
        catch (error) {
            console.error('Error checking admin variables:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the check
checkAdminVariables().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
