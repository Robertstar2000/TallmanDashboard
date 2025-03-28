# POR Database Tables

This document lists tables in the POR database that may contain purchase order information.

## PurchaseOrder

Confidence score: 100%

### Relevant columns:

- PO Number: PONumber
- Date: Date
- Vendor Number: VendorNumber
- Total Amount: ShippingCost
- Status: Status
- Store: Store
- Notes: Notes

## AccountingAPIQueuePO

Confidence score: 100%

### Relevant columns:

- PO Number: AccountingAPIQueuePOId
- Date: PODate
- Vendor Number: VendorNumber
- Total Amount: TotalAmount
- Status: Status
- Store: Store
- Notes: Notes

## PurchaseOrderDetail

Confidence score: 80%

### Relevant columns:

- PO Number: PONumber
- Date: DateReceived
- Total Amount: TaxAmount
- Store: Store
- Notes: Comments

## CostOfGoods

Confidence score: 80%

### Relevant columns:

- PO Number: PurchaseNumber
- Date: Date
- Total Amount: PurchasePrice
- Store: Store

## SoldAssetFile

Confidence score: 80%

### Relevant columns:

- PO Number: PurchaseNumber
- Date: Date
- Total Amount: Amount
- Store: Store

## CallLog

Confidence score: 80%

### Relevant columns:

- PO Number: PONumber
- Date: Date
- Vendor Number: VendorNumber
- Notes: Notes

## TransferToRent

Confidence score: 60%

### Relevant columns:

- PO Number: PurchaseNumber
- Date: Date
- Store: Store

