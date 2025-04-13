import fs from 'fs/promises';
import path from 'path';

// --- Configuration ---
const csvFilePath = path.resolve('components', 'ui', 'SeedData.csv');
const tsFilePath = path.resolve('lib', 'db', 'single-source-data.ts');
const csvChartGroupHeader = 'Chart Group';
const csvNameHeader = 'Name';
const csvVariableNameHeader = 'Variable Name'; // Added for cleaning
const csvSqlHeader = 'Production SQL Expression';
// --- End Configuration ---

// --- Helper Functions ---

// Extracts the base variable name (part before comma)
function cleanCsvVariableName(csvVarName) {
  if (!csvVarName) return '';
  const parts = csvVarName.split(',');
  return parts[0].trim();
}

// Extracts the likely axis step (last word) from the CSV Name
function extractAxisStepFromCsvName(csvName) {
  if (!csvName) return '';
  const words = csvName.trim().split(' ');
  // Handle cases like "Today-1", "Today-2" -> return "Today-1", "Today-2"
  if (words.length > 1 && /Today-\d+/.test(words[words.length - 1])) {
      return words[words.length - 1];
  }
  // Handle simple last word extraction otherwise
  return words.pop() || ''; // Return last word or empty string
}


// More robust CSV parsing attempt using regex (handles simple quoted fields)
async function parseCsvRobust(filePath) {
    const csvData = await fs.readFile(filePath, 'utf-8');
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return [];

    const headerLine = lines[0].startsWith('\uFEFF') ? lines[0].substring(1) : lines[0];
    const headers = headerLine.split(',').map(h => h.trim());
    const data = [];
    const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;

    for (let i = 1; i < lines.length; i++) {
        const row = { __originalIndex: i }; // Store original index for reporting
        let match;
        let index = 0;
        regex.lastIndex = 0;
        while ((match = regex.exec(lines[i])) !== null && index < headers.length) {
            let value = match[1].trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1).replace(/""/g, '"');
            }
            row[headers[index]] = value;
            index++;
        }
        if (lines[i].trim()) {
            data.push(row);
        }
    }
    return data;
}

// Function to safely parse the array literal string from TS file
function parseTsArrayString(arrayString) {
    let cleanedString = arrayString.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    cleanedString = cleanedString.replace(/,\s*([}\]])/g, '$1');
    cleanedString = cleanedString.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
    try {
        if (!cleanedString.trim().startsWith('[')) {
            cleanedString = '[' + cleanedString + ']';
        }
        return new Function(`return ${cleanedString}`)();
    } catch (error) {
        console.error("Error parsing TS array string:", error);
        console.error("Cleaned string snippet:", cleanedString.substring(0, 500));
        throw new Error("Failed to parse extracted TS array data.");
    }
}

// Function to format the JS array back into a TS-like string (basic JSON formatting)
function formatTsArrayBasic(dataArray) {
    const arrayContent = dataArray.map(obj => JSON.stringify(obj, null, 2)).join(',\n');
    const indentedContent = arrayContent.split('\n').map(line => '  ' + line).join('\n');
    return `[\n${indentedContent}\n]`;
}

// --- Main Logic ---
async function updateSqlExpressions() {
    console.log(`Reading CSV data from: ${csvFilePath}`);
    let csvData;
    try {
        csvData = await parseCsvRobust(csvFilePath);
    } catch (error) { console.error(`Error reading/parsing CSV: ${error.message}`); process.exit(1); }
    if (!csvData || csvData.length === 0) { console.error('CSV empty or parsing failed.'); process.exit(1); }
    console.log(`Successfully parsed ${csvData.length} data rows from CSV.`);

    // Create nested map from CSV: Map<primaryKey, Map<extractedAxisStep, { sql, csvRow, used }>>
    const csvMasterMap = new Map();
    let missingKeyFieldsCount = 0;
    let addedToMapCount = 0;

    console.log("Building nested map from CSV data...");
    csvData.forEach(row => {
        const chartGroup = row[csvChartGroupHeader];
        const variableName = row[csvVariableNameHeader];
        const name = row[csvNameHeader];
        const sql = row[csvSqlHeader];

        if (chartGroup && variableName && name && sql !== undefined && sql !== null) {
            const cleanVarName = cleanCsvVariableName(variableName);
            const extractedAxisStep = extractAxisStepFromCsvName(name);
            const primaryKey = `${chartGroup}||${cleanVarName}`;

            if (!csvMasterMap.has(primaryKey)) {
                csvMasterMap.set(primaryKey, new Map());
            }
            const axisMap = csvMasterMap.get(primaryKey);

            if (extractedAxisStep) {
                // Warn if overwriting axis step for same group/var - indicates duplicate/bad extraction?
                if (axisMap.has(extractedAxisStep)) {
                    console.warn(`Duplicate/Overwrite for Axis Step Key: Primary='${primaryKey}', Axis='${extractedAxisStep}' (CSV Row ${row.__originalIndex + 1})`);
                }
                 const finalSql = sql.replace(/AS\s+result/gi, 'AS value');
                axisMap.set(extractedAxisStep, { sql: finalSql, csvRow: row, used: false });
                addedToMapCount++;
            } else {
                 console.warn(`Could not extract Axis Step from Name: '${name}' (CSV Row ${row.__originalIndex + 1})`);
                 missingKeyFieldsCount++;
            }
        } else {
            console.warn(`Missing required field(s) (Chart Group, Variable Name, Name, SQL) in CSV row ${row.__originalIndex + 1}: ${JSON.stringify(row)}`);
            missingKeyFieldsCount++;
        }
    });
    console.log(`Finished building CSV map. Entries added: ${addedToMapCount}. Rows with missing fields/extraction issues: ${missingKeyFieldsCount}.`);

    console.log(`Reading TS file from: ${tsFilePath}`);
    let tsFileContent;
    try { tsFileContent = await fs.readFile(tsFilePath, 'utf-8'); }
    catch (error) { console.error(`Error reading TS file: ${error.message}`); process.exit(1); }

    const arrayRegex = /export\s+const\s+singleSourceData\s*:\s*SourceDataDefinition\[\]\s*=\s*(\[[\s\S]*?\]);/s;
    const match = tsFileContent.match(arrayRegex);
    if (!match || !match[1]) { console.error("Could not find 'singleSourceData' array in TS file."); process.exit(1); }
    const arrayString = match[1];
    const originalFullExportString = match[0];

    console.log("Parsing extracted TS array data...");
    let tsDataArray;
    try { tsDataArray = parseTsArrayString(arrayString); }
    catch (error) { process.exit(1); }
    console.log(`Successfully parsed ${tsDataArray.length} objects from TS file.`);

    let expressionsUpdated = 0;
    let tsObjectsProcessed = 0;

    console.log('Starting replacement process (matching TS -> CSV)...');
    tsDataArray.forEach((tsObject, index) => {
        tsObjectsProcessed++;
        const tsChartGroup = tsObject.chartGroup;
        const tsVariableName = tsObject.variableName;
        const tsAxisStep = tsObject.axisStep;

        if (tsChartGroup && tsVariableName && tsAxisStep) {
            const primaryKey = `${tsChartGroup}||${tsVariableName}`;
            const axisMap = csvMasterMap.get(primaryKey);

            if (axisMap) {
                let matchFound = false;
                // Iterate through axis steps extracted from CSV for this group/variable
                for (const [csvExtractedAxisStep, csvEntry] of axisMap.entries()) {
                    // Flexible, case-insensitive matching
                    if (tsAxisStep.toLowerCase().includes(csvExtractedAxisStep.toLowerCase())) {
                         if (tsObject.productionSqlExpression !== csvEntry.sql) {
                             tsObject.productionSqlExpression = csvEntry.sql;
                             expressionsUpdated++;
                             console.log(`  Updated: TS Index ${index} (Key='${primaryKey}', TS Axis='${tsAxisStep}') matched CSV Axis='${csvExtractedAxisStep}'`);
                         }
                        csvEntry.used = true; // Mark the CSV entry as used
                        matchFound = true;
                        break; // Assume first flexible match is the correct one
                    }
                }
                 //if (!matchFound) {
                 //    console.log(`  No matching CSV Axis Step found for TS Index ${index} (Key='${primaryKey}', TS Axis='${tsAxisStep}')`);
                 //}
            } else {
                 //console.log(`  Primary Key '${primaryKey}' from TS Index ${index} not found in CSV map.`);
            }
        } else {
            console.warn(`Missing 'chartGroup', 'variableName', or 'axisStep' in TS object at index ${index}: ${JSON.stringify(tsObject)}`);
        }
    });
    console.log(`Replacement finished. Processed ${tsObjectsProcessed} TS objects. Updated ${expressionsUpdated} SQL expressions.`);

    // Identify and report unused CSV entries
    const unusedCsvRows = [];
    csvMasterMap.forEach(axisMap => {
        axisMap.forEach(csvEntry => {
            if (!csvEntry.used) {
                unusedCsvRows.push(csvEntry.csvRow);
            }
        });
    });

    if (unusedCsvRows.length > 0) {
        console.warn(`\n--- ${unusedCsvRows.length} CSV Entries Could Not Be Matched/Used ---`);
        unusedCsvRows.forEach(row => {
             const keyInfo = `Group='${row[csvChartGroupHeader]}', Var='${row[csvVariableNameHeader]}', Name='${row[csvNameHeader]}'`;
             console.warn(`  - Row ${row.__originalIndex + 1}: ${keyInfo}`);
        });
        console.warn(`--- End Unused CSV Entries ---`);
    } else {
        console.log("All processable CSV entries were matched and used.");
    }

    if (expressionsUpdated > 0) {
        console.log("Formatting updated data structure (basic)...");
        let newArrayStringContent = formatTsArrayBasic(tsDataArray);
        const newExportStatement = `export const singleSourceData: SourceDataDefinition[] = ${newArrayStringContent};`;
        const updatedTsFileContent = tsFileContent.replace(originalFullExportString, newExportStatement);

        console.log(`Writing updated content back to: ${tsFilePath}`);
        try {
            await fs.copyFile(tsFilePath, `${tsFilePath}.bak`);
            console.log(`Backup created: ${tsFilePath}.bak`);
            await fs.writeFile(tsFilePath, updatedTsFileContent, 'utf-8');
            console.log(`Successfully updated ${tsFilePath}!`);
        } catch (error) {
            console.error(`Error writing updated TS file: ${error.message}`);
            process.exit(1);
        }
    } else {
        console.log('No expressions needed updating based on matching logic. File not modified.');
    }
}

updateSqlExpressions();
