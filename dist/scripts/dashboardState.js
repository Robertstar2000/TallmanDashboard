let isProdMode = false;
let p21Connection = null;
let porConnection = null;
// Mode state
export function setMode(isProd) {
    isProdMode = isProd;
    if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard_mode', isProd ? 'prod' : 'test');
    }
}
export function getMode() {
    if (typeof window !== 'undefined') {
        const savedMode = localStorage.getItem('dashboard_mode');
        if (savedMode !== null) {
            isProdMode = savedMode === 'prod';
        }
    }
    return isProdMode;
}
// Connection state
export function setP21Connection(connection) {
    p21Connection = connection;
    if (typeof window !== 'undefined' && connection) {
        localStorage.setItem('p21_connection', JSON.stringify(connection));
    }
    else if (typeof window !== 'undefined') {
        localStorage.removeItem('p21_connection');
    }
}
export function setPORConnection(connection) {
    porConnection = connection;
    if (typeof window !== 'undefined' && connection) {
        localStorage.setItem('por_connection', JSON.stringify(connection));
    }
    else if (typeof window !== 'undefined') {
        localStorage.removeItem('por_connection');
    }
}
export function getP21Connection() {
    if (typeof window !== 'undefined') {
        const savedState = localStorage.getItem('p21_connection');
        if (savedState !== null) {
            try {
                p21Connection = JSON.parse(savedState);
            }
            catch (error) {
                console.error('Failed to parse P21 connection:', error);
                p21Connection = null;
            }
        }
    }
    return p21Connection;
}
export function getPORConnection() {
    if (typeof window !== 'undefined') {
        const savedState = localStorage.getItem('por_connection');
        if (savedState !== null) {
            try {
                porConnection = JSON.parse(savedState);
            }
            catch (error) {
                console.error('Failed to parse POR connection:', error);
                porConnection = null;
            }
        }
    }
    return porConnection;
}
// Connection status
export function isP21Connected() {
    return p21Connection !== null;
}
export function isPORConnected() {
    return porConnection !== null;
}
