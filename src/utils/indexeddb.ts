import * as idb from 'idb'

import { IndexedDBKey } from '~/constants/storage'

const DB_NAME = '@sequence-recovery'

export const getIndexedDB = async (objectStoreKey: IndexedDBKey): Promise<idb.IDBPDatabase<any>> => {
  let db: idb.IDBPDatabase<any> | null = null
  try {
    // Open the database without specifying a version to get the current version
    db = await idb.openDB(DB_NAME)
    
    if (db.objectStoreNames.contains(objectStoreKey)) {
      // If the object store exists, return the db without closing it
      return db
    }

    // If the object store does not exist, close the current connection
    const currentVersion = db.version
    db.close()

    // Open the database with an incremented version to add the new object store
    db = await idb.openDB(DB_NAME, currentVersion + 1, {
      upgrade(upgradeDb) {
        if (!upgradeDb.objectStoreNames.contains(objectStoreKey)) {
          upgradeDb.createObjectStore(objectStoreKey)
        }
      },
    })

    return db
  } catch (error) {
    console.error('Error accessing IndexedDB:', error)
    throw error
  }
  // Removed the finally block to prevent closing the db when it's returned
}

export const clearIndexedDB = async (objectStoreKey: IndexedDBKey): Promise<void> => {
  let db: idb.IDBPDatabase<any> | null = null
  try {
    db = await getIndexedDB(objectStoreKey)
    if (db.objectStoreNames.contains(objectStoreKey)) {
      const tx = db.transaction(objectStoreKey, 'readwrite')
      const store = tx.objectStore(objectStoreKey)
      await store.clear()
      await tx.done
    }
  } catch (error) {
    console.error(`Failed to clear object store "${objectStoreKey}":`, error)
    throw error
  } finally {
    if (db) {
      db.close()
    }
  }
}