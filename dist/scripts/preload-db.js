var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { loadDbFromInitFile } from '../lib/db/sqlite';
/**
 * This script runs automatically before the Next.js server starts.
 * It loads the initial data from the single-source-data.ts file into the SQLite database.
 */
function preloadDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('[Preload Script] Starting database preload...');
        try {
            yield loadDbFromInitFile();
            console.log('[Preload Script] Database preload completed successfully.');
            process.exit(0); // Exit with success code
        }
        catch (error) {
            console.error('[Preload Script] Error during database preload:', error);
            process.exit(1); // Exit with failure code
        }
    });
}
// Execute the preload function
preloadDatabase();
