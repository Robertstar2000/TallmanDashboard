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
import { getAllSpreadsheetData } from '@/lib/db/server'; // Assuming this function exists
export function GET(request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('API Route: /api/admin/spreadsheet-data called');
            // TODO: Ensure getAllSpreadsheetData function exists and fetches the correct data
            const data = getAllSpreadsheetData();
            console.log('API Route: getAllSpreadsheetData result count:', data.length);
            return NextResponse.json({ data });
        }
        catch (error) {
            console.error('API Error fetching spreadsheet data:', error instanceof Error ? error.stack : error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return NextResponse.json({ data: [], error: `Failed to fetch spreadsheet data: ${errorMessage}`, details: errorMessage }, { status: 500 });
        }
    });
}
