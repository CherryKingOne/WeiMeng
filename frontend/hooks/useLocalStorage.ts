import { useState, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '@/utils';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getStorageItem<T>(key, initialValue);
  });

  useEffect(() => {
    setStorageItem(key, storedValue);
  }, [key, storedValue]);

  const setValue = (value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  };

  return [storedValue, setValue];
}
