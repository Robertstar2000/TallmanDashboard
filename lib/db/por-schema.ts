'use client';

// Point of Rental (POR) Schema definitions based on official specifications
export const POR_SCHEMA = {
  rentals: {
    table: 'tblContract',
    fields: {
      id: 'ContractID',
      status: 'StatusCode',
      customer: 'CustomerID',
      start_date: 'StartDate',
      return_date: 'ReturnDate',
      total_amount: 'TotalAmount',
      deposit: 'DepositAmount',
      type: 'ContractType',
      location: 'LocationID',
      salesperson: 'SalespersonID',
      delivery_status: 'DeliveryStatus',
      billing_status: 'BillingStatus',
      last_invoice: 'LastInvoiceDate'
    }
  },
  equipment: {
    table: 'tblEquipment',
    fields: {
      id: 'EquipmentID',
      description: 'Description',
      status: 'StatusCode',
      category: 'CategoryID',
      rate: 'RentalRate',
      cost: 'ReplacementCost',
      location: 'LocationID',
      maintenance_date: 'LastMaintenanceDate',
      serial: 'SerialNumber',
      make: 'Make',
      model: 'Model',
      year: 'Year',
      hours: 'CurrentHours',
      condition: 'Condition',
      ownership: 'OwnershipType'
    }
  },
  customers: {
    table: 'tblCustomer',
    fields: {
      id: 'CustomerID',
      name: 'CustomerName',
      type: 'CustomerType',
      status: 'StatusCode',
      credit_limit: 'CreditLimit',
      balance: 'CurrentBalance',
      last_rental: 'LastRentalDate',
      tax_exempt: 'TaxExempt',
      rating: 'CustomerRating',
      sales_ytd: 'SalesYTD',
      location: 'DefaultLocation'
    }
  },
  transactions: {
    table: 'tblTransaction',
    fields: {
      id: 'TransactionID',
      date: 'TransactionDate',
      type: 'TransactionType',
      amount: 'Amount',
      contract: 'ContractID',
      payment_method: 'PaymentMethod',
      reference: 'ReferenceNo',
      location: 'LocationID',
      status: 'StatusCode',
      posted: 'PostedDate'
    }
  },
  maintenance: {
    table: 'tblMaintenance',
    fields: {
      id: 'MaintenanceID',
      equipment: 'EquipmentID',
      type: 'MaintenanceType',
      date: 'MaintenanceDate',
      hours: 'EquipmentHours',
      cost: 'MaintenanceCost',
      status: 'StatusCode',
      notes: 'MaintenanceNotes',
      technician: 'TechnicianID'
    }
  },
  inspections: {
    table: 'tblInspection',
    fields: {
      id: 'InspectionID',
      equipment: 'EquipmentID',
      date: 'InspectionDate',
      type: 'InspectionType',
      result: 'InspectionResult',
      inspector: 'InspectorID',
      notes: 'InspectionNotes',
      next_inspection: 'NextInspectionDate'
    }
  }
};

// SQL query templates using POR schema and standard joins
export const POR_QUERIES = {
  active_rentals: `
    SELECT 
      COUNT(*) as active_count,
      SUM(r.${POR_SCHEMA.rentals.fields.total_amount}) as active_value,
      COUNT(DISTINCT r.${POR_SCHEMA.rentals.fields.customer}) as unique_customers
    FROM ${POR_SCHEMA.rentals.table} r
    WHERE r.${POR_SCHEMA.rentals.fields.status} = 'A'
    AND r.${POR_SCHEMA.rentals.fields.return_date} >= GETDATE()
    AND r.${POR_SCHEMA.rentals.fields.location} = @location_id
  `,
  new_rentals: `
    SELECT 
      COUNT(*) as new_count,
      SUM(r.${POR_SCHEMA.rentals.fields.total_amount}) as new_revenue,
      COUNT(DISTINCT r.${POR_SCHEMA.rentals.fields.customer}) as new_customers
    FROM ${POR_SCHEMA.rentals.table} r
    WHERE r.${POR_SCHEMA.rentals.fields.start_date} >= DATEADD(day, -30, GETDATE())
    AND r.${POR_SCHEMA.rentals.fields.type} = 'R'
    AND r.${POR_SCHEMA.rentals.fields.location} = @location_id
  `,
  rental_revenue: `
    SELECT 
      FORMAT(r.${POR_SCHEMA.rentals.fields.start_date}, 'yyyy-MM') as month,
      COUNT(*) as rental_count,
      SUM(r.${POR_SCHEMA.rentals.fields.total_amount}) as total_revenue,
      COUNT(DISTINCT r.${POR_SCHEMA.rentals.fields.customer}) as customer_count,
      AVG(r.${POR_SCHEMA.rentals.fields.total_amount}) as avg_rental_value
    FROM ${POR_SCHEMA.rentals.table} r
    WHERE r.${POR_SCHEMA.rentals.fields.start_date} >= DATEADD(month, -12, GETDATE())
    AND r.${POR_SCHEMA.rentals.fields.location} = @location_id
    GROUP BY FORMAT(r.${POR_SCHEMA.rentals.fields.start_date}, 'yyyy-MM')
    ORDER BY month
  `,
  equipment_utilization: `
    SELECT 
      e.${POR_SCHEMA.equipment.fields.category},
      COUNT(*) as total_units,
      SUM(CASE WHEN e.${POR_SCHEMA.equipment.fields.status} = 'R' THEN 1 ELSE 0 END) as rented_units,
      CAST(SUM(CASE WHEN e.${POR_SCHEMA.equipment.fields.status} = 'R' THEN 1 ELSE 0 END) AS FLOAT) / 
        NULLIF(COUNT(*), 0) * 100 as utilization_rate,
      SUM(e.${POR_SCHEMA.equipment.fields.rate}) as potential_daily_revenue
    FROM ${POR_SCHEMA.equipment.table} e
    WHERE e.${POR_SCHEMA.equipment.fields.location} = @location_id
    GROUP BY e.${POR_SCHEMA.equipment.fields.category}
  `,
  maintenance_due: `
    SELECT 
      e.${POR_SCHEMA.equipment.fields.category},
      COUNT(*) as units_due,
      MIN(e.${POR_SCHEMA.equipment.fields.maintenance_date}) as oldest_maintenance,
      AVG(e.${POR_SCHEMA.equipment.fields.hours}) as avg_hours
    FROM ${POR_SCHEMA.equipment.table} e
    WHERE e.${POR_SCHEMA.equipment.fields.maintenance_date} <= DATEADD(day, 30, GETDATE())
    AND e.${POR_SCHEMA.equipment.fields.location} = @location_id
    GROUP BY e.${POR_SCHEMA.equipment.fields.category}
  `,
  customer_rentals: `
    SELECT 
      c.${POR_SCHEMA.customers.fields.type},
      COUNT(DISTINCT c.${POR_SCHEMA.customers.fields.id}) as customer_count,
      SUM(c.${POR_SCHEMA.customers.fields.sales_ytd}) as ytd_revenue,
      AVG(c.${POR_SCHEMA.customers.fields.credit_limit}) as avg_credit_limit,
      COUNT(r.${POR_SCHEMA.rentals.fields.id}) as total_rentals
    FROM ${POR_SCHEMA.customers.table} c
    LEFT JOIN ${POR_SCHEMA.rentals.table} r 
      ON c.${POR_SCHEMA.customers.fields.id} = r.${POR_SCHEMA.rentals.fields.customer}
      AND r.${POR_SCHEMA.rentals.fields.start_date} >= DATEADD(month, -12, GETDATE())
    WHERE c.${POR_SCHEMA.customers.fields.status} = 'A'
    AND c.${POR_SCHEMA.customers.fields.location} = @location_id
    GROUP BY c.${POR_SCHEMA.customers.fields.type}
  `
};
