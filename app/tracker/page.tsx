'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StaggeredMenu from '@/components/StaggeredMenu'
import Loader from '@/components/Loader'
import FeedbackForm from '@/components/FeedbackForm'

interface TrackerItem {
  id: string
  title: string
  description: string | null
  created_at: string
}

interface DailyLog {
  [itemId: string]: boolean
}

export default function TrackerPage() {
  const [loading, setLoading] = useState(true)
  const [trackerItems, setTrackerItems] = useState<TrackerItem[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLog>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const formatLocalDate = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const loadTrackerItems = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('tracker_items')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTrackerItems(data)
    }
  }, [supabase])

  const loadDailyLogs = useCallback(async (uid: string, date: Date) => {
    const dateStr = formatLocalDate(date)
    const { data, error } = await supabase
      .from('tracker_logs')
      .select('tracker_item_id, checked')
      .eq('user_id', uid)
      .eq('date', dateStr)

    if (!error && data) {
      const logs: DailyLog = {}
      data.forEach(log => {
        logs[log.tracker_item_id] = log.checked
      })
      setDailyLogs(logs)
    } else {
      setDailyLogs({})
    }
  }, [supabase])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      await loadTrackerItems(user.id)
      await loadDailyLogs(user.id, selectedDate)
      setLoading(false)
    }
    getUser()
  }, [router, supabase, selectedDate, loadTrackerItems, loadDailyLogs])

  const handleAddItem = async () => {
    if (!userId || !newTitle.trim()) return
    
    setSaving(true)
    const { error } = await supabase
      .from('tracker_items')
      .insert({
        user_id: userId,
        title: newTitle.trim(),
        description: newDescription.trim() || null
      })

    if (!error) {
      setNewTitle('')
      setNewDescription('')
      setShowAddForm(false)
      await loadTrackerItems(userId)
    }
    setSaving(false)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this tracker item? All tracking history will be lost.')) return
    
    const { error } = await supabase
      .from('tracker_items')
      .delete()
      .eq('id', itemId)

    if (!error && userId) {
      await loadTrackerItems(userId)
    }
  }

  const handleToggleCheck = async (itemId: string) => {
    if (!userId) return
    
    const dateStr = formatLocalDate(selectedDate)
    const currentState = dailyLogs[itemId] || false
    const newState = !currentState

    // Optimistically update UI
    setDailyLogs(prev => ({ ...prev, [itemId]: newState }))

    // Check if log exists
    const { data: existing } = await supabase
      .from('tracker_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('tracker_item_id', itemId)
      .eq('date', dateStr)
      .single()

    if (existing) {
      // Update existing
      await supabase
        .from('tracker_logs')
        .update({ checked: newState })
        .eq('id', existing.id)
    } else {
      // Insert new
      await supabase
        .from('tracker_logs')
        .insert({
          user_id: userId,
          tracker_item_id: itemId,
          date: dateStr,
          checked: newState
        })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader />
      </div>
    )
  }

  const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Statistics', href: '/stats' },
    { label: 'Tracker', href: '/tracker' },
    { label: 'Settings', href: '/settings' },
    { label: 'Feedback', onClick: () => setShowFeedbackForm(true) },
    { label: 'Sign Out', onClick: handleSignOut }
  ]

  const checkedCount = Object.values(dailyLogs).filter(v => v).length
  const totalCount = trackerItems.length

  return (
    <div className="min-h-screen bg-white">
      <StaggeredMenu items={menuItems} position="left" />
      
      <main className="p-4 pt-20 md:p-8 md:pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Daily Tracker</h1>
            <p className="text-sm text-zinc-600 mt-1">
              Track your daily habits and goals
            </p>
          </div>

          {/* Date Selector */}
          <div className="mb-6 p-4 rounded-lg border-2 border-zinc-900 bg-zinc-100">
            <label className="block text-sm font-semibold text-zinc-900 mb-2">Select Date</label>
            <input
              type="date"
              value={formatLocalDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              className="w-full px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900 font-medium"
            />
          </div>

          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg border-2 border-zinc-900 bg-green-50">
              <p className="text-xs font-semibold text-zinc-600">Completed</p>
              <p className="text-2xl font-bold text-green-700">{checkedCount}</p>
            </div>
            <div className="p-4 rounded-lg border-2 border-zinc-900 bg-red-50">
              <p className="text-xs font-semibold text-zinc-600">Remaining</p>
              <p className="text-2xl font-bold text-red-700">{totalCount - checkedCount}</p>
            </div>
            <div className="p-4 rounded-lg border-2 border-zinc-900 bg-zinc-100">
              <p className="text-xs font-semibold text-zinc-600">Total Items</p>
              <p className="text-2xl font-bold text-zinc-900">{totalCount}</p>
            </div>
          </div>

          {/* Add New Item Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="mb-6 w-full px-4 py-3 rounded-lg border-2 border-zinc-900 bg-zinc-900 font-semibold text-white hover:bg-zinc-800 transition-all shadow-[4px_4px_0_0_#323232]"
          >
            {showAddForm ? '✕ Cancel' : '+ Add New Tracker Item'}
          </button>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-6 rounded-lg border-2 border-zinc-900 bg-zinc-50 shadow-[4px_4px_0_0_#323232]">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Create New Tracker</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Drink 8 glasses of water"
                  className="w-full px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Description (optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add details about this goal..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900"
                />
              </div>

              <button
                onClick={handleAddItem}
                disabled={!newTitle.trim() || saving}
                className="w-full px-4 py-3 rounded-lg border-2 border-zinc-900 bg-green-100 font-semibold text-zinc-900 hover:bg-green-200 transition-all shadow-[2px_2px_0_0_#323232] disabled:opacity-50"
              >
                {saving ? 'Creating...' : '✓ Create Tracker'}
              </button>
            </div>
          )}

          {/* Tracker Items List */}
          <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              Your Trackers for {formatLocalDate(selectedDate)}
            </h2>
            
            {trackerItems.length === 0 ? (
              <p className="text-zinc-600 text-center py-8">
                No tracker items yet. Click &quot;Add New Tracker Item&quot; to get started!
              </p>
            ) : (
              <div className="space-y-3">
                {trackerItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      dailyLogs[item.id]
                        ? 'border-green-500 bg-green-50'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={dailyLogs[item.id] || false}
                        onChange={() => handleToggleCheck(item.id)}
                        className="mt-1 w-5 h-5 rounded border-2 border-zinc-900 cursor-pointer"
                      />
                      <div className="flex-1">
                        <h3 className={`font-semibold text-zinc-900 ${dailyLogs[item.id] ? 'line-through' : ''}`}>
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-zinc-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-800 font-bold text-lg"
                        title="Delete tracker"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showFeedbackForm && (
        <FeedbackForm onClose={() => setShowFeedbackForm(false)} />
      )}
    </div>
  )
}
