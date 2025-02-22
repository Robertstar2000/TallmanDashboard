-- P21 database schema
CREATE TABLE IF NOT EXISTS orderHdr (
    OrderId INTEGER PRIMARY KEY,
    OrderDate DATETIME,
    TotAmt DECIMAL(10,2),
    Status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS WebOrderHdr (
    OrderId INTEGER PRIMARY KEY,
    OrderDate DATETIME,
    TotAmt DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS AR_InvoiceHdr (
    InvoiceId INTEGER PRIMARY KEY,
    DueDate DATETIME,
    AmtOpen DECIMAL(10,2)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orderHdr_date ON orderHdr(OrderDate);
CREATE INDEX IF NOT EXISTS idx_webOrderHdr_date ON WebOrderHdr(OrderDate);
CREATE INDEX IF NOT EXISTS idx_arInvoiceHdr_date ON AR_InvoiceHdr(DueDate);
