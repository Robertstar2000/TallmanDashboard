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
import { executeRead, executeWrite } from '@/lib/db/sqlite';
export function GET() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sql = `
      SELECT 
        date as month,
        orders as W_Orders,
        revenue as W_Revenue
      FROM web_orders
      ORDER BY date DESC
      LIMIT 12
    `;
            const data = yield executeRead(sql);
            return NextResponse.json(data);
        }
        catch (error) {
            console.error('Error fetching web metrics:', error);
            return NextResponse.json({ error: 'Failed to fetch web metrics' }, { status: 500 });
        }
    });
}
export function POST(request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = yield request.json();
            const { month, W_Orders, W_Revenue } = body;
            const sql = `
      INSERT OR REPLACE INTO web_metrics (month, W_Orders, W_Revenue)
      VALUES (?, ?, ?)
    `;
            yield executeWrite(sql, [month, W_Orders, W_Revenue]);
            return NextResponse.json({ message: 'Web metrics updated successfully' });
        }
        catch (error) {
            console.error('Error updating web metrics:', error);
            return NextResponse.json({ error: 'Failed to update web metrics' }, { status: 500 });
        }
    });
}
