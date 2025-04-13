var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function testInitialData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Testing initial-data.ts and its imports...');
            // Try to import the combined-spreadsheet-data module
            try {
                console.log('Importing combined-spreadsheet-data.ts...');
                const combinedData = yield import('./lib/db/combined-spreadsheet-data');
                console.log('Combined spreadsheet data imported successfully');
                console.log('Module keys:', Object.keys(combinedData));
                if (combinedData.combinedSpreadsheetData) {
                    console.log(`Combined data length: ${combinedData.combinedSpreadsheetData.length}`);
                    if (combinedData.combinedSpreadsheetData.length > 0) {
                        console.log('First row sample:', JSON.stringify(combinedData.combinedSpreadsheetData[0], null, 2));
                    }
                }
                else {
                    console.error('combinedSpreadsheetData is undefined or null');
                }
            }
            catch (importError) {
                console.error('Error importing combined-spreadsheet-data:', importError);
            }
            // Try to import the initial data
            try {
                console.log('\nImporting initial-data.ts...');
                const initialData = yield import('./lib/db/initial-data');
                console.log('Initial data imported successfully');
                console.log('Module keys:', Object.keys(initialData));
                // Check initialSpreadsheetData
                if (initialData.initialSpreadsheetData) {
                    console.log(`initialSpreadsheetData length: ${initialData.initialSpreadsheetData.length}`);
                    if (initialData.initialSpreadsheetData.length > 0) {
                        console.log('First row sample:', JSON.stringify(initialData.initialSpreadsheetData[0], null, 2));
                    }
                }
                else {
                    console.error('initialSpreadsheetData is undefined or null');
                }
                // Check chartGroupSettings
                if (initialData.chartGroupSettings) {
                    console.log(`chartGroupSettings length: ${initialData.chartGroupSettings.length}`);
                    if (initialData.chartGroupSettings.length > 0) {
                        console.log('First chart group sample:', JSON.stringify(initialData.chartGroupSettings[0], null, 2));
                    }
                }
                else {
                    console.error('chartGroupSettings is undefined or null');
                }
                // Check serverConfigs
                if (initialData.serverConfigs) {
                    console.log(`serverConfigs length: ${initialData.serverConfigs.length}`);
                    if (initialData.serverConfigs.length > 0) {
                        console.log('First server config sample:', JSON.stringify(initialData.serverConfigs[0], null, 2));
                    }
                }
                else {
                    console.error('serverConfigs is undefined or null');
                }
            }
            catch (importError) {
                console.error('Error importing initial-data:', importError);
            }
            // Try to import the types
            try {
                console.log('\nImporting types.ts...');
                const types = yield import('./lib/db/types');
                console.log('Types imported successfully');
                console.log('Module keys:', Object.keys(types));
            }
            catch (importError) {
                console.error('Error importing types:', importError);
            }
        }
        catch (error) {
            console.error('Test failed:', error);
        }
    });
}
// Run the test
testInitialData();
export {};
