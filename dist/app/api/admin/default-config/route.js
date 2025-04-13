var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NextResponse } from 'next/server';
// Placeholder default configurations
const defaultP21Config = {
    type: 'P21',
    dsn: process.env.DEFAULT_P21_DSN || 'P21Prod', // Example: Read from env var or use fallback
    database: process.env.DEFAULT_P21_DB || 'P21',
    user: process.env.DEFAULT_P21_USER || 'sa',
    // Avoid storing default passwords directly in code if possible
    // password: process.env.DEFAULT_P21_PASSWORD || '', 
};
const defaultPorConfig = {
    type: 'POR',
    filePath: process.env.DEFAULT_POR_PATH || 'C:\\path\\to\\default\\POR.mdb', // Example
};
export function GET(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { searchParams } = new URL(request.url);
        const serverType = searchParams.get('serverType');
        if (!serverType) {
            return NextResponse.json({ error: 'Missing serverType query parameter' }, { status: 400 });
        }
        let defaultConfig = null;
        if (serverType === 'P21') {
            defaultConfig = defaultP21Config;
        }
        else if (serverType === 'POR') {
            defaultConfig = defaultPorConfig;
        }
        else {
            return NextResponse.json({ error: 'Invalid serverType specified' }, { status: 400 });
        }
        if (!defaultConfig) {
            return NextResponse.json({ error: 'Could not determine default config' }, { status: 500 });
        }
        return NextResponse.json(defaultConfig);
    });
}
