# Tallman Dashboard Chart Descriptions

This document describes the purpose of each chart group and its associated metrics based on the latest requirements. (Note: Database/Table specifics need confirmation from `single-source-data.ts`)

## 1. Key Metrics

*   **Database**: P21 (Assumed for most)
*   **Table(s)**: Varies (e.g., `dbo.oe_hdr`, `dbo.ar_invoice`, etc. - needs confirmation)
*   **Chart Group Purpose**: Displays single, critical, up-to-date operational values.
*   **Plot Type**: Single value displays.
*   **Metrics**:
    *   **Total Orders (This Month)**: Count of all orders created in the current calendar month.
    *   **Open Orders (Last 12 Months)**: Total count of orders currently open, created over the last 12 months.
    *   **Open Orders (This Month)**: Total count of orders currently open, created within the current calendar month.
    *   **Daily Revenue (Closed Today)**: Total value of orders marked as closed/completed today.
    *   **Open Invoices (Value)**: Total monetary value of all currently open invoices/orders.
    *   **Orders Backlogged (Last 7 Days)**: Count of orders created in the last 7 days that are not yet filled/shipped.
    *   **Total Monthly Sales (Closed This Month)**: Total monetary value of all orders closed/completed within the current calendar month.

## 2. Accounts

*   **Database**: P21 (Assumed)
*   **Table(s)**: `dbo.ap_invoice`, `dbo.ar_invoice` (Assumed)
*   **Chart Group Purpose**: Tracks monthly Accounts Payable (money owed *to* suppliers) and Accounts Receivable (money owed *by* customers) totals.
*   **Plot Type**: Time series (Last 12 months).
*   **Metrics**:
    *   **Receivables per month**: Total value of AR invoices issued per month.
    *   **Payables per month**: Total value of AP invoices received per month.

## 3. Customer Metrics

*   **Database**: P21 (Assumed)
*   **Table(s)**: `dbo.customer` (Needs confirmation)
*   **Chart Group Purpose**: Monitors customer acquisition trends.
*   **Plot Type**: Time series (Last 12 months).
*   **Metrics**:
    *   **New customers**: Count of new customer accounts created per month.
    *   **Prospects**: Count of leads or prospects generated/entered per month (Table/field needs definition).

## 4. Historical Data

*   **Database**: P21 & POR
*   **Table(s)**: Varies (Sales/Order tables in both DBs)
*   **Chart Group Purpose**: Compares historical sales performance between P21 and POR systems.
*   **Plot Type**: Time series (Last 12 months).
*   **Metrics**:
    *   **P21 sales - POR**: Difference between P21 sales value and POR sales value per month (Derived).
    *   **POR sales**: Total sales value from the POR system per month.

## 5. Inventory

*   **Database**: P21 (Assumed)
*   **Table(s)**: `dbo.ic_inv`, `dbo.inv_loc` (Needs confirmation)
*   **Chart Group Purpose**: Shows inventory value distribution across key departments.
*   **Plot Type**: Categorical (5 departments).
*   **Metrics**:
    *   **Value of Inventory (Dept 100)**: Total inventory value for department 100.
    *   **Value of Inventory (Dept 101)**: Total inventory value for department 101.
    *   **Value of Inventory (Dept 102)**: Total inventory value for department 102.
    *   **Value of Inventory (Dept 103)**: Total inventory value for department 103.
    *   **Value of Inventory (Dept 107)**: Total inventory value for department 107.

## 6. POR Overview

*   **Database**: POR
*   **Table(s)**: `Rentals`, `RentalLines` (Assumed)
*   **Chart Group Purpose**: Provides key metrics related to the Point of Rental (POR) system activity.
*   **Plot Type**: Time series (Last 12 months).
*   **Metrics**:
    *   **Number of New rentals**: Count of new rental contracts created per month.
    *   **Number of Open Rentals**: Count of currently open/active rental contracts per month.
    *   **Value of Open Rentals**: Total monetary value associated with open/active rentals per month.

## 7. Site Distribution

*   **Database**: P21 (Assumed)
*   **Table(s)**: `dbo.oe_hdr` or `dbo.ar_invoice`, `dbo.inv_loc` (Needs confirmation)
*   **Chart Group Purpose**: Shows sales performance distribution across physical locations.
*   **Plot Type**: Categorical (3 sites).
*   **Metrics**:
    *   **Sales (Columbus)**: Total sales value attributed to the Columbus site.
    *   **Sales (Addison)**: Total sales value attributed to the Addison site.
    *   **Sales (Lake City)**: Total sales value attributed to the Lake City site.
    *   **Value of sales year to date**: Combined total sales value across all sites from the start of the year to date (Single value or plotted monthly YTD - needs clarification).

## 8. Daily Orders

*   **Database**: P21 (Assumed)
*   **Table(s)**: `dbo.oe_hdr` (Assumed)
*   **Chart Group Purpose**: Displays recent daily order volume.
*   **Plot Type**: Time series (Last 7 days).
*   **Metrics**:
    *   **Number of orders per day**: Count of orders created on each of the last 7 days.

## 9. Web Orders

*   **Database**: P21 (Assumed)
*   **Table(s)**: `dbo.oe_hdr` (filtered for web source - needs confirmation)
*   **Chart Group Purpose**: Tracks trends in orders originating from the web.
*   **Plot Type**: Time series (Last 12 months).
*   **Metrics**:
    *   **Number of orders**: Count of web orders created per month.
    *   **Value of one month of orders**: Total value of web orders from the last full calendar month (Assumed).

## 10. AR Aging

*   **Database**: P21
*   **Table(s)**: `dbo.ARINV` (Assumed)
*   **Chart Group Purpose**: Displays the aging breakdown of Accounts Receivable.
*   **Plot Type**: Categorical (Aging buckets).
*   **Metrics**:
    *   **Number of unpaid invoices (Current)**: Count of unpaid invoices 0-30 days past due.
    *   **Number of unpaid invoices (1-30 days)**: Count of unpaid invoices 1-30 days past due. (Note: Seems redundant with Current, assuming bucket definitions: Current, 31-60, 61-90, 91+)
    *   **Number of unpaid invoices (31-60 days)**: Count of unpaid invoices 31-60 days past due.
    *   **Number of unpaid invoices (61-90 days)**: Count of unpaid invoices 61-90 days past due.
    *   **Number of unpaid invoices (91+ days)**: Count of unpaid invoices 91+ days past due.
