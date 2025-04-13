var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
export function GET() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Dashboard data API route called');
            // Use the direct data file for immediate results
            const directDataPath = path.join(process.cwd(), 'app', 'api', 'dashboard', 'data', 'direct-data.json');
            if (fs.existsSync(directDataPath)) {
                console.log('Using direct data file');
                const directData = JSON.parse(fs.readFileSync(directDataPath, 'utf8'));
                return NextResponse.json(directData);
            }
            // Fallback response if direct data file is not found
            console.log('Direct data file not found, returning empty data');
            return NextResponse.json({
                metrics: [],
                historicalData: [],
                accountsData: [],
                customerMetrics: [],
                inventoryData: [],
                porOverview: [],
                siteDistribution: [],
                arAging: [],
                dailyOrders: [],
                webOrders: []
            });
        }
        catch (error) {
            console.error('Error in dashboard data API route:', error);
            return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
        }
    });
}
