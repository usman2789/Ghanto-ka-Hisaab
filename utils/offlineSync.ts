'use client'

// Offline sync utility using IndexedDB for storing hour entries when offline

const DB_NAME = 'ghanto-hisaab-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending_entries'
const HOUR_ENTRIES_STORE = 'hour_entries_cache'

interface PendingEntry {
  id: string
  date: string
  hour: number
  tags: string[]
  details?: string
  user_id: string
  timestamp: number
  action: 'upsert' | 'delete'
}

interface CachedHourEntry {
  id: string
  date: string
  hour: number
  tags: string[]
  details?: string
  user_id: string
}

let db: IDBDatabase | null = null

// Initialize IndexedDB
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Store for pending sync entries
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('date_hour', ['date', 'hour'], { unique: false })
      }

      // Store for cached hour entries (for offline viewing)
      if (!database.objectStoreNames.contains(HOUR_ENTRIES_STORE)) {
        const cacheStore = database.createObjectStore(HOUR_ENTRIES_STORE, { keyPath: 'id' })
        cacheStore.createIndex('date', 'date', { unique: false })
        cacheStore.createIndex('user_date_hour', ['user_id', 'date', 'hour'], { unique: true })
      }
    }
  })
}

// Generate a unique ID for pending entries
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Check if we're online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// Add a pending entry to be synced when online
export async function addPendingEntry(
  date: string,
  hour: number,
  tags: string[],
  details: string | undefined,
  user_id: string
): Promise<void> {
  const database = await initDB()

  const entry: PendingEntry = {
    id: generateId(),
    date,
    hour,
    tags,
    details,
    user_id,
    timestamp: Date.now(),
    action: 'upsert'
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(entry)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get all pending entries
export async function getPendingEntries(): Promise<PendingEntry[]> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Remove a pending entry after successful sync
export async function removePendingEntry(id: string): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Clear all pending entries
export async function clearPendingEntries(): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Cache hour entries for offline viewing
export async function cacheHourEntries(entries: CachedHourEntry[]): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([HOUR_ENTRIES_STORE], 'readwrite')
    const store = transaction.objectStore(HOUR_ENTRIES_STORE)

    entries.forEach(entry => {
      store.put(entry)
    })

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// Cache a single hour entry
export async function cacheSingleEntry(entry: CachedHourEntry): Promise<void> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([HOUR_ENTRIES_STORE], 'readwrite')
    const store = transaction.objectStore(HOUR_ENTRIES_STORE)
    const request = store.put(entry)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get cached entries for a specific date
export async function getCachedEntriesForDate(date: string): Promise<CachedHourEntry[]> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([HOUR_ENTRIES_STORE], 'readonly')
    const store = transaction.objectStore(HOUR_ENTRIES_STORE)
    const index = store.index('date')
    const request = index.getAll(date)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Get all cached entries
export async function getAllCachedEntries(): Promise<CachedHourEntry[]> {
  const database = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([HOUR_ENTRIES_STORE], 'readonly')
    const store = transaction.objectStore(HOUR_ENTRIES_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Get pending entries count
export async function getPendingCount(): Promise<number> {
  const entries = await getPendingEntries()
  return entries.length
}

// Merge pending entries with cached entries for display
export async function getMergedEntriesForDate(
  date: string,
  userId: string
): Promise<{ [hour: number]: CachedHourEntry }> {
  const cached = await getCachedEntriesForDate(date)
  const pending = await getPendingEntries()

  const entries: { [hour: number]: CachedHourEntry } = {}

  // First add cached entries
  cached.forEach(entry => {
    if (entry.user_id === userId) {
      entries[entry.hour] = entry
    }
  })

  // Then overlay pending entries (they take priority)
  pending
    .filter(p => p.date === date && p.user_id === userId && p.action === 'upsert')
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach(entry => {
      entries[entry.hour] = {
        id: entry.id,
        date: entry.date,
        hour: entry.hour,
        tags: entry.tags,
        details: entry.details,
        user_id: entry.user_id
      }
    })

  return entries
}

// Get merged month entries count (cached + pending)
export async function getMergedMonthEntries(
  year: number,
  month: number,
  userId: string
): Promise<{ [date: string]: number }> {
  const allCached = await getAllCachedEntries()
  const pending = await getPendingEntries()

  // Use local date format to avoid timezone shifts
  const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`

  const entries: { [date: string]: Set<number> } = {}

  // Add cached entries
  allCached
    .filter(e => e.user_id === userId && e.date >= firstDay && e.date <= lastDay)
    .forEach(entry => {
      if (!entries[entry.date]) entries[entry.date] = new Set()
      entries[entry.date].add(entry.hour)
    })

  // Add pending entries
  pending
    .filter(p => p.user_id === userId && p.date >= firstDay && p.date <= lastDay && p.action === 'upsert')
    .forEach(entry => {
      if (!entries[entry.date]) entries[entry.date] = new Set()
      entries[entry.date].add(entry.hour)
    })

  // Convert sets to counts
  const result: { [date: string]: number } = {}
  Object.keys(entries).forEach(date => {
    result[date] = entries[date].size
  })

  return result
}
