import * as idb from 'idb'

import { IndexedDBKey } from '../constants/storage'

const DB_NAME = '@sequence-recovery'
const DB_VERSION = 1

export const getIndexedDB = async (objectStoreKey: IndexedDBKey) => {
  // Open or create database
  return idb.openDB(DB_NAME, DB_VERSION, {
    upgrade: db => {
      db.createObjectStore(objectStoreKey)
    }
  })
}

export const clearIndexedDB = async (objectStoreKey: IndexedDBKey) => {
  const db = await getIndexedDB(objectStoreKey)
  await db.clear('security')
}
