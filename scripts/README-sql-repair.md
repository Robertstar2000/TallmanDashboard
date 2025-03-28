# SQL Expression Repair Tool

This tool is designed to analyze non-working SQL expressions in the TallmanDashboard and create working replacements by intelligently matching tables and columns based on semantic similarity and testing against the database.

## How It Works

The SQL Expression Repair Tool follows these steps:

1. **Load Data**: Reads SQL expressions from the `complete-chart-data.ts` file.

2. **Analyze Expressions**: For each expression:
   - Checks if it's already working
   - Extracts column names from the original SQL
   - Identifies the target database (P21 or POR)

3. **Table Matching**: 
   - Ranks available tables by relevance to the expression
   - Uses semantic matching based on data point name, variable name, and chart group
   - Prioritizes tables with column names similar to those in the original SQL

4. **Column Matching**:
   - For each potential table, ranks columns by relevance
   - Matches extracted columns from the original SQL to actual table columns
   - Scores columns based on semantic similarity to the data point and variable name

5. **SQL Generation**:
   - Creates new SQL expressions using the best-matched tables and columns
   - Adapts syntax based on database type (P21 uses SQL Server syntax, POR uses MS Access/Jet SQL)
   - Intelligently determines if aggregation is needed (SUM, COUNT, AVG)

6. **Testing and Verification**:
   - Tests generated SQL against the database
   - Presents successful results to the user for acceptance or rejection
   - Tries multiple column combinations before moving to the next table

7. **Result Saving**:
   - Saves accepted SQL expressions to a JSON file for review

## Usage

Run the script from the project root directory:

```bash
npx ts-node scripts/fix-sql-expressions.ts
```

The tool will interactively guide you through fixing SQL expressions. For each expression, it will:

1. Show the original SQL
2. Test potential replacements
3. Ask for your approval of working replacements
4. Save the results to `scripts/fixed-sql-expressions.json`

## Key Features

- **Intelligent Table Matching**: Prioritizes tables most likely to contain the data needed
- **Column Similarity Analysis**: Finds columns semantically similar to those in the original SQL
- **Syntax Adaptation**: Handles different SQL dialects (SQL Server vs MS Access)
- **Interactive Workflow**: Allows user verification of suggested fixes
- **Comprehensive Testing**: Tests multiple combinations before giving up

## Notes

- The tool uses the existing API endpoints for testing SQL expressions
- It handles both P21 (SQL Server) and POR (MS Access) database syntaxes
- The semantic matching algorithm uses simple word matching and can be enhanced with more sophisticated NLP techniques if needed
