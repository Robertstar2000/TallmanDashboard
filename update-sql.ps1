# PowerShell script to update SQL queries in initial-data.ts

$filePath = ".\lib\db\initial-data.ts"
$content = Get-Content $filePath -Raw

# Key Metrics updates
$updates = @(
    # Open Orders (ID: 2)
    @{
        Pattern = 'productionSqlExpression: "SELECT COUNT\(\*\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE order_status = ''Open''"'
        Replacement = 'productionSqlExpression: "SELECT SUM(oh.net_total) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE oh.status = ''O''"'
    }
    # Open Orders 2 (ID: 3)
    @{
        Pattern = 'productionSqlExpression: "SELECT COUNT\(\*\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE order_status = ''Pending''"'
        Replacement = 'productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE status = ''O''"'
    }
    # Daily Revenue (ID: 4)
    @{
        Pattern = 'productionSqlExpression: "SELECT ISNULL\(SUM\(order_amt\), 0\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE CONVERT\(date, order_date\) = CONVERT\(date, GETDATE\(\)\)"'
        Replacement = 'productionSqlExpression: "SELECT SUM(oh.net_total) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE CAST(oh.ord_date AS date) = CAST(GETDATE() AS date)"'
    }
    # Open Invoices (ID: 5)
    @{
        Pattern = 'productionSqlExpression: "SELECT ISNULL\(SUM\(invoice_amt\), 0\) as value FROM P21\.dbo\.ar_open_items WITH \(NOLOCK\) WHERE item_status = ''Open''"'
        Replacement = 'productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.po_hdr ph WITH (NOLOCK) WHERE ph.order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND ph.order_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0) AND ph.completed = 0"'
    }
    # Orders Backlogged (ID: 6)
    @{
        Pattern = 'productionSqlExpression: "SELECT COUNT\(\*\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE order_status = ''Backlogged''"'
        Replacement = 'productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE oh.status = ''B'' AND oh.ord_date >= DATEADD(day, -30, CAST(GETDATE() AS date))"'
    }
    # Total Sales Monthly (ID: 7)
    @{
        Pattern = 'productionSqlExpression: "SELECT ISNULL\(SUM\(order_amt\), 0\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE FORMAT\(order_date, ''yyyy-MM''\) = FORMAT\(GETDATE\(\), ''yyyy-MM''\)"'
        Replacement = 'productionSqlExpression: "SELECT SUM(oh.net_total) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE CAST(oh.ord_date AS date) >= DATEADD(month, -11, CAST(GETDATE() AS date))"'
    }
)

# Apply each update
foreach ($update in $updates) {
    $content = $content -replace $update.Pattern, $update.Replacement
}

# Write the updated content back to the file
Set-Content -Path $filePath -Value $content

Write-Output "SQL queries updated successfully"
