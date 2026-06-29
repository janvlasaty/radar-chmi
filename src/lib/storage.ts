import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface RadarDB extends DBSchema {
  images: {
    key: string;
    value: {
      url: string;
      blob: Blob;
      timestamp: number;
    };
    indexes: { "by-timestamp": number };
  };
}

const DB_NAME = "radar-chmi";
const DB_VERSION = 1;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

let dbInstance: IDBPDatabase<RadarDB> | null = null;

async function getDB(): Promise<IDBPDatabase<RadarDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<RadarDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("images", { keyPath: "url" });
      store.createIndex("by-timestamp", "timestamp");
    },
  });
  return dbInstance;
}

export async function getCachedImage(url: string): Promise<string | null> {
  const db = await getDB();
  const entry = await db.get("images", url);
  if (!entry) return null;
  return URL.createObjectURL(entry.blob);
}

export async function cacheImage(url: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put("images", { url, blob, timestamp: Date.now() });
}

export async function cleanOldImages(): Promise<void> {
  const db = await getDB();
  const cutoff = Date.now() - SIX_HOURS_MS;
  const tx = db.transaction("images", "readwrite");
  const index = tx.store.index("by-timestamp");
  let cursor = await index.openCursor();

  while (cursor) {
    if (cursor.value.timestamp < cutoff) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }

  await tx.done;
}

export async function fetchAndCacheImage(url: string): Promise<string | null> {
  const cached = await getCachedImage(url);
  if (cached) return cached;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    await cacheImage(url, blob);
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
