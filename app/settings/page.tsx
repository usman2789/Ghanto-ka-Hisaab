'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import StaggeredMenu from '@/components/StaggeredMenu'
import Loader from '@/components/Loader'
import FeedbackForm from '@/components/FeedbackForm'
import { getPendingCount, clearPendingEntries } from '@/utils/offlineSync'

function SettingsPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [clearingData, setClearingData] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setIsAdmin(user.email === 'amusman9705@gmail.com')
      setLoading(false)
      
      // Get pending count
      try {
        const count = await getPendingCount()
        setPendingCount(count)
      } catch (e) {
        console.error('Error getting pending count:', e)
      }
    }
    getUser()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleClearOfflineData = async () => {
    if (!confirm('Are you sure you want to clear all pending offline data? This cannot be undone.')) {
      return
    }
    
    setClearingData(true)
    try {
      await clearPendingEntries()
      setPendingCount(0)
      alert('Offline data cleared successfully!')
    } catch (e) {
      console.error('Error clearing offline data:', e)
      alert('Error clearing offline data')
    } finally {
      setClearingData(false)
    }
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

  return (
    <div className="min-h-screen bg-white">
      <StaggeredMenu items={menuItems} position="left" />
      
      <main className="p-4 pt-20 md:p-8 md:pt-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Settings</h1>
            <p className="text-sm text-zinc-600 mt-1">
              Manage your account and preferences
            </p>
          </div>

          {/* Account Section */}
          <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232] mb-6">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Account</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-zinc-600">Email</p>
                <p className="text-lg font-medium text-zinc-900">{user?.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-zinc-600">User ID</p>
                <p className="text-sm font-mono text-zinc-900 break-all">{user?.id}</p>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3 rounded-lg border-2 border-red-600 bg-red-100 font-semibold text-red-600 hover:bg-red-200 transition-all shadow-[4px_4px_0_0_#dc2626]"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Offline Data Section */}
          <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232] mb-6">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Offline Data</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-100 rounded-lg border-2 border-zinc-900">
                <div>
                  <p className="font-semibold text-zinc-900">Pending Sync Changes</p>
                  <p className="text-sm text-zinc-600">Offline updates waiting to be synced</p>
                </div>
                <span className="text-2xl font-bold text-zinc-900">{pendingCount}</span>
              </div>
              
              <p className="text-sm text-zinc-600">
                When you add or update hours or saved tags while offline, they are stored locally and will automatically sync when you&apos;re back online.
              </p>

              {pendingCount > 0 && (
                <button
                  onClick={handleClearOfflineData}
                  disabled={clearingData}
                  className="w-full px-4 py-3 rounded-lg border-2 border-zinc-900 bg-yellow-100 font-semibold text-zinc-900 hover:bg-yellow-200 transition-all shadow-[4px_4px_0_0_#323232] disabled:opacity-50"
                >
                  {clearingData ? 'Clearing...' : 'Clear Pending Data'}
                </button>
              )}
            </div>
          </div>

          {/* About Section */}
          <div className="p-6 rounded-lg border-2 border-zinc-900 bg-zinc-100 shadow-[4px_4px_0_0_#323232]">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">About</h2>
            
            <div className="space-y-2">
              <p className="text-sm text-zinc-600">
                <span className="font-semibold">Ghanto ka Hisaab</span> - Track Your Hours
              </p>
              <p className="text-sm text-zinc-600">
                Version 1.0.0
              </p>
              <p className="text-sm text-zinc-600">
                This app works offline! Add and update your hours even without internet connection.
              </p>
              
              <a
                href="https://github.com/usman2789/Ghanto-ka-Hisaab"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:text-zinc-700 mt-4"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <FeedbackForm onClose={() => setShowFeedbackForm(false)} />
      )}
    </div>
  )
}

export default dynamic(() => Promise.resolve(SettingsPage), { ssr: false })
