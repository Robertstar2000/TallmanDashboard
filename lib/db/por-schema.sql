-- POR database schema
CREATE TABLE IF NOT EXISTS POR_InvoiceHdr (
    InvoiceId INTEGER PRIMARY KEY,
    DueDate DATETIME,
    AmtOpen DECIMAL(10,2),
    Status VARCHAR(20)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_porInvoiceHdr_date ON POR_InvoiceHdr(DueDate);
