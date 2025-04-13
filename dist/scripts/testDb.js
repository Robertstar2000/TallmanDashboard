var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sqlite3 from 'sqlite3';
let testDb = null;
export function openTestDb() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!testDb) {
            testDb = yield new Promise((resolve, reject) => {
                const db = new sqlite3.Database(':memory:', (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve(db);
                });
            });
        }
        return testDb;
    });
}
function getTestDb() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield openTestDb();
    });
}
export function initializeTestDb() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield getTestDb();
        yield new Promise((resolve, reject) => {
            db.exec(`
      CREATE TABLE IF NOT EXISTS test_orders (
        id INTEGER PRIMARY KEY,
        date TEXT,
        value REAL
      );

      CREATE TABLE IF NOT EXISTS test_inventory (
        id INTEGER PRIMARY KEY,
        item TEXT,
        quantity INTEGER
      );

      -- Insert some test data
      INSERT OR REPLACE INTO test_orders (id, date, value) VALUES 
        (1, date('now'), 1000),
        (2, date('now'), 2000),
        (3, date('now'), 3000);

      INSERT OR REPLACE INTO test_inventory (id, item, quantity) VALUES
        (1, 'Item A', 100),
        (2, 'Item B', 200),
        (3, 'Item C', 300);
    `, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
        console.log('Test database initialized');
    });
}
export function closeTestDb() {
    return __awaiter(this, void 0, void 0, function* () {
        if (testDb) {
            yield new Promise((resolve, reject) => {
                testDb.close((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            testDb = null;
        }
    });
}
