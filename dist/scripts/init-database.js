var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as path from 'path';
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Open database connection
            const db = yield open({
                filename: path.join(process.cwd(), 'data', 'dashboard.db'),
                driver: sqlite3.Database
            });
            console.log('Creating chart_data table...');
            yield db.run(`
      CREATE TABLE IF NOT EXISTS chart_data (
        id TEXT PRIMARY KEY,
        name TEXT,
        chart_group TEXT,
        variable_name TEXT,
        server_name TEXT,
        value TEXT,
        table_name TEXT,
        sql_expression TEXT,
        sql_expression TEXT,
        last_updated TEXT,
        axis_step TEXT
      )
    `);
            console.log('Checking for axis_step column...');
            const columns = yield db.all(`PRAGMA table_info(chart_data)`);
            if (!columns.some((col) => col.name === 'axis_step')) {
                console.log('Adding axis_step column...');
                yield db.run(`ALTER TABLE chart_data ADD COLUMN axis_step TEXT`);
            }
            console.log('Updating axis_step values...');
            yield db.run(`
      UPDATE chart_data 
      SET axis_step = CASE
        WHEN chart_group LIKE '%Monthly%' THEN strftime('%m/%Y', last_updated)
        WHEN chart_group LIKE '%Department%' THEN variable_name
        ELSE COALESCE(variable_name, chart_group)
      END
      WHERE axis_step IS NULL
    `);
            console.log('Creating chart_groups table...');
            yield db.run(`
      CREATE TABLE IF NOT EXISTS chart_groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        display_order INTEGER,
        is_visible INTEGER,
        settings TEXT
      )
    `);
            console.log('Creating server_configs table...');
            yield db.run(`
      CREATE TABLE IF NOT EXISTS server_configs (
        id TEXT PRIMARY KEY,
        name TEXT,
        host TEXT,
        port INTEGER,
        database TEXT,
        username TEXT,
        password TEXT,
        is_active INTEGER,
        connection_type TEXT,
        server TEXT,
        created_at TEXT,
        updated_at TEXT,
        config TEXT
      )
    `);
            console.log('Database initialization completed successfully!');
            yield db.close();
        }
        catch (error) {
            console.error('Error initializing database:', error);
            process.exit(1);
        }
    });
}
// Run the initialization
initializeDatabase();
