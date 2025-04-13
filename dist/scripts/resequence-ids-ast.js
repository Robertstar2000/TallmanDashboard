"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { Project, VariableDeclarationKind, SyntaxKind } = require('ts-morph');
const path = require('path');
const fs = require('fs');
// Adjust path resolution to work from both ./scripts and ./dist/scripts
const projectRoot = path.resolve(__dirname, '..', '..'); // Go up two levels to project root
const tsFilePath = path.resolve(projectRoot, 'lib', 'db', 'single-source-data.ts');
const backupFilePath = path.resolve(projectRoot, 'lib', 'db', `single-source-data.ts.bak.ast-resequence.${Date.now()}`);
function resequenceIds() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Target TS: ${tsFilePath}`);
        // 1. Backup the original file
        try {
            if (!fs.existsSync(tsFilePath)) {
                throw new Error(`Target file not found: ${tsFilePath}`);
            }
            fs.copyFileSync(tsFilePath, backupFilePath);
            console.log(`Backup created at: ${backupFilePath}`);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error(`Failed to create backup: ${errorMessage}`);
            process.exit(1);
        }
        // Initialize ts-morph project
        // Using tsConfigFilePath helps resolve types correctly if needed, but might not be strictly necessary for this manipulation.
        const project = new Project({
        // Optionally add tsConfigFilePath if complex types or module resolution is involved
        // tsConfigFilePath: path.resolve(__dirname, '../tsconfig.json'),
        // Use an in-memory file system for manipulation to avoid accidentally saving intermediate states
        // useInMemoryFileSystem: true,
        });
        // Add the source file to the project
        const sourceFile = project.addSourceFileAtPath(tsFilePath);
        try {
            // Find the dashboardData variable declaration by iterating through statements
            let dashboardDataDeclaration;
            const varStatements = sourceFile.getVariableStatements();
            for (const statement of varStatements) {
                for (const declaration of statement.getDeclarations()) {
                    if (declaration.getName() === 'singleSourceData') {
                        dashboardDataDeclaration = declaration;
                        break;
                    }
                }
                if (dashboardDataDeclaration)
                    break;
            }
            if (!dashboardDataDeclaration) {
                throw new Error('Could not find the variable declaration for \'singleSourceData\'.');
            }
            // Get the initializer, which should be the array literal
            const initializer = dashboardDataDeclaration.getInitializer();
            if (!initializer || initializer.getKind() !== SyntaxKind.ArrayLiteralExpression) {
                throw new Error("'singleSourceData' initializer is not an ArrayLiteralExpression.");
            }
            const arrayLiteral = initializer.asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
            // Explicitly cast to ArrayLiteralExpression again before accessing elements
            const elements = arrayLiteral.getElements();
            console.log(`Found ${elements.length} elements in the array.`);
            let currentId = 1;
            for (const element of elements) {
                if (element.getKind() === SyntaxKind.ObjectLiteralExpression) {
                    const objectLiteral = element;
                    const idProperty = objectLiteral.getProperty('id');
                    if (idProperty && idProperty.getKind() === SyntaxKind.PropertyAssignment) {
                        const propertyAssignment = idProperty;
                        // Update the initializer (the value part) of the id property
                        // Ensure we're setting it as a numeric literal, not a string
                        propertyAssignment.setInitializer(currentId.toString());
                        currentId++;
                    }
                    else {
                        console.warn('Found object literal without a valid \'id\' PropertyAssignment. Skipping.');
                    }
                }
                else {
                    console.warn(`Skipping non-object literal element in array: ${element.getKindName()}`);
                }
            }
            console.log(`Finished resequencing IDs up to ${currentId - 1}.`);
            // Save the modified file
            // Using saveSync to ensure it completes before the script exits
            yield sourceFile.save(); // Saves changes back to the original file path
            // sourceFile.saveSync();
            console.log(`Successfully saved resequenced IDs to ${tsFilePath}.`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error processing TypeScript file: ${errorMessage}`);
            // Restore from backup on error
            try {
                fs.copyFileSync(backupFilePath, tsFilePath);
                console.log('Restored original file from backup due to error.');
            }
            catch (restoreError) {
                const restoreMessage = restoreError instanceof Error ? restoreError.message : String(restoreError);
                console.error(`Failed to restore from backup: ${restoreMessage}`);
            }
            process.exit(1);
        }
    });
}
// Run the async function
resequenceIds().then(() => {
    console.log('\nAST Resequencing Script finished successfully.');
    console.log('IMPORTANT: Review the changes in lib/db/single-source-data.ts.');
}).catch((err) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Script execution failed: ${errorMessage}`);
    process.exit(1);
});
