'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import StaggeredMenu from '@/components/StaggeredMenu'
import Loader from '@/components/Loader'
import FeedbackForm from '@/components/FeedbackForm'

interface TagStats {
  tag: string
  count: number
  hours: number
  minutes: number
  percentage: number
}

interface HourEntry {
  id: string
  date: string
  hour: number
  tags: string[]
  details: string | null
}

interface TrackerItemStats {
  title: string
  totalDays: number
  completedDays: number
  completionRate: number
}

type TimePeriod = 'today' | 'last7days' | 'last30days' | 'custom' | 'all'
type ViewMode = 'hours' | 'tracker'

function StatsPage() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('hours')
  const [tagStats, setTagStats] = useState<TagStats[]>([])
  const [trackerStats, setTrackerStats] = useState<TrackerItemStats[]>([])
  const [totalEntries, setTotalEntries] = useState(0)
  const [daysTracked, setDaysTracked] = useState(0)
  const [avgHoursPerDay, setAvgHoursPerDay] = useState(0)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [rawEntries, setRawEntries] = useState<HourEntry[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Helper to format date in local timezone as YYYY-MM-DD
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDateRange = useCallback((period: TimePeriod): { startDate: string; endDate: string } | null => {
    const today = new Date()
    const endDate = formatLocalDate(today)
    let startDate: string

    switch (period) {
      case 'today':
        startDate = endDate
        break
      case 'last7days':
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 6)
        startDate = formatLocalDate(weekAgo)
        break
      case 'last30days':
        const monthAgo = new Date(today)
        monthAgo.setDate(today.getDate() - 29)
        startDate = formatLocalDate(monthAgo)
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          return { startDate: customStartDate, endDate: customEndDate }
        }
        return null
      case 'all':
      default:
        return null
    }

    return { startDate, endDate }
  }, [customStartDate, customEndDate])

  const loadStats = useCallback(async (uid: string, period: TimePeriod) => {
    setIsRefreshing(true)
    
    let query = supabase
      .from('hour_entries')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
      .order('hour', { ascending: true })

    const dateRange = getDateRange(period)
    if (dateRange) {
      query = query.gte('date', dateRange.startDate).lte('date', dateRange.endDate)
    }

    const { data, error } = await query

    console.log('Stats Query Result:', { period, dateRange, data, error })

    if (!error && data) {
      setRawEntries(data as HourEntry[])
      setTotalEntries(data.length)

      const uniqueDays = new Set(data.map(e => e.date))
      setDaysTracked(uniqueDays.size)

      if (uniqueDays.size > 0) {
        setAvgHoursPerDay(Math.round((data.length / uniqueDays.size) * 10) / 10)
      } else {
        setAvgHoursPerDay(0)
      }

      const tagCounts: { [tag: string]: number } = {}
      data.forEach(entry => {
        if (entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0) {
          // Divide 1 hour by the number of tags
          const fractionalHour = 1 / entry.tags.length
          entry.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + fractionalHour
          })
        }
      })

      const totalTagHours = Object.values(tagCounts).reduce((a, b) => a + b, 0)
      const stats: TagStats[] = Object.entries(tagCounts)
        .map(([tag, hours]) => {
          const h = Math.floor(hours)
          const m = Math.round((hours - h) * 60)
          return {
            tag,
            count: hours,
            hours: h,
            minutes: m,
            percentage: totalTagHours > 0 ? Math.round((hours / totalTagHours) * 100) : 0
          }
        })
        .sort((a, b) => b.count - a.count)

      setTagStats(stats)
    } else {
      console.error('Error loading stats:', error)
      setRawEntries([])
      setTotalEntries(0)
      setDaysTracked(0)
      setAvgHoursPerDay(0)
      setTagStats([])
    }
    
    // Load tracker stats
    await loadTrackerStats(uid, period)
    
    setIsRefreshing(false)
  }, [supabase, getDateRange])

  const loadTrackerStats = useCallback(async (uid: string, period: TimePeriod) => {
    const dateRange = getDateRange(period)
    
    // Get all tracker items for user
    const { data: items, error: itemsError } = await supabase
      .from('tracker_items')
      .select('id, title')
      .eq('user_id', uid)
    
    if (itemsError || !items || items.length === 0) {
      setTrackerStats([])
      return
    }
    
    // Get entries within date range
    let entriesQuery = supabase
      .from('tracker_entries')
      .select('tracker_item_id, date, status')
      .eq('user_id', uid)
    
    if (dateRange) {
      entriesQuery = entriesQuery.gte('date', dateRange.startDate).lte('date', dateRange.endDate)
    }
    
    const { data: entries, error: entriesError } = await entriesQuery
    
    if (entriesError) {
      setTrackerStats([])
      return
    }
    
    // Calculate stats per item
    const stats: TrackerItemStats[] = items.map(item => {
      const itemEntries = entries?.filter(entry => entry.tracker_item_id === item.id) || []
      const completedEntries = itemEntries.filter(entry => entry.status === 'completed')
      const partialEntries = itemEntries.filter(entry => entry.status === 'partial')
      
      // Count unique days
      const uniqueDays = new Set(itemEntries.map(entry => entry.date))
      const totalDays = uniqueDays.size
      // Count completed + half credit for partial
      const completedDays = completedEntries.length + (partialEntries.length * 0.5)
      const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
      
      return {
        title: item.title,
        totalDays,
        completedDays: Math.round(completedDays),
        completionRate
      }
    }).filter(stat => stat.totalDays > 0)
    .sort((a, b) => b.completionRate - a.completionRate)
    
    setTrackerStats(stats)
  }, [supabase, getDateRange])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      setIsAdmin(user.email === 'amusman9705@gmail.com')
      
      const today = formatLocalDate(new Date())
      setCustomStartDate(today)
      setCustomEndDate(today)
      
      await loadStats(user.id, timePeriod)
      setLoading(false)
    }
    getUser()
  }, [router, supabase, loadStats, timePeriod])

  useEffect(() => {
    if (userId && !loading) {
      if (timePeriod === 'custom' && (!customStartDate || !customEndDate)) {
        return
      }
      loadStats(userId, timePeriod)
    }
  }, [timePeriod, userId, loadStats, loading, customStartDate, customEndDate])

  const handleRefresh = async () => {
    if (userId) {
      await loadStats(userId, timePeriod)
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
    { label: 'Tracker', href: '/tracker-new' },
    ...(isAdmin ? [{ label: 'Attendance', href: '/attendance' }] : []),
    { label: 'Settings', href: '/settings' },
    { label: 'Feedback', onClick: () => setShowFeedbackForm(true) },
    { label: 'Sign Out', onClick: handleSignOut }
  ]

  const periodLabels: Record<TimePeriod, string> = {
    today: 'Today',
    last7days: 'Last 7 Days',
    last30days: 'Last 30 Days',
    custom: 'Custom Range',
    all: 'All Time'
  }

  const handleSpecificDateFilter = (date: string) => {
    setCustomStartDate(date)
    setCustomEndDate(date)
    setTimePeriod('custom')
  }

  const getPeriodDescription = () => {
    const range = getDateRange(timePeriod)
    if (range) {
      return `${range.startDate} to ${range.endDate}`
    }
    return 'All recorded data'
  }

  return (
    <div className="min-h-screen bg-white">
      <StaggeredMenu items={menuItems} position="left" />
      
      <main className="p-4 pt-20 md:p-8 md:pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Statistics</h1>
              <p className="text-sm text-zinc-600 mt-1">
                Overview of your time tracking data
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white font-semibold text-zinc-900 hover:bg-zinc-100 transition-all shadow-[2px_2px_0_0_#323232] disabled:opacity-50"
            >
              {isRefreshing ? '...' : 'Refresh'}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setViewMode('hours')}
              className={`flex-1 px-6 py-3 rounded-lg border-2 border-zinc-900 font-bold transition-all shadow-[2px_2px_0_0_#323232] ${
                viewMode === 'hours'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              Hours Tracking
            </button>
            <button
              onClick={() => setViewMode('tracker')}
              className={`flex-1 px-6 py-3 rounded-lg border-2 border-zinc-900 font-bold transition-all shadow-[2px_2px_0_0_#323232] ${
                viewMode === 'tracker'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              Tracker Stats
            </button>
          </div>

          {viewMode === 'hours' ? (
            <>
          <div className="mb-8 p-4 rounded-lg border-2 border-zinc-900 bg-zinc-100">
            <p className="text-sm font-semibold text-zinc-900 mb-3">Time Period</p>
            
            {/* Quick Date Picker */}
            <div className="mb-4 p-3 bg-white rounded-lg border-2 border-zinc-900">
              <label className="block text-xs font-semibold text-zinc-700 mb-2">Quick Date Filter</label>
              <input
                type="date"
                onChange={(e) => handleSpecificDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900 font-medium"
                placeholder="Select a specific date"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(['today', 'last7days', 'last30days', 'custom', 'all'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-4 py-2 rounded-lg border-2 border-zinc-900 font-semibold transition-all ${
                    timePeriod === period
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white text-zinc-900 hover:bg-zinc-200'
                  }`}
                >
                  {periodLabels[period]}
                </button>
              ))}
            </div>
            
            {timePeriod === 'custom' && (
              <div className="flex flex-wrap gap-4 mt-4 p-4 bg-white rounded-lg border-2 border-zinc-900">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900 font-medium"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900 font-medium"
                  />
                </div>
              </div>
            )}
            
            <p className="text-xs text-zinc-500 mt-2">
              Showing: {getPeriodDescription()}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-6 rounded-lg border-2 border-zinc-900 bg-zinc-100 shadow-[4px_4px_0_0_#323232]">
              <p className="text-sm font-semibold text-zinc-600">Total Hours Logged</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2">{totalEntries}</p>
              <p className="text-xs text-zinc-500 mt-1">hour entries in database</p>
            </div>
            <div className="p-6 rounded-lg border-2 border-zinc-900 bg-zinc-100 shadow-[4px_4px_0_0_#323232]">
              <p className="text-sm font-semibold text-zinc-600">Days Tracked</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2">{daysTracked}</p>
              <p className="text-xs text-zinc-500 mt-1">unique days with entries</p>
            </div>
            <div className="p-6 rounded-lg border-2 border-zinc-900 bg-zinc-100 shadow-[4px_4px_0_0_#323232]">
              <p className="text-sm font-semibold text-zinc-600">Avg Hours/Day</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2">{avgHoursPerDay}</p>
              <p className="text-xs text-zinc-500 mt-1">average per tracked day</p>
            </div>
          </div>

          <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232] mb-8">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              Activity Distribution - {periodLabels[timePeriod]}
            </h2>
            <p className="text-xs text-zinc-600 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-semibold">📊 How time is divided:</span> If you add multiple tags to one hour (e.g., 2 PM with [Work, Meeting]), the hour is divided equally. So 1 hour with 2 tags = 30 minutes for each tag.
            </p>
            
            {tagStats.length === 0 ? (
              <p className="text-zinc-600 text-center py-8">
                No data for this period. Start tracking your hours to see statistics!
              </p>
            ) : (
              <div className="space-y-4">
                {tagStats.map((stat) => {
                  const timeDisplay = stat.hours > 0 
                    ? `${stat.hours}h ${stat.minutes}m`
                    : `${stat.minutes}m`
                  
                  return (
                    <div key={stat.tag} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-zinc-900">{stat.tag}</span>
                        <span className="text-sm text-zinc-600">
                          {timeDisplay} ({stat.percentage}%)
                        </span>
                      </div>
                      <div className="h-4 bg-zinc-200 rounded-full border-2 border-zinc-900 overflow-hidden">
                        <div
                          className="h-full bg-zinc-900 transition-all duration-500"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tracker Stats Section */}
          {trackerStats.length > 0 && (
            <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232] mb-8">
              <h2 className="text-xl font-bold text-zinc-900 mb-4">
                Daily Tracker Stats - {periodLabels[timePeriod]}
              </h2>
              <p className="text-xs text-zinc-600 mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="font-semibold">✅ Completion rates:</span> Shows how consistently you've completed your daily tracker items during this period.
              </p>
              
              <div className="space-y-4">
                {trackerStats.map((stat) => (
                  <div key={stat.title} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-zinc-900">{stat.title}</span>
                      <span className="text-sm text-zinc-600">
                        {stat.completedDays}/{stat.totalDays} days ({stat.completionRate}%)
                      </span>
                    </div>
                    <div className="h-4 bg-zinc-200 rounded-full border-2 border-zinc-900 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          stat.completionRate >= 80 ? 'bg-green-600' :
                          stat.completionRate >= 50 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${stat.completionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 rounded-lg border-2 border-zinc-900 bg-zinc-50 shadow-[4px_4px_0_0_#323232]">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              Recent Entries ({rawEntries.length} total)
            </h2>
            
            {rawEntries.length === 0 ? (
              <p className="text-zinc-600 text-center py-4">
                No entries found for this period.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {rawEntries.slice(0, 20).map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-300"
                  >
                    <div>
                      <span className="font-semibold text-zinc-900">{entry.date}</span>
                      <span className="text-zinc-500 mx-2">|</span>
                      <span className="text-zinc-700">{entry.hour}:00</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {entry.tags?.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-zinc-200 text-zinc-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {rawEntries.length > 20 && (
                  <p className="text-center text-zinc-500 text-sm pt-2">
                    ... and {rawEntries.length - 20} more entries
                  </p>
                )}
              </div>
            )}
          </div>
            </>
          ) : (
            <>
              {/* Tracker Stats View */}
              <div className="space-y-6">
                {trackerStats.length === 0 ? (
                  <div className="p-8 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232] text-center">
                    <p className="text-zinc-600 mb-4">No tracker data yet.</p>
                    <a 
                      href="/tracker-new" 
                      className="inline-block px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
                    >
                      Start Tracking
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
                        <p className="text-sm font-semibold text-zinc-600">Total Items</p>
                        <p className="text-3xl font-bold text-zinc-900 mt-2">{trackerStats.length}</p>
                      </div>
                      <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
                        <p className="text-sm font-semibold text-zinc-600">Avg Completion</p>
                        <p className="text-3xl font-bold text-zinc-900 mt-2">
                          {trackerStats.length > 0 
                            ? Math.round(trackerStats.reduce((sum, s) => sum + s.completionRate, 0) / trackerStats.length)
                            : 0}%
                        </p>
                      </div>
                      <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
                        <p className="text-sm font-semibold text-zinc-600">Total Days Tracked</p>
                        <p className="text-3xl font-bold text-zinc-900 mt-2">
                          {Math.max(...trackerStats.map(s => s.totalDays), 0)}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
                      <h2 className="text-xl font-bold text-zinc-900 mb-6">Tracker Item Performance</h2>
                      <div className="space-y-4">
                        {trackerStats.map((stat) => (
                          <div key={stat.title} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-zinc-900">{stat.title}</span>
                              <span className="text-sm text-zinc-600">
                                {stat.completedDays}/{stat.totalDays} days ({stat.completionRate}%)
                              </span>
                            </div>
                            <div className="h-4 bg-zinc-200 rounded-full border-2 border-zinc-900 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  stat.completionRate >= 80 ? 'bg-green-600' :
                                  stat.completionRate >= 50 ? 'bg-yellow-600' :
                                  'bg-red-600'
                                }`}
                                style={{ width: `${stat.completionRate}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showFeedbackForm && (
        <FeedbackForm onClose={() => setShowFeedbackForm(false)} />
      )}
    </div>
  )
}

export default dynamic(() => Promise.resolve(StatsPage), { ssr: false })
