const isClient = typeof window !== 'undefined';

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (!isClient) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function removeStorageItem(key: string): void {
  if (!isClient) return;
  localStorage.removeItem(key);
}

export function clearStorage(): void {
  if (!isClient) return;
  localStorage.clear();
}
