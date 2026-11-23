import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VyapaarFlowDB extends DBSchema {
  products: {
    key: string;
    value: any;
    indexes: { 'by-barcode': string; 'by-category': string };
  };
  offlineSales: {
    key: string;
    value: {
      id: string;
      data: any;
      createdAt: string;
      syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
      error?: string;
    };
  };
}

const DB_NAME = 'VyapaarFlowOfflineDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VyapaarFlowDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VyapaarFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Products store for instant offline barcode lookup & POS billing
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: '_id' });
          productStore.createIndex('by-barcode', 'barcode');
          productStore.createIndex('by-category', 'category');
        }

        // Offline bills queue
        if (!db.objectStoreNames.contains('offlineSales')) {
          db.createObjectStore('offlineSales', { keyPath: 'id' });
        }
      }
    });
  }
  return dbPromise;
};

/**
 * Cache server products locally in IndexedDB
 */
export async function cacheProductsOffline(products: any[]) {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  await tx.store.clear();
  for (const product of products) {
    await tx.store.put(product);
  }
  await tx.done;
}

/**
 * Get all cached products from IndexedDB
 */
export async function getCachedProducts(): Promise<any[]> {
  const db = await getDB();
  return db.getAll('products');
}

/**
 * Save an offline sale to IndexedDB queue with idempotency ID
 */
export async function queueOfflineSale(salePayload: any): Promise<string> {
  const db = await getDB();
  const id = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const record = {
    id,
    data: {
      ...salePayload,
      idempotencyKey: id
    },
    createdAt: new Date().toISOString(),
    syncStatus: 'PENDING' as const
  };

  await db.put('offlineSales', record);
  return id;
}

/**
 * Get all pending offline sales waiting to be synced
 */
export async function getPendingOfflineSales(): Promise<any[]> {
  const db = await getDB();
  const all = await db.getAll('offlineSales');
  return all.filter((s) => s.syncStatus === 'PENDING');
}

/**
 * Mark offline sale as synced
 */
export async function markSaleSynced(id: string) {
  const db = await getDB();
  await db.delete('offlineSales', id);
}
