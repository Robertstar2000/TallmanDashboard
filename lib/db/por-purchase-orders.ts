/**
 * Utility functions for working with Point of Rental purchase orders
 */

import { ConnectionManager } from './connection-manager';
import { ServerConfig } from './connections';
import { PORDirectReader } from './por-direct-reader';

/**
 * Interface for purchase order count by month
 */
export interface POCountByMonth {
  month: string;
  count: number;
}

/**
 * Utility class for POR purchase order operations
 */
export class PORPurchaseOrders {
  private config: ServerConfig;
  private directReader: PORDirectReader;
  private useDirectReader: boolean = true;

  constructor(filePath: string = 'C:\\Users\\BobM\\Desktop\\POR.mdb') {
    // Create a valid ServerConfig object for MS Access
    this.config = {
      type: 'POR',
      server: 'local',  // Placeholder for MS Access
      database: 'POR',  // Placeholder for MS Access
      filePath: filePath
    };
    
    // Initialize the direct reader
    this.directReader = new PORDirectReader(this.config);
  }

  /**
   * Get count of purchase orders by month for a given year
   * @param year The year to get counts for (defaults to current year)
   * @returns Array of month and count objects
   */
  async getCountByMonth(year: number = new Date().getFullYear()): Promise<POCountByMonth[]> {
    try {
      if (this.useDirectReader) {
        // Use the direct reader implementation
        return await this.directReader.getPurchaseOrderCountByMonth(year);
      }
      
      // Legacy ODBC implementation as fallback
      const startDate = `#01/01/${year}#`;
      const endDate = `#12/31/${year}#`;
      
      const query = `
        SELECT 
          Format(CreatedDateTime, 'yyyy-mm') AS Month, 
          Count(PONumber) AS POCount
        FROM 
          Contracts
        WHERE 
          CreatedDateTime BETWEEN ${startDate} AND ${endDate}
        GROUP BY 
          Format(CreatedDateTime, 'yyyy-mm')
        ORDER BY 
          Month
      `;
      
      const result = await ConnectionManager.executeAccessQuery(this.config, query);
      
      if (!result.success) {
        console.error('Error getting PO counts by month:', result.error);
        return [];
      }
      
      // Transform the result into our interface format
      return result.data.map((row: any) => ({
        month: row.Month,
        count: row.POCount
      }));
    } catch (error) {
      console.error('Exception in getCountByMonth:', error);
      return [];
    }
  }
  
  /**
   * Get count of purchase orders for the current month
   * @returns The count of purchase orders for the current month
   */
  async getCurrentMonthCount(): Promise<number> {
    try {
      if (this.useDirectReader) {
        // Use the direct reader implementation
        return await this.directReader.getCurrentMonthPurchaseOrderCount();
      }
      
      // Legacy ODBC implementation as fallback
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1; // JavaScript months are 0-indexed
      
      const query = `
        SELECT 
          Count(PONumber) AS CurrentMonthPOCount
        FROM 
          Contracts
        WHERE 
          Format(CreatedDateTime, 'yyyy-mm') = '${year}-${month.toString().padStart(2, '0')}'
      `;
      
      const result = await ConnectionManager.executeAccessQuery(this.config, query);
      
      if (!result.success) {
        console.error('Error getting current month PO count:', result.error);
        return 0;
      }
      
      return result.data[0]?.CurrentMonthPOCount || 0;
    } catch (error) {
      console.error('Exception in getCurrentMonthCount:', error);
      return 0;
    }
  }
  
  /**
   * Get comparison of purchase order counts between current and previous month
   * @returns Object with current month count, previous month count, and percentage change
   */
  async getMonthlyComparison(): Promise<{ current: number; previous: number; percentChange: number }> {
    try {
      if (this.useDirectReader) {
        // Use the direct reader implementation
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        
        // Calculate previous month (handle January case)
        const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        
        const currentMonthFormatted = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        const previousMonthFormatted = `${previousYear}-${previousMonth.toString().padStart(2, '0')}`;
        
        // Get counts for all months in the current year
        const counts = await this.directReader.getPurchaseOrderCountByMonth(currentYear);
        
        // Get counts for previous year if needed (for January)
        let previousYearCounts: POCountByMonth[] = [];
        if (currentMonth === 1) {
          previousYearCounts = await this.directReader.getPurchaseOrderCountByMonth(previousYear);
        }
        
        // Combine all counts
        const allCounts = [...counts, ...previousYearCounts];
        
        // Find current and previous month counts
        const currentCount = allCounts.find(item => item.month === currentMonthFormatted)?.count || 0;
        const previousCount = allCounts.find(item => item.month === previousMonthFormatted)?.count || 0;
        
        // Calculate percentage change
        const percentChange = previousCount === 0 
          ? 100 // If previous month was 0, consider it a 100% increase
          : ((currentCount - previousCount) / previousCount) * 100;
        
        return {
          current: currentCount,
          previous: previousCount,
          percentChange
        };
      }
      
      // Legacy ODBC implementation as fallback
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      
      // Calculate previous month (handle January case)
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      
      const currentMonthFormatted = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
      const previousMonthFormatted = `${previousYear}-${previousMonth.toString().padStart(2, '0')}`;
      
      const query = `
        SELECT 
          Format(CreatedDateTime, 'yyyy-mm') AS Month, 
          Count(PONumber) AS POCount
        FROM 
          Contracts
        WHERE 
          Format(CreatedDateTime, 'yyyy-mm') IN ('${currentMonthFormatted}', '${previousMonthFormatted}')
        GROUP BY 
          Format(CreatedDateTime, 'yyyy-mm')
      `;
      
      const result = await ConnectionManager.executeAccessQuery(this.config, query);
      
      if (!result.success) {
        console.error('Error getting monthly comparison:', result.error);
        return { current: 0, previous: 0, percentChange: 0 };
      }
      
      // Extract counts for current and previous months
      let currentCount = 0;
      let previousCount = 0;
      
      result.data.forEach((row: any) => {
        if (row.Month === currentMonthFormatted) {
          currentCount = row.POCount;
        } else if (row.Month === previousMonthFormatted) {
          previousCount = row.POCount;
        }
      });
      
      // Calculate percentage change
      const percentChange = previousCount === 0 
        ? 100 // If previous month was 0, consider it a 100% increase
        : ((currentCount - previousCount) / previousCount) * 100;
      
      return {
        current: currentCount,
        previous: previousCount,
        percentChange
      };
    } catch (error) {
      console.error('Exception in getMonthlyComparison:', error);
      return { current: 0, previous: 0, percentChange: 0 };
    }
  }
  
  /**
   * Set whether to use the direct reader implementation or the legacy ODBC implementation
   * @param useDirectReader Whether to use the direct reader
   */
  setUseDirectReader(useDirectReader: boolean): void {
    this.useDirectReader = useDirectReader;
  }
}
