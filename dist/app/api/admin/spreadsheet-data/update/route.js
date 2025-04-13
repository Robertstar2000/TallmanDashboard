var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// app/api/admin/spreadsheet-data/update/route.ts
import { NextResponse } from 'next/server';
import { updateSpreadsheetData } from '@/lib/db/server'; // We will create this function next
export function POST(request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = (yield request.json());
            if (!Array.isArray(data)) {
                return NextResponse.json({ error: 'Invalid data format. Expected an array.' }, { status: 400 });
            }
            // TODO: Add validation logic for the data array if necessary
            // Call the database function to update the data
            yield updateSpreadsheetData(data);
            return NextResponse.json({ message: 'Data updated successfully' });
        }
        catch (error) {
            console.error('API Error updating spreadsheet data:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return NextResponse.json({ error: `Failed to update spreadsheet data: ${errorMessage}` }, { status: 500 });
        }
    });
}
