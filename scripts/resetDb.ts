import Database from 'better-sqlite3';

// Initial test data
const initialData = {
    metrics: [
        { name: 'total_orders', value: 12847 },
        { name: 'open_orders', value: 1563 },
        { name: 'open_orders_2', value: 892 },
        { name: 'daily_revenue', value: 1924500 },
        { name: 'total_revenue', value: 8750000 },
        { name: 'total_profit', value: 2187500 },
        { name: 'inventory_value', value: 12500000 },
        { name: 'inventory_turns', value: 4.2 },
        { name: 'average_order', value: 7500 },
        { name: 'customer_satisfaction', value: 4.8 }
    ]
};

// Create SQLite database
const db = new Database('dashboard.db');

async function main() {
    try {
        console.log('Resetting database...');
        
        // Create DashboardVariables table if it doesn't exist
        db.exec(`CREATE TABLE IF NOT EXISTS DashboardVariables (
            VariableID INTEGER PRIMARY KEY AUTOINCREMENT,
            VariableName TEXT NOT NULL,
            Value TEXT NOT NULL,
            ChartGroup TEXT,
            Calculation TEXT,
            SQLExpression TEXT,
            P21DataDictionary TEXT,
            SubGroup TEXT,
            UpdateTime TEXT
        )`);

        // Clear existing data
        db.exec('DELETE FROM DashboardVariables');

        console.log('Cleared DashboardVariables table');

        // Prepare insert statement
        const insert = db.prepare('INSERT INTO DashboardVariables (VariableName, Value) VALUES (?, ?)');

        // Insert initial data
        for (const item of initialData.metrics) {
            insert.run(item.name, item.value.toString());
            console.log(`Inserted ${item.name} with value ${item.value}`);
        }

        console.log('Database reset complete!');
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

main();
