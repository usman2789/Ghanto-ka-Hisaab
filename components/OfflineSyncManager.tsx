'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  initDB,
  getPendingEntries,
  getPendingUserTagActions,
  removePendingEntry,
  removePendingUserTagAction,
  getPendingCount,
  isOnline as checkOnline
} from '@/utils/offlineSync'

interface OfflineSyncManagerProps {
  userId?: string
  onSyncComplete?: () => void
}

export default function OfflineSyncManager({ userId, onSyncComplete }: OfflineSyncManagerProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | null>(null)

  const supabase = createClient()

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch (error) {
      console.error('Error getting pending count:', error)
    }
  }, [])

  // Sync pending offline changes to Supabase
  const syncPendingEntries = useCallback(async () => {
    if (!userId || syncing || !checkOnline()) return

    setSyncing(true)
    setLastSyncStatus(null)

    try {
      const [pendingEntries, pendingUserTagActions] = await Promise.all([
        getPendingEntries(),
        getPendingUserTagActions()
      ])

      if (pendingEntries.length === 0 && pendingUserTagActions.length === 0) {
        setSyncing(false)
        return
      }

      let successCount = 0
      let errorCount = 0

      for (const entry of pendingEntries) {
        try {
          if (entry.action === 'upsert') {
            const { error } = await supabase
              .from('hour_entries')
              .upsert({
                date: entry.date,
                hour: entry.hour,
                tags: entry.tags,
                details: entry.details || null,
                user_id: entry.user_id
              }, {
                onConflict: 'user_id,date,hour'
              })

            if (!error) {
              await removePendingEntry(entry.id)
              successCount++
            } else {
              console.error('Sync error for entry:', error)
              errorCount++
            }
          }
        } catch (err) {
          console.error('Error syncing entry:', err)
          errorCount++
        }
      }

      for (const action of pendingUserTagActions) {
        try {
          if (action.action === 'upsert') {
            const { error } = await supabase
              .from('user_predefined_tags')
              .upsert(
                {
                  user_id: action.user_id,
                  tag: action.tag
                },
                {
                  onConflict: 'user_id,tag'
                }
              )

            if (!error) {
              await removePendingUserTagAction(action.id)
              successCount++
            } else {
              console.error('Sync error for saved tag:', error)
              errorCount++
            }
          }

          if (action.action === 'delete') {
            const { error } = await supabase
              .from('user_predefined_tags')
              .delete()
              .eq('user_id', action.user_id)
              .eq('tag', action.tag)

            if (!error) {
              await removePendingUserTagAction(action.id)
              successCount++
            } else {
              console.error('Delete sync error for saved tag:', error)
              errorCount++
            }
          }
        } catch (err) {
          console.error('Error syncing saved tag:', err)
          errorCount++
        }
      }

      await updatePendingCount()
      setLastSyncStatus(errorCount === 0 ? 'success' : 'error')

      if (successCount > 0 && onSyncComplete) {
        onSyncComplete()
      }
    } catch (error) {
      console.error('Sync failed:', error)
      setLastSyncStatus('error')
    } finally {
      setSyncing(false)
    }
  }, [userId, syncing, supabase, updatePendingCount, onSyncComplete])

  // Initialize DB and check pending entries
  useEffect(() => {
    const init = async () => {
      await initDB()
      await updatePendingCount()
    }
    init()
  }, [updatePendingCount])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-sync when coming online
      syncPendingEntries()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // Initial check
    setIsOnline(checkOnline())

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncPendingEntries])

  // Periodically check for pending entries and sync
  useEffect(() => {
    const interval = setInterval(() => {
      updatePendingCount()
      if (checkOnline() && pendingCount > 0) {
        syncPendingEntries()
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [pendingCount, syncPendingEntries, updatePendingCount])

  // Don't show anything if no pending entries and online
  if (isOnline && pendingCount === 0 && !lastSyncStatus) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-zinc-900 shadow-[4px_4px_0_0_#323232] ${
        !isOnline 
          ? 'bg-yellow-100' 
          : syncing 
          ? 'bg-blue-100' 
          : lastSyncStatus === 'success' 
          ? 'bg-green-100' 
          : lastSyncStatus === 'error'
          ? 'bg-red-100'
          : 'bg-white'
      }`}>
        {/* Status Icon */}
        {!isOnline ? (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
        ) : syncing ? (
          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : lastSyncStatus === 'success' ? (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}

        {/* Status Text */}
        <div className="text-sm font-semibold text-zinc-900">
          {!isOnline ? (
            <span>Offline Mode {pendingCount > 0 && `(${pendingCount} pending)`}</span>
          ) : syncing ? (
            <span>Syncing {pendingCount} changes...</span>
          ) : lastSyncStatus === 'success' ? (
            <span>Synced successfully!</span>
          ) : pendingCount > 0 ? (
            <span>{pendingCount} changes pending sync</span>
          ) : (
            <span>All synced</span>
          )}
        </div>

        {/* Manual Sync Button */}
        {isOnline && pendingCount > 0 && !syncing && (
          <button
            onClick={syncPendingEntries}
            className="ml-2 px-2 py-1 text-xs font-bold bg-zinc-900 text-white rounded hover:bg-zinc-700"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  )
}

// Hook for other components to trigger pending count update
export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(() => checkOnline())

  const updateCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch (error) {
      console.error('Error updating pending count:', error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await initDB()
      await updateCount()
    }
    init()

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [updateCount])

  return { pendingCount, isOnline, updateCount }
}
