// Global state for dashboard mode and connections
let isProdMode = false;
let p21Connected = false;
let porConnected = false;

// Mode state
export function setMode(isProd: boolean): void {
  isProdMode = isProd;
  if (typeof window !== 'undefined') {
    localStorage.setItem('dashboard_mode', isProd ? 'prod' : 'test');
  }
}

export function getMode(): boolean {
  if (typeof window !== 'undefined') {
    const savedMode = localStorage.getItem('dashboard_mode');
    if (savedMode !== null) {
      isProdMode = savedMode === 'prod';
    }
  }
  return isProdMode;
}

// Connection state
export function setP21Connection(isConnected: boolean): void {
  p21Connected = isConnected;
  if (typeof window !== 'undefined') {
    localStorage.setItem('p21_connected', isConnected.toString());
  }
}

export function setPORConnection(isConnected: boolean): void {
  porConnected = isConnected;
  if (typeof window !== 'undefined') {
    localStorage.setItem('por_connected', isConnected.toString());
  }
}

export function getP21Connection(): boolean {
  if (typeof window !== 'undefined') {
    const savedState = localStorage.getItem('p21_connected');
    if (savedState !== null) {
      p21Connected = savedState === 'true';
    }
  }
  return p21Connected;
}

export function getPORConnection(): boolean {
  if (typeof window !== 'undefined') {
    const savedState = localStorage.getItem('por_connected');
    if (savedState !== null) {
      porConnected = savedState === 'true';
    }
  }
  return porConnected;
}
