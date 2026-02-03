import * as idb from 'idb'

const DB_NAME = '@sequence-recovery'

/**
 * Clears all application state including:
 * - All localStorage items
 * - All IndexedDB databases
 * - Sequence cache IndexedDB
 */
export const clearAllState = async (): Promise<void> => {
  try {
    // Clear localStorage
    localStorage.clear()

    // Clear main IndexedDB database
    try {
      const db = await idb.openDB(DB_NAME)
      const objectStoreNames = Array.from(db.objectStoreNames)
      db.close()

      // Clear each object store
      for (const storeName of objectStoreNames) {
        try {
          const db = await idb.openDB(DB_NAME)
          if (db.objectStoreNames.contains(storeName)) {
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            await store.clear()
            await tx.done
          }
          db.close()
        } catch (error) {
          console.warn(`Failed to clear object store "${storeName}":`, error)
        }
      }
    } catch (error) {
      console.warn('Failed to access main IndexedDB:', error)
    }

    // Clear Sequence cache database
    try {
      await idb.deleteDB('sequence-cache')
    } catch (error) {
      console.warn('Failed to delete sequence-cache database:', error)
    }

    console.log('All application state cleared')
  } catch (error) {
    console.error('Error clearing application state:', error)
    throw error
  }
}
