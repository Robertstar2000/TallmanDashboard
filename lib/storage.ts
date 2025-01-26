export class LocalStorage {
  private storage: Storage;

  constructor() {
    if (typeof window === 'undefined') {
      throw new Error('LocalStorage is not available on the server side');
    }
    this.storage = window.localStorage;
  }

  getItem<T>(key: string): T | null {
    const item = this.storage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    this.storage.setItem(key, JSON.stringify(value));
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }
}
