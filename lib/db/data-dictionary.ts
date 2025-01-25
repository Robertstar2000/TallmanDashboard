'use client';

export interface P21Field {
  name: string;
  type: string;
  description: string;
  table: string;
}

export const P21_DATA_DICTIONARY: Record<string, P21Field> = {
  order_no: {
    name: 'order_no',
    type: 'VARCHAR(20)',
    description: 'Order number - primary key',
    table: 'oe_hdr'
  },
  order_status: {
    name: 'order_status',
    type: 'CHAR(1)',
    description: 'Order status (O=Open, C=Closed, etc)',
    table: 'oe_hdr'
  },
  // Add other field definitions...
};

export function getP21FieldInfo(fieldName: string): P21Field | undefined {
  return P21_DATA_DICTIONARY[fieldName];
}