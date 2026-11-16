export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function findBrowserStorage(): KeyValueStore | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function findStoredValue<T>(
  key: string,
  isValid: (value: unknown) => value is T,
  store: KeyValueStore | null = findBrowserStorage(),
): T | null {
  if (!store) {
    return null;
  }
  try {
    const raw = store.getItem(key);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredValue(
  key: string,
  value: unknown,
  store: KeyValueStore | null = findBrowserStorage(),
): boolean {
  if (!store) {
    return false;
  }
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
