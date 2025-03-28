import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { dashboardData as initialSpreadsheetData } from '@/lib/db/single-source-data';

interface SqlExpression {
  id: string;
  productionSqlExpression: string;
}

/**
 * API endpoint to update multiple SQL expressions in the complete-chart-data.ts file
 */
export async function POST(request: NextRequest) {
  try {
    const { expressions } = await request.json();
    
    if (!expressions || !Array.isArray(expressions) || expressions.length === 0) {
      return NextResponse.json(
        { error: 'Valid expressions array is required' },
        { status: 400 }
      );
    }
    
    // Create a backup of the file
    const sourceFilePath = path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts');
    const backupFilePath = path.join(process.cwd(), 'lib', 'db', `complete-chart-data.backup-${Date.now()}.ts`);
    
    if (!fs.existsSync(sourceFilePath)) {
      return NextResponse.json(
        { error: 'Source file not found' },
        { status: 404 }
      );
    }
    
    // Create a backup
    fs.copyFileSync(sourceFilePath, backupFilePath);
    
    // Read the file content
    let fileContent = fs.readFileSync(sourceFilePath, 'utf8');
    let updatedCount = 0;
    const updatedIds = [];
    
    // Update each expression
    for (const expr of expressions) {
      const { id, productionSqlExpression } = expr;
      
      if (!id || !productionSqlExpression) {
        continue;
      }
      
      // Find the expression in the file - using [\s\S]* instead of /s flag for multiline matching
      const expressionPattern = new RegExp(`id:\\s*["']${id}["'][\\s\\S]*?productionSqlExpression:\\s*["'\`]([\\s\\S]*?)["'\`]`);
      const match = fileContent.match(expressionPattern);
      
      if (!match) {
        console.warn(`Could not find SQL expression with ID ${id} in the file`);
        continue;
      }
      
      // Replace the expression
      fileContent = fileContent.replace(
        expressionPattern,
        (match) => match.replace(
          /productionSqlExpression:\s*["'\`]([^]*?)["'\`]/,
          `productionSqlExpression: \`${productionSqlExpression}\``
        )
      );
      
      // Also update the lastUpdated timestamp
      const timestampPattern = new RegExp(`id:\\s*["']${id}["'][\\s\\S]*?lastUpdated:\\s*["']([\\s\\S]*?)["']`);
      if (timestampPattern.test(fileContent)) {
        fileContent = fileContent.replace(
          timestampPattern,
          (match) => match.replace(
            /lastUpdated:\s*["']([^]*?)["']/,
            `lastUpdated: "${new Date().toISOString()}"`
          )
        );
      }
      
      updatedCount++;
      updatedIds.push(id);
    }
    
    // Update the file header timestamp
    fileContent = fileContent.replace(
      /\/\/ Last updated: (.*)/,
      `// Last updated: ${new Date().toISOString()}`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(sourceFilePath, fileContent, 'utf8');
    
    return NextResponse.json({ 
      success: true, 
      updatedCount,
      updatedIds,
      message: `${updatedCount} SQL expressions updated successfully` 
    });
  } catch (error: any) {
    console.error('Error updating SQL expressions:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating the SQL expressions' },
      { status: 500 }
    );
  }
}
