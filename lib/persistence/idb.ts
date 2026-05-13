/**
 * Minimal IndexedDB wrapper for storing logo files.
 *
 * Why IndexedDB (and not localStorage):
 *   - localStorage is limited to ~5 MB and stores strings → poor fit for binary
 *     image data. IDB stores Blobs natively and has hundreds of MB of quota.
 *   - Logos survive page refresh, browser restart, and aren't tied to a session.
 *
 * The store schema is intentionally tiny: one object store `logos` keyed by id.
 * If we ever need more (e.g. saved photos), add new stores in onupgradeneeded.
 */

const DB_NAME = 'shopee-photo-editor';
const DB_VERSION = 1;
const LOGO_STORE = 'logos';

export interface LogoRecord {
  id: string;
  name: string;
  mime: string;
  blob: Blob;
  createdAt: number;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available'));
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(LOGO_STORE)) {
          db.createObjectStore(LOGO_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | null
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(LOGO_STORE, mode);
        const store = tx.objectStore(LOGO_STORE);
        let value: T | undefined;
        const req = fn(store);
        if (req) {
          req.onsuccess = () => {
            value = req.result;
          };
          req.onerror = () => reject(req.error);
        }
        tx.oncomplete = () => resolve(value as T);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export function idbPutLogo(record: LogoRecord): Promise<void> {
  return run<void>('readwrite', (store) => {
    store.put(record);
    return null;
  });
}

export function idbGetLogo(id: string): Promise<LogoRecord | undefined> {
  return run<LogoRecord | undefined>('readonly', (store) => store.get(id) as IDBRequest<LogoRecord | undefined>);
}

export function idbDeleteLogo(id: string): Promise<void> {
  return run<void>('readwrite', (store) => {
    store.delete(id);
    return null;
  });
}

export function idbGetAllLogos(): Promise<LogoRecord[]> {
  return run<LogoRecord[]>('readonly', (store) => store.getAll() as IDBRequest<LogoRecord[]>);
}

/** Update only the metadata (name) without rewriting the blob. */
export async function idbUpdateLogoName(id: string, name: string): Promise<void> {
  const existing = await idbGetLogo(id);
  if (!existing) return;
  await idbPutLogo({ ...existing, name, updatedAt: Date.now() });
}
