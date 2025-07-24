// Temporary fix using sqlite3 instead of better-sqlite3
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { ChartDataRow } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');

let db: sqlite3.Database | null = null;

export const getDb = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to connect to database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        resolve(db!);
      }
    });
  });
};

export const getAllChartData = async (): Promise<ChartDataRow[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDb();
      const sql = 'SELECT * FROM chart_data ORDER BY id ASC';
      
      database.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching chart data:', err);
          reject(err);
        } else {
          console.log(`Retrieved ${rows.length} rows from database`);
          resolve(rows as ChartDataRow[]);
        }
      });
    } catch (error) {
      console.error('Database connection error:', error);
      reject(error);
    }
  });
};

export const getAdminVariables = async (): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDb();
      const sql = 'SELECT * FROM admin_variables ORDER BY id ASC';
      
      database.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching admin variables:', err);
          reject(err);
        } else {
          resolve(rows as any[]);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};
