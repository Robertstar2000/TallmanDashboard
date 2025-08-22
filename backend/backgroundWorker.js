import MCPController from './mcpControllerFixed.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PRODUCTION RULE: NO FALLBACK METRICS - System must be 100% MCP dependent
const loadAllMetrics = () => {
  // CRITICAL: Try to load from allData.json ONLY - no hardcoded fallbacks
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'allData.json'),
      path.join(process.cwd(), '..', 'allData.json'),
      path.join(__dirname, '..', 'allData.json'),
      path.join(__dirname, '..', '..', 'allData.json'),
      'C:\\Users\\BobM\\Desktop\\TallmanDashboard\\allData.json'
    ];
    
    for (const allDataPath of possiblePaths) {
      console.log(`🔍 Checking for allData.json at: ${allDataPath}`);
      if (fs.existsSync(allDataPath)) {
        const allDataContent = fs.readFileSync(allDataPath, 'utf8');
        // Remove UTF-8 BOM if present and trim extraneous whitespace
        const sanitized = allDataContent.replace(/^\uFEFF/, '').trim();
        const allData = JSON.parse(sanitized);
        console.log(`✅ Successfully loaded ${allData.length} metrics from allData.json at ${allDataPath}`);
        
        // Set all values to 0 initially - MUST be updated by MCP
        const mcpDependentMetrics = allData.map(metric => ({
          ...metric,
          value: 0, // Start at 0 until MCP provides real data
          lastUpdated: new Date().toISOString(),
          status: 'pending_mcp',
          note: 'Awaiting real MCP data - initialized to 0'
        }));
        
        // Log chart group breakdown
        const chartGroups = {};
        mcpDependentMetrics.forEach(metric => {
          chartGroups[metric.chartGroup] = (chartGroups[metric.chartGroup] || 0) + 1;
        });
        console.log('📊 Chart group breakdown:', chartGroups);
        
        return mcpDependentMetrics;
      }
    }
    
    console.error('🚨 CRITICAL ERROR: allData.json not found in any location');
    console.error('🚨 SYSTEM REQUIRES allData.json - NO HARDCODED FALLBACKS ALLOWED');
    throw new Error('PRODUCTION ERROR: allData.json required for metric definitions - no fallbacks available');
    
  } catch (error) {
    console.error('🚨 CRITICAL SYSTEM ERROR:', error.message);
    throw new Error(`Cannot load metric definitions: ${error.message}`);
  }
};

class BackgroundWorker {
    constructor() {
        this.mcpController = new MCPController();
        this.isRunning = false;
        this.currentIndex = 0;
        this.metrics = [];
        this.mode = 'production'; // LOCKED to production mode - NO DEMO MODE ALLOWED
        this.workerInterval = null;
        this.statusCallback = null;
        this.dataCallback = null;
        this.rateLimitDelay = 60000; // 1 minute between queries (prevents overloading external servers)
        this.useRealMCP = true; // ALWAYS use real MCP - NO SIMULATION ALLOWED
    }

    setCallbacks(statusCallback, dataCallback) {
        this.statusCallback = statusCallback;
        this.dataCallback = dataCallback;
    }

    setMode(mode) {
        // PRODUCTION RULE: Mode is LOCKED to production - cannot be changed
        console.log(`❌ PRODUCTION MODE LOCKED: Cannot change mode from production to ${mode}. System requires real MCP data only.`);
        this.mode = 'production'; // Force production mode
        
        if (this.statusCallback) {
            this.statusCallback('PRODUCTION MODE LOCKED: Real MCP data only - no simulation allowed');
        }
    }

    loadMetrics() {
        // Load all metrics - initialize to 0 until MCP provides real data
        try {
            this.metrics = loadAllMetrics(); // This sets values to 0 and proper status
            
            console.log(`🔄 Loaded ${this.metrics.length} metrics for MCP processing - all initialized to 0 until real data retrieved`);
            console.log(`📊 Chart groups: ${[...new Set(this.metrics.map(m => m.chartGroup))].join(', ')}`);
            
            // Log pending status
            const pendingCount = this.metrics.filter(m => m.status === 'pending_mcp').length;
            console.log(`ℹ️  ${pendingCount}/${this.metrics.length} metrics pending MCP update (initialized to 0)`);
            
            if (this.dataCallback) {
                this.dataCallback(this.metrics);
            }
        } catch (error) {
            console.error('🚨 CRITICAL: Failed to load metrics - system cannot operate without metric definitions');
            throw error;
        }
    }

    async start() {
        if (this.isRunning) {
            console.log('Background worker already running');
            return;
        }

        if (this.mode === 'demo') {
            console.log('Background worker not started - demo mode active');
            if (this.statusCallback) {
                this.statusCallback('Demo mode active - background worker stopped');
            }
            return;
        }

        console.log('Starting background worker in PRODUCTION mode with MCP servers...');
        this.isRunning = true;
        this.currentIndex = 0;
        
        // Load fresh metrics
        this.loadMetrics();
        
        if (this.statusCallback) {
            this.statusCallback('Background worker started - processing metrics via MCP servers...');
        }

        // Test MCP connections before starting
        try {
            const connectionTests = await this.testMCPConnections();
            console.log('MCP connection test results:', connectionTests);
        } catch (error) {
            console.warn('MCP connection test failed:', error.message);
        }

        // Start the processing loop
        this.processNextMetric();
    }

    stop() {
        if (!this.isRunning) {
            console.log('Background worker already stopped');
            return;
        }

        console.log('Stopping background worker...');
        this.isRunning = false;
        
        if (this.workerInterval) {
            clearTimeout(this.workerInterval);
            this.workerInterval = null;
        }

        if (this.statusCallback) {
            this.statusCallback('Background worker stopped');
        }
    }

    async processNextMetric() {
        if (!this.isRunning || this.mode === 'demo') {
            return;
        }

        if (this.currentIndex >= this.metrics.length) {
            // Completed one full cycle, start over
            this.currentIndex = 0;
            console.log(`Completed full metrics cycle of ${this.metrics.length} metrics, starting over...`);
            
            if (this.statusCallback) {
                this.statusCallback(`Completed cycle at ${new Date().toLocaleTimeString()} - ${this.metrics.length} metrics processed`);
            }
        }

        const metric = this.metrics[this.currentIndex];
        
        try {
            if (this.statusCallback) {
                this.statusCallback(`Processing ${metric.chartGroup}:${metric.variableName} via ${metric.serverName} MCP server...`);
            }

            console.log(`Processing metric ID ${metric.id} [${this.currentIndex + 1}/${this.metrics.length}]: ${metric.variableName} (${metric.chartGroup})`);
            
            // Mark as processing
            metric.status = 'processing';
            if (this.dataCallback) {
                this.dataCallback(this.metrics);
            }

            let value;
            
            if (this.useRealMCP) {
                try {
                    // Attempt real MCP query first
                    console.log(`Executing MCP query on ${metric.serverName}: ${metric.productionSqlExpression.substring(0, 50)}...`);
                    value = await this.mcpController.executeQuery(
                        metric.serverName,
                        metric.productionSqlExpression
                    );
                    
                    // Ensure value is a number
                    if (typeof value === 'object' && value !== null) {
                        // Handle case where MCP returns an object with value property
                        value = value.value || Object.values(value)[0] || 0;
                    }
                    
                    // Convert to number and enforce sentinel on invalid
                    value = Number(value);
                    if (!Number.isFinite(value)) {
                        value = 99999;
                    }
                    metric.status = 'completed';
                    metric.note = value === 99999 ? 'MCP failure sentinel value (99999)' : 'Real data from MCP server';
                    
                    if (value === 99999) {
                        console.log(`⚠️ MCP query returned sentinel for ${metric.variableName}: 99999`);
                    } else {
                        console.log(`MCP query successful: ${metric.variableName} = ${value}`);
                    }
                } catch (mcpError) {
                    console.warn(`MCP query failed for ${metric.variableName}:`, mcpError.message);
                    throw mcpError; // Let it fall through to the simulation
                }
            } else {
                throw new Error('Real MCP disabled for testing');
            }

            // Update metric with result
            metric.value = value;
            metric.lastUpdated = new Date().toISOString();

            if (this.statusCallback) {
                this.statusCallback(`Updated ${metric.variableName}: ${value} (${metric.status})`);
            }

        } catch (error) {
            console.error(`❌ CRITICAL PRODUCTION ERROR - Metric ID ${metric.id}:`, error.message);
            
            // On MCP failure set sentinel value 99999 and continue without failure
            metric.value = 99999;
            metric.lastUpdated = new Date().toISOString();
            metric.status = 'completed';
            metric.note = `MCP SQL execution failed - sentinel 99999 set: ${error.message}`;

            console.error(`🚨 Setting ${metric.variableName} to sentinel 99999 due to MCP failure`);

            if (this.statusCallback) {
                this.statusCallback(`⚠️ MCP SQL execution failed for ${metric.variableName} - set to 99999 and continuing`);
            }
        }

        // Update data
        if (this.dataCallback) {
            this.dataCallback(this.metrics);
        }

        // Move to next metric
        this.currentIndex++;

        // Schedule next processing with rate limiting
        if (this.isRunning && this.mode === 'production') {
            this.workerInterval = setTimeout(() => {
                this.processNextMetric();
            }, this.rateLimitDelay);
        }
    }

    getCurrentStatus() {
        if (!this.isRunning) {
            return {
                running: false,
                mode: this.mode,
                message: 'Background worker stopped'
            };
        }

        const currentMetric = this.metrics[this.currentIndex];
        const completedMetrics = this.metrics.filter(m => m.status === 'completed' || m.status === 'simulated').length;
        const chartGroups = [...new Set(this.metrics.map(m => m.chartGroup))];
        
        return {
            running: true,
            mode: this.mode,
            currentIndex: this.currentIndex,
            totalMetrics: this.metrics.length,
            completedMetrics: completedMetrics,
            chartGroups: chartGroups,
            currentMetric: currentMetric ? {
                id: currentMetric.id,
                name: currentMetric.variableName,
                server: currentMetric.serverName,
                status: currentMetric.status,
                chartGroup: currentMetric.chartGroup
            } : null,
            message: `Processing ${this.currentIndex + 1}/${this.metrics.length} (${completedMetrics} completed)`
        };
    }

    getMetrics() {
        return this.metrics;
    }

    async forceRefresh() {
        console.log('Force refreshing all metrics...');
        
        // Stop the current loop if it's running
        if (this.workerInterval) {
            clearTimeout(this.workerInterval);
            this.workerInterval = null;
        }
        
        this.isRunning = true; // Ensure it's marked as running
        this.currentIndex = 0; // Reset index to the beginning
        
        // Reload metrics to get the latest definitions and reset values to 0
        this.loadMetrics();
        
        if (this.statusCallback) {
            this.statusCallback('Force refresh initiated. Reprocessing all metrics...');
        }
        
        // Immediately start processing the first metric
        this.processNextMetric();
        console.log('✅ Force refresh process started.');
    }

    // REMOVED: generateReasonableValue method - NO SIMULATION ALLOWED IN PRODUCTION

    async testMCPConnections() {
        try {
            const results = {};
            
            // Test P21 connection
            try {
                await this.mcpController.executeQuery('P21', 'SELECT 1 as value;');
                results.P21 = 'Connected';
            } catch (error) {
                results.P21 = `Error: ${error.message}`;
            }
            
            // Test POR connection
            try {
                await this.mcpController.executeQuery('POR', 'SELECT 1 as value;');
                results.POR = 'Connected';
            } catch (error) {
                results.POR = `Error: ${error.message}`;
            }
            
            return results;
        } catch (error) {
            return { error: error.message };
        }
    }

    // Get summary by chart group
    getChartGroupSummary() {
        const summary = {};
        
        this.metrics.forEach(metric => {
            if (!summary[metric.chartGroup]) {
                summary[metric.chartGroup] = {
                    total: 0,
                    completed: 0,
                    simulated: 0,
                    pending: 0,
                    metrics: []
                };
            }
            
            summary[metric.chartGroup].total++;
            summary[metric.chartGroup].metrics.push({
                id: metric.id,
                variableName: metric.variableName,
                value: metric.value,
                status: metric.status,
                lastUpdated: metric.lastUpdated
            });
            
            switch (metric.status) {
                case 'completed':
                    summary[metric.chartGroup].completed++;
                    break;
                case 'simulated':
                    summary[metric.chartGroup].simulated++;
                    break;
                case 'pending':
                    summary[metric.chartGroup].pending++;
                    break;
            }
        });
        
        return summary;
    }

    isProcessingChartGroup(chartGroup) {
        const metric = this.metrics[this.currentIndex];
        return metric && metric.chartGroup === chartGroup;
    }

    getLastUpdate() {
        if (this.metrics.length === 0) return null;
        
        const completedMetrics = this.metrics.filter(m => m.status === 'completed' || m.status === 'simulated');
        if (completedMetrics.length === 0) return null;
        
        const lastUpdated = completedMetrics.reduce((latest, metric) => {
            return new Date(metric.lastUpdated) > new Date(latest) ? metric.lastUpdated : latest;
        }, completedMetrics[0].lastUpdated);
        
        return lastUpdated;
    }
}

export default BackgroundWorker;
