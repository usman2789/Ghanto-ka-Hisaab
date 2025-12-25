'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CalendarView from '@/components/CalendarView'
import HourTracker from '@/components/HourTracker'
import Loader from '@/components/Loader'

interface HourEntry {
  hour: number
  tags: string[]
  details?: string
}

// Cache to persist month data
const monthCache: { [key: string]: { [date: string]: number } } = {}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [monthEntries, setMonthEntries] = useState<{ [date: string]: number }>({})
  const [dayEntries, setDayEntries] = useState<{ [hour: number]: HourEntry }>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      if (user) {
        loadMonthEntries()
      }
    }
    getUser()

    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration)
          })
          .catch((error) => {
            console.log('SW registration failed:', error)
          })
      })
    }
  }, [currentYear, currentMonth])

  const loadMonthEntries = async () => {
    const cacheKey = `${currentYear}-${currentMonth}`
    
    // Check if data is already cached
    if (monthCache[cacheKey]) {
      setMonthEntries(monthCache[cacheKey])
      return
    }

    const firstDay = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
    const lastDay = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('hour_entries')
      .select('date, hour')
      .gte('date', firstDay)
      .lte('date', lastDay)

    if (!error && data) {
      const entries: { [date: string]: number } = {}
      data.forEach((entry: any) => {
        if (!entries[entry.date]) entries[entry.date] = 0
        entries[entry.date]++
      })
      // Cache the data
      monthCache[cacheKey] = entries
      setMonthEntries(entries)
    }
  }

  const loadDayEntries = async (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('hour_entries')
      .select('*')
      .eq('date', dateStr)

    if (!error && data) {
      const entries: { [hour: number]: HourEntry } = {}
      data.forEach((entry: any) => {
        entries[entry.hour] = {
          hour: entry.hour,
          tags: entry.tags || [],
          details: entry.details
        }
      })
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
    if (!selectedDate) return

    const dateStr = selectedDate.toISOString().split('T')[0]
    
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
      // Invalidate cache for the current month
      const cacheKey = `${currentYear}-${currentMonth}`
      delete monthCache[cacheKey]
      
      await loadDayEntries(selectedDate)
      await loadMonthEntries()
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
      newLoader /
      newYear++
    } else if (newMonth < 0) {
      newMonth = 11
      newYear--
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg font-semibold text-zinc-600">Loading...</p>
      </div>
    )
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-4 rounded-lg border-2 border-zinc-900 bg-zinc-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Ghanto ka Hisaab</h1>
            <p className="text-sm text-zinc-600 mt-1">
              Logged in as: <span className="font-semibold">{user?.email}</span>
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white font-semibold text-zinc-900 hover:bg-zinc-100 transition-all"
          >
            Sign Out
          </button>
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
        <div className="p-4 rounded-lg border-2 border-zinc-900 bg-zinc-100">
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
      </div>

      {/* Hour Tracker Modal */}
      {selectedDate && (
        <HourTracker
          date={selectedDate}
          entries={dayEntries}
          onSave={handleSaveHour}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
