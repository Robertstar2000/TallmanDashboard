# Rentals Table Column Tests

This table shows the results of testing each column in the Rentals table against the POR database.

| Column Name | Data Type | SQL Query | Success | Value | Error |
|------------|-----------|-----------|---------|-------|-------|
| ID | INTEGER | `SELECT ID FROM Rentals` | ✅ | {"error":"Table 'Rentals' not found in the database"} |  |
| Status | VARCHAR | `SELECT Status FROM Rentals` | ✅ | {"error":"Table 'Rentals' not found in the database"} |  |
| CreatedDate | DATE | `SELECT CreatedDate FROM Rentals` | ✅ | {"error":"Table 'Rentals' not found in the database"} |  |
| CustomerID | VARCHAR | `SELECT CustomerID FROM Rentals` | ✅ | {"error":"Table 'Rentals' not found in the database"} |  |
| Amount | CURRENCY | `SELECT Amount FROM Rentals` | ✅ | {"error":"Table 'Rentals' not found in the database"} |  |
| Count(*) | INTEGER | `SELECT Count(*) AS value FROM Rentals` | ✅ | {"error":"Table 'Rentals' not found in the database"} |  |
