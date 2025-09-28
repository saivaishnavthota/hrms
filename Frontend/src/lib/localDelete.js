// Simple reusable localStorage-based delete utility
// Stores deleted IDs per feature key, so we can filter lists client-side

const PREFIX = "local_delete_";

const getStorageKey = (key) => `${PREFIX}${key}`;

export function getDeletedIds(key) {
  try {
    const raw = localStorage.getItem(getStorageKey(key));
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch (e) {
    return new Set();
  }
}

export function markDeleted(key, id) {
  try {
    const storageKey = getStorageKey(key);
    const raw = localStorage.getItem(storageKey);
    const arr = raw ? JSON.parse(raw) : [];
    if (!arr.includes(id)) arr.push(id);
    localStorage.setItem(storageKey, JSON.stringify(arr));
  } catch (e) {
    // swallow
  }
}

export function unmarkDeleted(key, id) {
  try {
    const storageKey = getStorageKey(key);
    const raw = localStorage.getItem(storageKey);
    const arr = raw ? JSON.parse(raw) : [];
    const next = arr.filter((x) => x !== id);
    localStorage.setItem(storageKey, JSON.stringify(next));
  } catch (e) {
    // swallow
  }
}

export function clearDeleted(key) {
  try {
    localStorage.removeItem(getStorageKey(key));
  } catch (e) {
    // swallow
  }
}

export function filterListByDeleted(key, list, idField = "id") {
  const deleted = getDeletedIds(key);
  return (list || []).filter((item) => !deleted.has(item?.[idField]));
}