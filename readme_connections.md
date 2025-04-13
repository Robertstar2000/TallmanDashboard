# Tallman Dashboard: P21 & POR Database Connections

This document outlines how the Tallman Dashboard application is intended to connect to the external P21 (SQL Server) and POR (Microsoft Access) databases to fetch live data.

## Overview

The dashboard relies on fetching data directly from two distinct external database systems:

1.  **P21 Database:** An SQL Server instance containing enterprise data.
2.  **POR Database:** A Microsoft Access (`.MDB`) file containing Point-of-Rental data.

The connection mechanism relies on the `odbc` Node.js package to interact with both database types via ODBC drivers configured on the host machine.

## Configuration

Connection details are primarily configured through environment variables in the `.env.local` file:

1.  **POR Database Configuration:**
    *   **Variable:** `POR_FILE_PATH`
    *   **Purpose:** Specifies the absolute path to the Microsoft Access `.MDB` file.
    *   **Example:** `POR_FILE_PATH=C:\\Users\\BobM\\Desktop\\POR.MDB`
    *   **Requirement:** The specified `.MDB` file must exist at this location, and the necessary Microsoft Access ODBC drivers must be installed on the machine running the dashboard application.

2.  **P21 Database Configuration:**
    *   **Variable:** `P21_DSN`
    *   **Purpose:** Specifies the **System Data Source Name (DSN)** configured on the host Windows machine that points to the P21 SQL Server database.
    *   **Example:** `P21_DSN=P21Play`
    *   **Requirement:** A System ODBC DSN with the exact name specified (`P21Play` in the example) must be created and configured via the Windows "ODBC Data Sources (x64)" administrator tool. This DSN contains the server address, database name, and authentication details needed to connect to the P21 SQL Server.

## Connection Logic Flow (Intended)

1.  **Identify Target Server:** When executing SQL queries (e.g., via the "Run Queries" button in the Admin panel), the system checks the `serverName` field associated with the specific data row (`"P21"` or `"POR"`).
2.  **Select Connection Info:** Based on the `serverName`, the application retrieves the appropriate connection configuration:
    *   If `"P21"`, it uses the DSN specified by `P21_DSN`.
    *   If `"POR"`, it uses the file path specified by `POR_FILE_PATH`.
3.  **Establish ODBC Connection:** The application uses the `odbc` package to establish a connection:
    *   For P21: It attempts to connect using the DSN (`DSN=P21Play`).
    *   For POR: It attempts to connect using a connection string derived from the file path (e.g., `Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=C:\Users\BobM\Desktop\POR.MDB;`).
4.  **Execute Query:** Once connected, the application executes the SQL query stored in the `productionSqlExpression` field for that specific data row against the connected database.
5.  **Return Result:** The database returns the result (expected to be a single value aliased as `value`).
6.  **Update Dashboard:** The fetched `value` updates the corresponding data row in the application's internal state (and potentially the local SQLite cache/spreadsheet display), which then reflects on the dashboard charts.

## Dependencies and Endpoint Format

*   **Unique Dependencies:**
    *   `odbc`: The primary Node.js package used for establishing connections and executing queries against both P21 (SQL Server via DSN) and POR (MS Access via file path) using ODBC drivers.
    *   Requires corresponding **system-level ODBC drivers** to be installed and configured on the host machine:
        *   **For P21:** A driver compatible with the target SQL Server (e.g., Microsoft SQL Server ODBC Driver).
        *   **For POR (.mdb):** The **Microsoft Access Driver (*.mdb, *.accdb)**. This driver is the specific component that allows the `odbc` package to interact with `.mdb` files.

*   **Query Execution Endpoint (Intended `/api/executeQuery` or similar):**
    *   **Purpose:** To receive requests from the client (e.g., the Admin Spreadsheet when "Run Queries" is initiated), execute a single SQL query against the appropriate external database, and return the result.
    *   **Request Format (Client to Server):** A JSON payload sent via POST request, likely containing:
        ```json
        {
          "rowId": "unique_row_identifier", // To identify which row's value to update
          "serverName": "P21", // or "POR"
          "sql": "SELECT COUNT(*) as value FROM dbo.some_table WITH (NOLOCK) WHERE ..." // The productionSqlExpression
        }
        ```
    *   **Response Format (Server to Client):** A JSON response indicating the outcome:
        *   *Success:* 
            ```json
            {
              "success": true,
              "value": 123.45 // The single numerical value returned by the query
            }
            ```
        *   *Failure:* 
            ```json
            {
              "success": false,
              "error": "Connection failed: DSN not found" // Or other relevant error message
            }
            ```

## Specific APIs and Calls (Likely)

*   **Node Package:** `odbc` (version ~2.4.9 or similar)
*   **Core Functions (from `odbc` package):**
    *   `odbc.connect('connection_string', callback)`: Used to establish the connection. The `connection_string` will differ for P21 (using DSN) and POR (using Driver and DBQ path).
    *   `connection.query('sql_query', callback)`: Used to execute the `productionSqlExpression` against the established `connection`.
    *   `connection.close(callback)`: Used to close the database connection.

*(Note: The exact implementation details within the dashboard's codebase, particularly the API endpoint or background worker logic responsible for orchestrating these steps, require further investigation or may be part of scripts/client-side logic rather than standard API routes.)*

## Current Status & Known Issues

*   **ODBC Package Issues:** The `odbc` package and its dependency `@mapbox/node-pre-gyp` have previously caused build failures in this Next.js project (`MEMORY[7a07cb63-1d51-4dbd-82fa-fef91d9d9887]`). Workarounds involved commenting out `odbc` imports and related functionality (like the POR connection test).
*   **POR Connection Status:** Due to the build issues, the **POR database connection is likely non-functional** in the current state unless the `odbc` package issues have been resolved and the relevant code uncommented/re-integrated.
*   **P21 Connection Dependency:** The P21 connection relies entirely on a **correctly configured System ODBC DSN** existing on the host machine. Without this external setup, P21 queries will fail.
*   **Error Handling/Credentials:** The current state of robust error handling, connection pooling, or explicit credential management (beyond what the DSN handles) within the application code is unclear and may need implementation.
*   **Empty POR Database:** Testing has shown that the currently configured POR database file (`C:\Users\BobM\Desktop\POR.MDB`) contains tables but no actual data rows (`MEMORY[9681a486-f3fc-4556-8ead-670fe29e1c30]`). Even if the connection works, queries might return zero/null.
