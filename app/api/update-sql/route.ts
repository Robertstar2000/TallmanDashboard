import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { dashboardData as initialSpreadsheetData } from '@/lib/db/single-source-data';

/**
 * API endpoint to update a single SQL expression in the complete-chart-data.ts file
 */
export async function POST(request: NextRequest) {
  try {
    const { id, productionSqlExpression } = await request.json();
    
    if (!id || !productionSqlExpression) {
      return NextResponse.json(
        { error: 'SQL expression ID and new expression are required' },
        { status: 400 }
      );
    }
    
    // Find the expression in the data
    const expressionIndex = initialSpreadsheetData.findIndex(item => item.id === id);
    
    if (expressionIndex === -1) {
      return NextResponse.json(
        { error: `SQL expression with ID ${id} not found` },
        { status: 404 }
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
    
    // Find the expression in the file - using [\s\S]* instead of /s flag for multiline matching
    const expressionPattern = new RegExp(`id:\\s*["']${id}["'][\\s\\S]*?productionSqlExpression:\\s*["'\`]([\\s\\S]*?)["'\`]`);
    const match = fileContent.match(expressionPattern);
    
    if (!match) {
      return NextResponse.json(
        { error: `Could not find SQL expression with ID ${id} in the file` },
        { status: 404 }
      );
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
    
    // Update the file header timestamp
    fileContent = fileContent.replace(
      /\/\/ Last updated: (.*)/,
      `// Last updated: ${new Date().toISOString()}`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(sourceFilePath, fileContent, 'utf8');
    
    // Log information about the update
    const idNum = parseInt(id);
    const isPOR = idNum >= 127 && idNum <= 174;
    console.log(`Updated SQL expression ID ${id} (${isPOR ? 'POR' : 'P21'}) successfully`);
    
    return NextResponse.json({ 
      success: true, 
      message: `SQL expression with ID ${id} updated successfully` 
    });
  } catch (error: any) {
    console.error('Error updating SQL expression:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating the SQL expression' },
      { status: 500 }
    );
  }
}
