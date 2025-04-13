var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState, useEffect } from 'react';
import styles from '@/styles/TestDb.module.css';
export default function TestDbPage() {
    const [dbData, setDbData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        function fetchDbStructure() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    setLoading(true);
                    const response = yield fetch('/api/test-db-structure');
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const data = yield response.json();
                    setDbData(data);
                    setError(null);
                }
                catch (err) {
                    setError(err instanceof Error ? err.message : 'Unknown error occurred');
                    console.error('Error fetching database structure:', err);
                }
                finally {
                    setLoading(false);
                }
            });
        }
        fetchDbStructure();
    }, []);
    return (<div className={styles.container}>
      <h1>Database Structure Test</h1>
      
      {loading && <p className={styles.loading}>Loading database information...</p>}
      
      {error && (<div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>)}
      
      {dbData && !loading && (<div className={styles.results}>
          <h2>Database Tables</h2>
          <ul>
            {dbData.tables.map((table) => (<li key={table}>{table}</li>))}
          </ul>
          
          <h2>Chart Data Table Structure</h2>
          {dbData.chartDataColumns.length > 0 ? (<>
              <h3>Columns</h3>
              <ul>
                {dbData.chartDataColumns.map((col) => (<li key={col.name}>
                    <strong>{col.name}</strong> ({col.type})
                  </li>))}
              </ul>
              
              <h3>Production SQL Expression Column</h3>
              <p>
                {dbData.hasProdSqlExpr
                    ? '✅ Column exists in the database'
                    : '❌ Column does not exist in the database'}
              </p>
              
              <h3>Missing Production SQL Expressions</h3>
              <p>
                {dbData.missingProdSqlCount === 0
                    ? '✅ All rows have production SQL expressions'
                    : `❌ ${dbData.missingProdSqlCount} rows are missing production SQL expressions`}
              </p>
              
              <h3>Sample Row</h3>
              {dbData.sampleRow ? (<div className={styles.sampleRow}>
                  <pre>{JSON.stringify(dbData.sampleRow, null, 2)}</pre>
                </div>) : (<p>No sample row available</p>)}
            </>) : (<p>Chart data table not found or has no columns</p>)}
          
          <h2>Test Data Mapping</h2>
          {dbData.testDataExists ? (<>
              <p>✅ Test data mapping table exists</p>
              <p>Total entries: {dbData.testDataCount}</p>
              
              {dbData.testDataCount > 0 && (<>
                  <h3>Sample Test Data</h3>
                  <div className={styles.sampleData}>
                    <pre>{JSON.stringify(dbData.testDataSample, null, 2)}</pre>
                  </div>
                </>)}
            </>) : (<p>❌ Test data mapping table does not exist</p>)}
        </div>)}
    </div>);
}
