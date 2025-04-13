// Single source of truth for server configurations
export const DEFAULT_P21_CONFIG = {
    dsn: 'P21Play',
    database: 'P21Play',
    user: 'SA',
    password: 'Ted@Admin230',
    type: 'P21',
    options: {
        trustServerCertificate: true,
        encrypt: false,
        driver: 'ODBC Driver 17 for SQL Server'
    }
};
export const DEFAULT_POR_CONFIG = {
    server: '10.10.20.13',
    database: 'POR',
    user: 'SA',
    password: '',
    type: 'POR',
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};
