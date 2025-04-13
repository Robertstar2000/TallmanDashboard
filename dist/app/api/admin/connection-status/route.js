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
import { checkAllConnections } from '@/lib/db/connections';
export function GET(request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('API Route: /api/admin/connection-status called');
            const statuses = yield checkAllConnections();
            console.log('API Route: checkAllConnections result:', statuses);
            return NextResponse.json({ statuses });
        }
        catch (error) {
            console.error('API Error checking connections:', error instanceof Error ? error.stack : error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return NextResponse.json({ statuses: [], error: `Failed to check connections: ${errorMessage}` }, { status: 500 });
        }
    });
}
