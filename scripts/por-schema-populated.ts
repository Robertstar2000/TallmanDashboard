/**
 * POR Database Schema (Populated Tables)
 * 
 * This file contains the schema for tables in the POR database that have data.
 * Generated on 2025-03-27T01:26:16.198Z
 */

export interface PORColumnDefinition {
  name: string;
  dataType: string;
}

export interface PORTableDefinition {
  name: string;
  columns: PORColumnDefinition[];
}

export interface PORDatabaseSchema {
  tables: PORTableDefinition[];
  databaseName: string;
  lastUpdated: string;
}

export const porSchema: PORDatabaseSchema = {
  "tables": [
  ],
  "databaseName": "POR",
  "lastUpdated": "2025-03-27T01:26:16.198Z"
};
