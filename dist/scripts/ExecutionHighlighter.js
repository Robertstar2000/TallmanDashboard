/**
 * ExecutionHighlighter Service
 *
 * This service handles highlighting the currently executing SQL expression
 * in the admin interface and updating the UI to show the active row.
 */
import fs from 'fs';
import path from 'path';
// Path to store the active expression information
const activeExpressionPath = path.join(process.cwd(), 'data', 'active_expression.json');
/**
 * ExecutionHighlighter Service
 */
export class ExecutionHighlighter {
    constructor() {
        this.activeRowId = null;
        this.activeStatus = 'pending';
        this.lastUpdated = new Date().toISOString();
        // Private constructor to enforce singleton pattern
        this.ensureDataDirectory();
    }
    /**
     * Get the singleton instance of ExecutionHighlighter
     */
    static getInstance() {
        if (!ExecutionHighlighter.instance) {
            ExecutionHighlighter.instance = new ExecutionHighlighter();
        }
        return ExecutionHighlighter.instance;
    }
    /**
     * Highlight a row as active
     * @param row The row to highlight
     */
    highlightRow(row) {
        if (!row || !row.id) {
            console.error('Invalid row provided for highlighting');
            return;
        }
        this.activeRowId = row.id;
        this.activeStatus = 'active';
        this.lastUpdated = new Date().toISOString();
        // Write to the active expression file
        this.writeActiveExpressionFile();
        console.log(`Row ${row.id} highlighted as active`);
    }
    /**
     * Mark a row as currently executing
     * @param row The row being executed
     */
    markRowAsExecuting(row) {
        if (!row || !row.id) {
            console.error('Invalid row provided for execution marking');
            return;
        }
        this.activeRowId = row.id;
        this.activeStatus = 'executing';
        this.lastUpdated = new Date().toISOString();
        // Write to the active expression file
        this.writeActiveExpressionFile();
        console.log(`Row ${row.id} marked as executing`);
    }
    /**
     * Mark a row as completed
     * @param row The completed row
     * @param success Whether the execution was successful
     */
    markRowAsCompleted(row, success = true) {
        if (!row || !row.id) {
            console.error('Invalid row provided for completion marking');
            return;
        }
        this.activeRowId = row.id;
        this.activeStatus = success ? 'completed' : 'failed';
        this.lastUpdated = new Date().toISOString();
        // Write to the active expression file
        this.writeActiveExpressionFile();
        console.log(`Row ${row.id} marked as ${this.activeStatus}`);
        // Clear the active row after a short delay
        setTimeout(() => {
            if (this.activeRowId === row.id) {
                this.clearActiveRow();
            }
        }, 2000);
    }
    /**
     * Clear the active row
     */
    clearActiveRow() {
        this.activeRowId = null;
        this.activeStatus = 'pending';
        this.lastUpdated = new Date().toISOString();
        // Remove the active expression file if it exists
        if (fs.existsSync(activeExpressionPath)) {
            try {
                fs.unlinkSync(activeExpressionPath);
                console.log('Cleared active row');
            }
            catch (error) {
                console.error('Error clearing active expression file:', error);
            }
        }
    }
    /**
     * Get the current active row information
     */
    getActiveRowInfo() {
        return {
            id: this.activeRowId,
            status: this.activeStatus,
            lastUpdated: this.lastUpdated
        };
    }
    /**
     * Write the active expression information to a file
     */
    writeActiveExpressionFile() {
        try {
            const data = {
                id: this.activeRowId,
                status: this.activeStatus,
                timestamp: this.lastUpdated
            };
            fs.writeFileSync(activeExpressionPath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Error writing active expression file:', error);
        }
    }
    /**
     * Ensure the data directory exists
     */
    ensureDataDirectory() {
        const dataDir = path.dirname(activeExpressionPath);
        if (!fs.existsSync(dataDir)) {
            try {
                fs.mkdirSync(dataDir, { recursive: true });
                console.log(`Created data directory at ${dataDir}`);
            }
            catch (error) {
                console.error('Error creating data directory:', error);
            }
        }
    }
}
