'use client';

// Point of Rental (POR) Schema definitions based on official specifications
export const POR_SCHEMA = {
  rentals: {
    table: 'rental_contract',
    fields: {
      id: 'contract_no',
      status: 'status_code',
      customer: 'customer_no',
      start_date: 'start_date',
      return_date: 'return_date',
      total_amount: 'total_amount',
      deposit: 'deposit_amount',
      type: 'contract_type'
    }
  },
  equipment: {
    table: 'equipment',
    fields: {
      id: 'equipment_no',
      description: 'description',
      status: 'status_code',
      category: 'category_code',
      rate: 'rental_rate',
      cost: 'replacement_cost',
      location: 'location_code',
      maintenance_date: 'last_maintenance'
    }
  },
  customers: {
    table: 'customer',
    fields: {
      id: 'customer_no',
      name: 'customer_name',
      type: 'customer_type',
      status: 'status_code',
      credit_limit: 'credit_limit',
      balance: 'current_balance',
      last_rental: 'last_rental_date'
    }
  },
  transactions: {
    table: 'transaction',
    fields: {
      id: 'transaction_no',
      date: 'transaction_date',
      type: 'transaction_type',
      amount: 'amount',
      contract: 'contract_no',
      payment_method: 'payment_method',
      reference: 'reference_no'
    }
  }
};

// SQL query templates using POR schema and standard joins
export const POR_QUERIES = {
  active_rentals: `
    SELECT COUNT(*) as active_count
    FROM ${POR_SCHEMA.rentals.table}
    WHERE ${POR_SCHEMA.rentals.fields.status} = 'A'
    AND ${POR_SCHEMA.rentals.fields.return_date} >= GETDATE()
  `,
  new_rentals: `
    SELECT COUNT(*) as new_count
    FROM ${POR_SCHEMA.rentals.table}
    WHERE ${POR_SCHEMA.rentals.fields.start_date} >= DATEADD(day, -30, GETDATE())
    AND ${POR_SCHEMA.rentals.fields.type} = 'R'
  `,
  rental_revenue: `
    SELECT 
      FORMAT(${POR_SCHEMA.rentals.fields.start_date}, 'yyyy-MM') as month,
      COUNT(*) as rental_count,
      SUM(${POR_SCHEMA.rentals.fields.total_amount}) as total_revenue
    FROM ${POR_SCHEMA.rentals.table}
    WHERE ${POR_SCHEMA.rentals.fields.start_date} >= DATEADD(month, -12, GETDATE())
    GROUP BY FORMAT(${POR_SCHEMA.rentals.fields.start_date}, 'yyyy-MM')
    ORDER BY month
  `,
  equipment_utilization: `
    SELECT 
      e.${POR_SCHEMA.equipment.fields.category},
      COUNT(*) as total_units,
      SUM(CASE WHEN e.${POR_SCHEMA.equipment.fields.status} = 'R' THEN 1 ELSE 0 END) as rented_units
    FROM ${POR_SCHEMA.equipment.table} e
    GROUP BY e.${POR_SCHEMA.equipment.fields.category}
  `
};
