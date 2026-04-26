'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { User } from '@supabase/supabase-js'
import CalendarView from '@/components/CalendarView'
import Loader from '@/components/Loader'
import FeedbackForm from '@/components/FeedbackForm'
import StaggeredMenu from '@/components/StaggeredMenu'

interface TrackerItem {
  id: string
  title: string
  description: string | null
}

interface TrackerEntry {
  item_id: string
  status: 'completed' | 'partial' | 'not'
  description?: string
}

const monthCache: { [key: string]: { [date: string]: number } } = {}

function TrackerNewPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [monthEntries, setMonthEntries] = useState<{ [date: string]: number }>({})
  const [dayEntries, setDayEntries] = useState<{ [itemId: string]: TrackerEntry }>({})
  const [trackerItems, setTrackerItems] = useState<TrackerItem[]>([])
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [showManageItems, setShowManageItems] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const formatLocalDate = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const loadTrackerItems = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('tracker_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setTrackerItems(data)
    }
  }, [user, supabase])

  const loadMonthEntries = useCallback(async () => {
    if (!user) return

    const cacheKey = `${currentYear}-${currentMonth}`
    if (monthCache[cacheKey]) {
      setMonthEntries(monthCache[cacheKey])
      return
    }

    const firstDay = formatLocalDate(new Date(currentYear, currentMonth, 1))
    const lastDay = formatLocalDate(new Date(currentYear, currentMonth + 1, 0))

    const { data, error } = await supabase
      .from('tracker_entries')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .lte('date', lastDay)

    if (!error && data) {
      const entries: { [date: string]: number } = {}
      data.forEach((entry: { date: string }) => {
        if (!entries[entry.date]) entries[entry.date] = 0
        entries[entry.date]++
      })
      monthCache[cacheKey] = entries
      setMonthEntries(entries)
    }
  }, [user, currentYear, currentMonth, supabase])

  const loadDayEntries = useCallback(async (date: Date) => {
    if (!user) return

    const dateStr = formatLocalDate(date)
    const { data, error } = await supabase
      .from('tracker_entries')
      .select('tracker_item_id, status, description')
      .eq('user_id', user.id)
      .eq('date', dateStr)

    if (!error && data) {
      const entries: { [itemId: string]: TrackerEntry } = {}
      data.forEach((entry: { tracker_item_id: string; status: 'completed' | 'partial' | 'not'; description?: string }) => {
        entries[entry.tracker_item_id] = {
          item_id: entry.tracker_item_id,
          status: entry.status,
          description: entry.description
        }
      })
      setDayEntries(entries)
    } else {
      setDayEntries({})
    }
  }, [user, supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setIsAdmin(user.email === 'amusman9705@gmail.com')
      setLoading(false)
    }
    init()
  }, [supabase, router])

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        await loadTrackerItems()
        await loadMonthEntries()
      }
      loadData()
    }
  }, [user, loadTrackerItems, loadMonthEntries])

  useEffect(() => {
    if (selectedDate && user) {
      const loadDay = async () => {
        await loadDayEntries(selectedDate)
      }
      loadDay()
    }
  }, [selectedDate, user, loadDayEntries])

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleSaveEntry = async (itemId: string, status: 'completed' | 'partial' | 'not', description?: string) => {
    if (!user || !selectedDate) return

    const dateStr = formatLocalDate(selectedDate)

    const { error } = await supabase
      .from('tracker_entries')
      .upsert({
        user_id: user.id,
        tracker_item_id: itemId,
        date: dateStr,
        status,
        description: description || null
      })

    if (!error) {
      Object.keys(monthCache).forEach(key => delete monthCache[key])
      await loadMonthEntries()
      await loadDayEntries(selectedDate)
    }
  }

  const handleAddItem = async () => {
    if (!user || !newItemTitle.trim()) return

    const { error } = await supabase
      .from('tracker_items')
      .insert({
        user_id: user.id,
        title: newItemTitle,
        description: newItemDescription || null
      })

    if (!error) {
      setNewItemTitle('')
      setNewItemDescription('')
      await loadTrackerItems()
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return

    const { error } = await supabase
      .from('tracker_items')
      .delete()
      .eq('id', itemId)

    if (!error) {
      await loadTrackerItems()
      Object.keys(monthCache).forEach(key => delete monthCache[key])
      await loadMonthEntries()
      if (selectedDate) {
        await loadDayEntries(selectedDate)
      }
    }
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1)
      setCurrentMonth(11)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1)
      setCurrentMonth(0)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="relative min-h-screen bg-white pb-20">
      <StaggeredMenu
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Statistics', href: '/stats' },
          { label: 'Tracker', href: '/tracker-new' },
          ...(isAdmin ? [{ label: 'Attendance', href: '/attendance' }] : []),
          { label: 'Settings', href: '/settings' },
          { label: 'Feedback', onClick: () => setShowFeedbackForm(true) },
          { label: 'Sign Out', onClick: () => router.push('/login') }
        ]}
        position="left"
      />

      <div className="max-w-4xl mx-auto p-6 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Daily Tracker</h1>
          <p className="text-zinc-600">Track your daily goals and habits</p>
        </div>

        {/* Manage Items Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowManageItems(!showManageItems)}
            className="px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors shadow-[4px_4px_0_0_#323232]"
          >
            {showManageItems ? 'Hide' : 'Manage'} Tracker Items
          </button>
        </div>

        {/* Manage Items Section */}
        {showManageItems && (
          <div className="mb-8 p-6 rounded-lg border-2 border-zinc-900 bg-zinc-50 shadow-[4px_4px_0_0_#323232]">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Your Tracker Items</h2>
            
            {/* Add New Item */}
            <div className="mb-6 p-4 bg-white rounded-lg border-2 border-zinc-900">
              <h3 className="text-lg font-semibold text-zinc-900 mb-3">Add New Item</h3>
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Item title (e.g., Exercise, Read, Meditate)"
                className="w-full px-4 py-2 mb-3 border-2 border-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <textarea
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full px-4 py-2 mb-3 border-2 border-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
              >
                Add Item
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {trackerItems.length === 0 ? (
                <p className="text-zinc-600 text-center py-4">No tracker items yet. Add one above!</p>
              ) : (
                trackerItems.map((item) => (
                  <div key={item.id} className="p-4 bg-white rounded-lg border-2 border-zinc-900 flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-zinc-900">{item.title}</h4>
                      {item.description && <p className="text-sm text-zinc-600 mt-1">{item.description}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {/* Month Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="px-4 py-2 bg-white border-2 border-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors shadow-[2px_2px_0_0_#323232]"
          >
            ← Previous
          </button>
          <h3 className="text-xl font-semibold text-zinc-900">
            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={handleNextMonth}
            className="px-4 py-2 bg-white border-2 border-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors shadow-[2px_2px_0_0_#323232]"
          >
            Next →
          </button>
        </div>
        {/* Calendar View */}
        <CalendarView
          year={currentYear}
          month={currentMonth}
          entries={monthEntries}
          onDateClick={handleDateClick}
        />

        {/* Day Entries */}
        {selectedDate && (
          <div className="mt-8 p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              Tracker for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>

            {trackerItems.length === 0 ? (
              <p className="text-zinc-600 text-center py-8">
                No tracker items yet. Click &quot;Manage Tracker Items&quot; to add some!
              </p>
            ) : (
              <div className="space-y-4">
                {trackerItems.map((item) => {
                  const entry = dayEntries[item.id]
                  return (
                    <TrackerItemCard
                      key={item.id}
                      item={item}
                      entry={entry}
                      onSave={handleSaveEntry}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showFeedbackForm && <FeedbackForm onClose={() => setShowFeedbackForm(false)} />}
    </div>
  )
}

export default dynamic(() => Promise.resolve(TrackerNewPage), { ssr: false })

function TrackerItemCard({
  item,
  entry,
  onSave
}: {
  item: TrackerItem
  entry?: TrackerEntry
  onSave: (itemId: string, status: 'completed' | 'partial' | 'not', description?: string) => void
}) {
  const [status, setStatus] = useState<'completed' | 'partial' | 'not'>('not')
  const [description, setDescription] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Update state when entry changes
  useEffect(() => {
    const updateState = () => {
      if (entry) {
        setStatus(entry.status)
        setDescription(entry.description || '')
      } else {
        setStatus('not')
        setDescription('')
      }
    }
    updateState()
  }, [entry])

  const handleSave = () => {
    onSave(item.id, status, description)
    setIsEditing(false)
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-100 border-green-600 text-green-900'
      case 'partial': return 'bg-yellow-100 border-yellow-600 text-yellow-900'
      case 'not': return 'bg-red-100 border-red-600 text-red-900'
      default: return 'bg-zinc-100 border-zinc-600 text-zinc-900'
    }
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor(status)}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{item.title}</h3>
          {item.description && <p className="text-sm opacity-80 mt-1">{item.description}</p>}
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-1 bg-white rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors border-2 border-zinc-900"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setStatus('completed')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                  status === 'completed' ? 'bg-green-600 text-white border-green-600' : 'bg-white border-zinc-900'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatus('partial')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                  status === 'partial' ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-white border-zinc-900'
                }`}
              >
                Partial
              </button>
              <button
                onClick={() => setStatus('not')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                  status === 'not' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-zinc-900'
                }`}
              >
                Not Done
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this task..."
              rows={3}
              className="w-full px-4 py-2 border-2 border-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
          >
            Save
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Status:</span>
            <span className="text-sm font-semibold uppercase">{status}</span>
          </div>
          {description && (
            <div className="mt-2 p-3 bg-white bg-opacity-50 rounded-lg">
              <p className="text-sm">{description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
