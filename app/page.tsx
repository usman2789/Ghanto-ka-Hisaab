'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { User } from '@supabase/supabase-js'
import CalendarView from '@/components/CalendarView'
import Loader from '@/components/Loader'
import {
  initDB,
  isOnline,
  addPendingEntry,
  addPendingUserTagAction,
  cacheSingleEntry,
  cacheHourEntries,
  cacheSingleUserPredefinedTag,
  cacheUserPredefinedTags,
  clearCachedUserPredefinedTags,
  getMergedEntriesForDate,
  getMergedMonthEntries,
  getMergedUserPredefinedTags,
  removeCachedUserPredefinedTag
} from '@/utils/offlineSync'

const HourTracker = dynamic(() => import('@/components/HourTracker'))
const FeedbackForm = dynamic(() => import('@/components/FeedbackForm'))
const OfflineSyncManager = dynamic(() => import('@/components/OfflineSyncManager'), { ssr: false })
const StaggeredMenu = dynamic(() => import('@/components/StaggeredMenu'), { ssr: false })

interface HourEntry {
  hour: number
  tags: string[]
  details?: string
}

interface UserPredefinedTagRow {
  user_id: string
  tag: string
}

// Cache to persist month data
const monthCache: { [key: string]: { [date: string]: number } } = {}

function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [monthEntries, setMonthEntries] = useState<{ [date: string]: number }>({})
  const [dayEntries, setDayEntries] = useState<{ [hour: number]: HourEntry }>({})
  const [userPredefinedTags, setUserPredefinedTags] = useState<string[]>([])
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const normalizeTag = (tag: string) => tag.trim().replace(/\s+/g, ' ')

  const mergeUniqueTags = (tags: string[]) => {
    const uniqueTags: string[] = []

    tags.forEach((tag) => {
      const normalizedTag = normalizeTag(tag)
      if (!normalizedTag) return

      const exists = uniqueTags.some(
        (existingTag) => existingTag.toLowerCase() === normalizedTag.toLowerCase()
      )

      if (!exists) {
        uniqueTags.push(normalizedTag)
      }
    })

    return uniqueTags
  }

  const loadUserPredefinedTags = useCallback(async () => {
    if (!user) return

    if (!isOnline()) {
      try {
        const offlineTags = await getMergedUserPredefinedTags(user.id)
        setUserPredefinedTags(mergeUniqueTags(offlineTags))
      } catch (e) {
        console.error('Error loading offline saved tags:', e)
      }
      return
    }

    const { data, error } = await supabase
      .from('user_predefined_tags')
      .select('user_id, tag')
      .order('created_at', { ascending: true })

    if (!error && data) {
      const rows = data as UserPredefinedTagRow[]

      try {
        await clearCachedUserPredefinedTags(user.id)
        await cacheUserPredefinedTags(rows)
      } catch (e) {
        console.error('Error caching saved tags:', e)
      }

      const mergedTags = await getMergedUserPredefinedTags(user.id)
      setUserPredefinedTags(mergeUniqueTags(mergedTags))
    }
  }, [user, supabase])

  // Load month entries - now supports offline data
  const loadMonthEntries = useCallback(async () => {
    if (!user) return
    
    const cacheKey = `${currentYear}-${currentMonth}`
    
    // Check if data is already cached in memory
    if (monthCache[cacheKey] && isOnline()) {
      setMonthEntries(monthCache[cacheKey])
      return
    }

    // If offline, use merged local data
    if (!isOnline()) {
      try {
        const mergedEntries = await getMergedMonthEntries(currentYear, currentMonth, user.id)
        setMonthEntries(mergedEntries)
      } catch (e) {
        console.error('Error loading offline entries:', e)
      }
      return
    }

    // Online: fetch from Supabase - use local date format to avoid timezone issues
    const firstDay = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
    const lastDay = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`

    const { data, error } = await supabase
      .from('hour_entries')
      .select('date, hour')
      .gte('date', firstDay)
      .lte('date', lastDay)

    if (!error && data) {
      const entries: { [date: string]: number } = {}
      data.forEach((entry: { date: string; hour: number }) => {
        if (!entries[entry.date]) entries[entry.date] = 0
        entries[entry.date]++
      })
      // Cache the data
      monthCache[cacheKey] = entries
      
      // Also merge with any pending offline entries
      try {
        const mergedEntries = await getMergedMonthEntries(currentYear, currentMonth, user.id)
        // Merge online data with offline pending
        Object.keys(mergedEntries).forEach(date => {
          if (!entries[date] || mergedEntries[date] > entries[date]) {
            entries[date] = mergedEntries[date]
          }
        })
      } catch (e) {
        console.error('Error merging offline entries:', e)
      }
      
      setMonthEntries(entries)
    }
  }, [currentYear, currentMonth, user, supabase])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const sessionPromise = supabase.auth.getSession()
      await initDB()

      const {
        data: { session }
      } = await sessionPromise

      if (!isMounted) return

      setUser(session?.user ?? null)
      setLoading(false)

      if (isOnline()) {
        try {
          const {
            data: { user: freshUser }
          } = await supabase.auth.getUser()

          if (isMounted && freshUser) {
            setUser(freshUser)
          }
        } catch (error) {
          console.error('Error refreshing user session:', error)
        }
      }
    }

    init()

    // Listen for online/offline events
    const handleOnline = async () => {
      setIsOffline(false)

      try {
        const {
          data: { user: freshUser }
        } = await supabase.auth.getUser()

        if (isMounted) {
          setUser(freshUser ?? null)
        }
      } catch (error) {
        console.error('Error refreshing user on reconnect:', error)
      }
    }

    const handleOffline = () => setIsOffline(true)
    
    // Initialize offline state
    const checkOnlineStatus = () => {
      setIsOffline(!isOnline())
    }
    checkOnlineStatus()
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null)
      }
    })
    
    return () => {
      isMounted = false
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [supabase])

  // Load month entries when user or month changes
  useEffect(() => {
    if (user) {
      loadMonthEntries()
      loadUserPredefinedTags()
    } else {
      setUserPredefinedTags([])
    }
  }, [user, currentYear, currentMonth, isOffline, loadMonthEntries, loadUserPredefinedTags])

  useEffect(() => {
    if (!loading && !user && !isOffline) {
      router.replace('/login')
    }
  }, [loading, user, isOffline, router])

  // Helper to format date in local timezone
  const formatLocalDate = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const loadDayEntries = async (date: Date) => {
    if (!user) return
    
    const dateStr = formatLocalDate(date)
    
    // If offline, use merged local data
    if (!isOnline()) {
      try {
        const merged = await getMergedEntriesForDate(dateStr, user.id)
        const entries: { [hour: number]: HourEntry } = {}
        Object.keys(merged).forEach(hourKey => {
          const hour = parseInt(hourKey)
          const entry = merged[hour]
          entries[hour] = {
            hour: entry.hour,
            tags: entry.tags || [],
            details: entry.details
          }
        })
        setDayEntries(entries)
      } catch (e) {
        console.error('Error loading offline day entries:', e)
        setDayEntries({})
      }
      return
    }

    // Online: fetch from Supabase
    const { data, error } = await supabase
      .from('hour_entries')
      .select('*')
      .eq('date', dateStr)

    if (!error && data) {
      const entries: { [hour: number]: HourEntry } = {}
      
      // Cache entries for offline use
      const cacheEntries = data.map((entry: { id: string; date: string; hour: number; tags: string[]; details?: string; user_id: string }) => ({
        id: entry.id,
        date: entry.date,
        hour: entry.hour,
        tags: entry.tags || [],
        details: entry.details,
        user_id: entry.user_id
      }))
      
      try {
        await cacheHourEntries(cacheEntries)
      } catch (e) {
        console.error('Error caching entries:', e)
      }
      
      data.forEach((entry: { hour: number; tags: string[]; details?: string }) => {
        entries[entry.hour] = {
          hour: entry.hour,
          tags: entry.tags || [],
          details: entry.details
        }
      })
      
      // Also merge with any pending offline entries
      try {
        const merged = await getMergedEntriesForDate(dateStr, user.id)
        Object.keys(merged).forEach(hourKey => {
          const hour = parseInt(hourKey)
          const entry = merged[hour]
          entries[hour] = {
            hour: entry.hour,
            tags: entry.tags || [],
            details: entry.details
          }
        })
      } catch (e) {
        console.error('Error merging offline day entries:', e)
      }
      
      setDayEntries(entries)
    } else {
      setDayEntries({})
    }
  }

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date)
    await loadDayEntries(date)
  }

  const handleSaveHour = async (hour: number, tags: string[], details?: string) => {
    if (!selectedDate || !user) return

    const dateStr = formatLocalDate(selectedDate)
    
    // If offline, save to IndexedDB
    if (!isOnline()) {
      try {
        await addPendingEntry(dateStr, hour, tags, details, user.id)
        
        // Also cache locally for immediate display
        await cacheSingleEntry({
          id: `pending-${Date.now()}`,
          date: dateStr,
          hour,
          tags,
          details,
          user_id: user.id
        })
        
        // Invalidate memory cache
        const cacheKey = `${currentYear}-${currentMonth}`
        delete monthCache[cacheKey]
        
        await Promise.all([loadDayEntries(selectedDate), loadMonthEntries()])
        return
      } catch (e) {
        console.error('Error saving offline:', e)
        return
      }
    }
    
    // Online: save to Supabase
    const { error } = await supabase
      .from('hour_entries')
      .upsert({
        date: dateStr,
        hour,
        tags,
        details: details || null,
        user_id: user.id
      }, {
        onConflict: 'user_id,date,hour'
      })

    if (!error) {
      // Also cache locally
      try {
        await cacheSingleEntry({
          id: `${user.id}-${dateStr}-${hour}`,
          date: dateStr,
          hour,
          tags,
          details,
          user_id: user.id
        })
      } catch (e) {
        console.error('Error caching entry:', e)
      }
      
      // Invalidate cache for the current month
      const cacheKey = `${currentYear}-${currentMonth}`
      delete monthCache[cacheKey]
      
      await Promise.all([loadDayEntries(selectedDate), loadMonthEntries()])
    }
  }

  const handleAddUserPredefinedTag = async (tag: string) => {
    if (!user) return

    const normalizedTag = normalizeTag(tag)
    if (!normalizedTag) return

    setUserPredefinedTags((prev) => mergeUniqueTags([...prev, normalizedTag]))

    try {
      await cacheSingleUserPredefinedTag({
        user_id: user.id,
        tag: normalizedTag
      })
    } catch (e) {
      console.error('Error caching saved tag:', e)
    }

    if (!isOnline()) {
      try {
        await addPendingUserTagAction(normalizedTag, user.id, 'upsert')
      } catch (e) {
        console.error('Error queueing saved tag:', e)
      }
      return
    }

    const { error } = await supabase
      .from('user_predefined_tags')
      .upsert(
        {
          user_id: user.id,
          tag: normalizedTag
        },
        {
          onConflict: 'user_id,tag'
        }
      )

    if (error) {
      console.error('Error saving user predefined tag:', error)
      await loadUserPredefinedTags()
    }
  }

  const handleDeleteUserPredefinedTag = async (tag: string) => {
    if (!user) return

    const normalizedTag = normalizeTag(tag)
    if (!normalizedTag) return

    setUserPredefinedTags((prev) =>
      prev.filter((savedTag) => savedTag.toLowerCase() !== normalizedTag.toLowerCase())
    )

    try {
      await removeCachedUserPredefinedTag(user.id, normalizedTag)
    } catch (e) {
      console.error('Error removing cached saved tag:', e)
    }

    if (!isOnline()) {
      try {
        await addPendingUserTagAction(normalizedTag, user.id, 'delete')
      } catch (e) {
        console.error('Error queueing saved tag deletion:', e)
      }
      return
    }

    const { error } = await supabase
      .from('user_predefined_tags')
      .delete()
      .eq('user_id', user.id)
      .eq('tag', normalizedTag)

    if (error) {
      console.error('Error deleting user predefined tag:', error)
      await loadUserPredefinedTags()
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const changeMonth = (delta: number) => {
    let newMonth = currentMonth + delta
    let newYear = currentYear

    if (newMonth > 11) {
      newMonth = 0
      newYear++
    } else if (newMonth < 0) {
      newMonth = 11
      newYear--
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
  }

  // Handle sync complete - reload data (must be before early returns)
  const handleSyncComplete = useCallback(() => {
    // Invalidate all month caches
    Object.keys(monthCache).forEach(key => delete monthCache[key])
    loadMonthEntries()
    loadUserPredefinedTags()
    if (selectedDate) {
      loadDayEntries(selectedDate)
    }
  }, [loadMonthEntries, loadUserPredefinedTags, selectedDate, loadDayEntries])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader />
      </div>
    )
  }

  if (!user && isOffline) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="max-w-md rounded-lg border-2 border-zinc-900 bg-white p-6 text-center shadow-[4px_4px_0_0_#323232]">
          <h1 className="text-2xl font-bold text-zinc-900">Offline Login Required</h1>
          <p className="mt-3 text-sm text-zinc-600">
            Open the app once while online so your session can be stored on this device, then it will launch offline with your cached data.
          </p>
        </div>
      </div>
    )
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Statistics', href: '/stats' },
    { label: 'Tracker', href: '/tracker-new' },
    ...(user?.email === 'amusman9705@gmail.com' ? [{ label: 'Attendance', href: '/attendance' }] : []),
    { label: 'Settings', href: '/settings' },
    { label: 'Feedback', onClick: () => setShowFeedbackForm(true) },
    { label: 'Sign Out', onClick: handleSignOut }
  ]

  return (
    <div className="min-h-screen bg-white">
      <StaggeredMenu items={menuItems} position="left" />
      
      <main className="p-4 pt-20 md:p-8 md:pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Ghanto ka Hisaab</h1>
              <p className="text-sm text-zinc-600 mt-1">
                {user?.email}
              </p>
            </div>
            {isOffline && (
              <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">
                Offline
              </span>
            )}
          </div>

        {/* Month Navigation */}
        <div className="grid grid-cols-3 items-center gap-4 mb-6 p-4 rounded-lg border-2 border-zinc-900 bg-zinc-100">
          <button
            onClick={() => changeMonth(-1)}
            className="px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white font-bold text-zinc-900 hover:bg-zinc-200 justify-self-start"
          >
            ← Prev
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 text-center">{monthName}</h2>
          <button
            onClick={() => changeMonth(1)}
            className="px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white font-bold text-zinc-900 hover:bg-zinc-200 justify-self-end"
          >
            Next →
          </button>
        </div>

        {/* Calendar */}
        <div className="mb-8">
          <CalendarView
            year={currentYear}
            month={currentMonth}
            entries={monthEntries}
            onDateClick={handleDateClick}
          />
        </div>

        {/* Legend */}
        <div className="p-4 rounded-lg border-2 border-zinc-900 bg-zinc-100 mb-8">
          <p className="text-sm font-semibold text-zinc-900 mb-2">Progress Legend:</p>
          <div className="flex flex-wrap gap-4 text-sm text-zinc-900">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-zinc-900 bg-white"></div>
              <span className="font-medium">No entries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-zinc-900 bg-red-200"></div>
              <span className="font-medium">1-7 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-zinc-900 bg-yellow-200"></div>
              <span className="font-medium">8-15 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-zinc-900 bg-green-200"></div>
              <span className="font-medium">16-24 hours</span>
            </div>
          </div>
        </div>

        {/* Feedback Info Section */}
        <div className="p-6 rounded-lg border-2 border-zinc-900 bg-gradient-to-br from-zinc-100 to-zinc-200 shadow-[4px_4px_0_0_#323232] mb-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            We&apos;d Love to Hear From You!
          </h2>
          <p className="text-sm text-zinc-600 mb-4">
            Have feedback or ideas for new features? Share your thoughts using the Feedback button above. Your input helps us make this app better for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="px-5 py-3 rounded-lg border-2 border-zinc-900 bg-zinc-900 font-semibold text-white hover:bg-zinc-800 transition-all shadow-[4px_4px_0_0_#323232]"
            >
              Share Feedback →
            </button>
          </div>
        </div>

        {/* Open Source Section */}
        <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">
                It&apos;s Open Source! 🚀
              </h2>
              <p className="text-sm text-zinc-600">
                This project is open source. Contribute, report issues, or star the repo to show your support!
              </p>
            </div>
            <a
              href="https://github.com/usman2789/Ghanto-ka-Hisaab"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border-2 border-zinc-900 bg-zinc-900 font-semibold text-white hover:bg-zinc-800 transition-all shadow-[4px_4px_0_0_#323232] whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
        </div>
      </main>

      {/* Hour Tracker Modal */}
      {selectedDate && (
        <HourTracker
          date={selectedDate}
          entries={dayEntries}
          onSave={handleSaveHour}
          userPredefinedTags={userPredefinedTags}
          onAddUserPredefinedTag={handleAddUserPredefinedTag}
          onDeleteUserPredefinedTag={handleDeleteUserPredefinedTag}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <FeedbackForm onClose={() => setShowFeedbackForm(false)} />
      )}
      
      {/* Offline Sync Manager */}
      <OfflineSyncManager userId={user?.id} onSyncComplete={handleSyncComplete} />
    </div>
  )
}

export default dynamic(() => Promise.resolve(Home), { ssr: false })
