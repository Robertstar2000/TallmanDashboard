Dashboard_Charts

1. AR Aging (Group: AR Aging)
Description: Sum of AR balances for items past due.
Variable: Amount Due
Axis Steps (4): Aging bucket: 1-30 Days, 31-60 Days, 61-90 Days, 90+ Days
Chart Type: Bar/Column chart
SQL Expressions needed: 4
Server: P21

2. Accounts (Group: Accounts)
Variable 1: accounts_payable
   -Description: For each month, shows the total amount payable summed 
Variable 2: accounts_receivable
   -Description: For each month, shows the total amount receivable summed
Variable 3: accounts_payable
   -Description: For each month, shows the total amount payable summed
Axis Steps (12): Month, for last 12 months with the current month starting on the right
Chart Type: Line chart (trend over months)
SQL Expressions needed: 36
Server: P21

3. Customer Metrics (Group: Customer Metrics)
Variable 1: accounts_payable
   -Description: New Customer count for the current month
Variable 2: accounts_receivable
   -Description: For each month, shows the total amount receivable summed
Axis Steps (12): Month, for last 12 months with the current month starting on the right
Chart Type: Line chart (trend over months)
SQL Expressions needed: 24
Server: P21

Chart: Customer Metrics (Group: Customer Metrics)
Variable 1: New Customers
   -Description: Counts the number of orders placed by customers this month who did not place orders in the last 11 months
Variable 2: Prospects
   -Description: Counts the number new prospects from the CRM in P21 in the current month
Axis Steps (12):  Month, for last 12 months with the current month starting on the right
Chart Type: Bar chart
SQL Expressions needed: 24
Server: P21

4. Daily Orders (Group: Daily Orders)
Charts: Daily Orders
Description: Count of orders on the current day (using @DataPointStart).
Variable: Order count
Axis Steps (7): Day
Axis Steps:Daily Orders Orders: Today-6,Today-5,Today-4,Today-3,Today-2, Today-1, today
Chart Type: Line chart (to show day-to-day trends)
SQL Expressions needed: 7
Server: P21

5. Historical Data (Group: Historical Data)
Variable 1: Sales P21
   -Description: For each month, the sum of regular (non-rental) sales from SOMAST (using the Total column).
Variable 2: Sales POR
   -Description: For each month, the sum of regular (rental) sales from SOMAST (using the Total column)
Axis Steps (12): Month, for last 12 months with the current month starting on the right
Chart Type: Stacked bar chart
Axis Steps:  Month, for last 12 months with the current month starting on the right
SQL Expressions needed: 24
Server: P21

6. Inventory (Group: Inventory)
Charts: Inventory (for: Dept 100, Dept 101, Dept 102, Dept 107)
Varibale 1 (4): in_stock
   -Description: Displays current on-hand inventory (OnHandQty) for each department from the ICINV table.
Variable 2 (4): On Order
   -Description: Displays current on-order inventory (OnOrderQty) for each department from the ICINV table.
Axis Steps: Inventory: Dept 100, Dept 101, Dept 102, Dept 107
SQL Expressions needed: 8
Chart Type: Bar chart
Server: P21

7. Key Metrics (Group: Key Metrics)
Total Orders:
Chart: Individual metric  with its own SQL expression displayed in its own box
Description: Count of open orders from the OE_HDR table over the current month.
Variable: Order_count
Axis Step (1): Date range (current month)
Chart Type: display of single number
SQL Expressions needed: 1
Server: P21

Open Orders per Day:
Chart: Individual metric  with its own SQL expression displayed in its own box
Description: Number of open orders on current day.
Variable: Order_count_day
Axis Step (1): Current Day
Chart Type: display of single number 
SQL Expressions needed: 1
Server: P21

All Open Orders:
Chart: Individual metric  with its own SQL expression displayed in its own box
Description: Total count of open orders over the last 12 months.
Variable: Order_count_total
Axis Step (1): Date range
Chart Type: display of single number 
SQL Expressions needed: 1
Server: P21

Daily Revenue:
Chart: Individual metric  with its own SQL expression displayed in its own box
Description: Total sales revenue for a given day (from Total in SOMAST).
Variable: Revenue_day (sum of Total for current day)
Axis Step(1): Day
Chart Type: display of single currency amount
SQL Expressions needed: 1
Server: P21

Open Invoices:
Chart: Individual metric  with its own SQL expression displayed in its own box
Description: Count of open invoices from ARINV over the last 12 months.
Variable: Invoice_count_total
Axis Step (1): last 12 months 
Chart Type: display of single number
SQL Expressions needed: 1 
Server: P21

Orders Backloged Overview:
Chart: Individual metric  with its own SQL expression displayed in its own box
Description: Count of orders in the last 12 monthss with a backlog status.
Variable: Backlog_order_count
Axis Step (1): last 12 months 
Chart Type: display of single number
SQL Expressions needed: 1
Server: P21

Total Sales Monthly Overview (Net P21 Sales, all sales for Tallman):
Chart: Individual metric  with its own SQL expression displayed in its own box
Description: Net sales computed over the current month.
Variable: Net_Sales
Axis Step (1): Current Month
Chart Type: display of single currency amount
SQL Expressions needed: 1
Server: P21

8. Site Distribution (Group: Site Distribution)
Sales by Site:
Charts: Site Distribution Value Columbus, Value Addison, Value Lake City
Description: Sum of Total sales (from SOMAST) for each site/location over the current month.
Variable: Sales Total (dollar amount)
Axis Steps(3): Site/location: Columbus, Value Addison, Value Lake City
Chart Type: Pie chart 
SQL Expressions needed: 3
Server: P21


9. Web Orders (Group: Web Orders)
Variable: Web_Order_count
   -Description: Count of orders where Source is the Tallman.com site for each month
Variable (12): Web Order count
Axis Steps: Month, for last 12 months with the current month starting on the right
Chart Type: Line chart
SQL Expressions needed: 12
Server: P21

10. POR Overview (Group: POR Overview)
New Rentals:
Variable 1 (12): New Rental Order count
   -Description: Count of new rental orders, no privious orders from this customer in the last month
Variable 2 (12): Open_Rental_count (integer)
   -Description: Count of rental orders currently open (with RentalStatus in ‘Open’, ‘Active’, ‘Out’) by month.
Variable 3 (12): rental_sales_value  (dollar amount)
   -Description: Total rental sales value (RentalTotal) for rental orders by month.
Axis Steps: Month, for last 12 months with the current month starting on the righ
Chart Type: Line chart
SQL Expressions needed: 36
Server: POR
