import { openDB, DBSchema, IDBPDatabase } from "idb";
import { BoardState } from "../types/board";

const DB_NAME = "pulseboard-db";
const DB_VERSION = 1;
const STORE_NAME = "board-snapshot";
const BOARD_KEY = "current-board-state";

interface PulseBoardDBSchema extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: BoardState;
  };
}

let dbPromise: Promise<IDBPDatabase<PulseBoardDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<PulseBoardDBSchema>> | null {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB<PulseBoardDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
          console.log(`[IndexedDB] Created object store "${STORE_NAME}" in database "${DB_NAME}".`);
        }
      },
    });
  }

  return dbPromise;
}

/**
 * Persist the current board state snapshot to IndexedDB.
 */
export async function saveBoard(state: BoardState): Promise<void> {
  try {
    const db = getDB();
    if (!db) return;

    const database = await db;
    await database.put(STORE_NAME, state, BOARD_KEY);
    if (process.env.NODE_ENV !== "production") {
      console.log("[IndexedDB] Board snapshot persisted to IndexedDB.");
    }
  } catch (err) {
    console.warn("[IndexedDB] Error persisting board to IndexedDB:", err);
  }
}

/**
 * Load the last-known board state snapshot from IndexedDB.
 */
export async function loadBoard(): Promise<BoardState | undefined> {
  try {
    const db = getDB();
    if (!db) return undefined;

    const database = await db;
    const state = await database.get(STORE_NAME, BOARD_KEY);
    if (state) {
      console.log("[IndexedDB] Loaded cached board snapshot from IndexedDB.");
    }
    return state;
  } catch (err) {
    console.warn("[IndexedDB] Error loading board from IndexedDB:", err);
    return undefined;
  }
}

/**
 * Clear cached board state from IndexedDB.
 */
export async function clearBoard(): Promise<void> {
  try {
    const db = getDB();
    if (!db) return;

    const database = await db;
    await database.delete(STORE_NAME, BOARD_KEY);
    console.log("[IndexedDB] Cleared board snapshot from IndexedDB.");
  } catch (err) {
    console.warn("[IndexedDB] Error clearing board from IndexedDB:", err);
  }
}
