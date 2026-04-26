'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import StaggeredMenu from '@/components/StaggeredMenu'
import Loader from '@/components/Loader'

const STUDENTS = [
  'ABDUL HASEEB',
  'AMNA AJMAL MALIK',
  'ATIKA NADEEM',
  'DAUD SULTAN ABBASI',
  'FAIZAN ALI',
  'FATIMA TU ZAHRA',
  'Farhan Younas',
  'HAFIZA TOOBA NOOR',
  'HAJIRA SHOUKAT',
  'IFRAH HAYAT',
  'JAWAD MUSTAFA',
  'KASHMALA SHAH NAWAZ CHEEMA',
  'Laiba Khan',
  'MAHNOOR FAISAL',
  'MAIRA AMIR',
  'MANAHIL INAM',
  'MARIA',
  'MOHAMMAD RAFAY',
  'MUHAMMAD MUHADDIS',
  'MUHAMMAD USMAN',
  'MUHAMMAD ABDULLAH NADIR',
  'MUHAMMAD EHSAN IFTIKHAR',
  'MUHAMMAD HAMZA MUSTAFA',
  'MUHAMMAD RAYYAN ADIL',
  'MUQADDAS NOOR',
  'Muhammad Haziq',
  'NABIHA MURTAZA',
  'NABILA ALI QADRI',
  'PARNIA HASSAN SHAH',
  'QATREENA IJAZ',
  'RAHIMA MARYAM',
  'RAZI UR REHMAN',
  'SAAD UMAIR',
  'SARAH RUMAN MASOOD',
  'WARDA BILAL',
  'ZAINAB ALISHA ARSHAD',
  'ZUNAIRAH KOMAIL'
]

function AttendancePage() {
  const [presentStudents, setPresentStudents] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      // Replace with your email
      const ADMIN_EMAIL = 'amusman9705@gmail.com'
      if (user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      
      setAuthorized(true)
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader />
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  const handleToggle = (student: string) => {
    const newPresent = new Set(presentStudents)
    if (newPresent.has(student)) {
      newPresent.delete(student)
    } else {
      newPresent.add(student)
    }
    setPresentStudents(newPresent)
    setSubmitted(false)
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const handleReset = () => {
    setPresentStudents(new Set())
    setSubmitted(false)
  }

  const handleMarkAll = () => {
    setPresentStudents(new Set(STUDENTS))
    setSubmitted(false)
  }

  const absentStudents = STUDENTS.filter(student => !presentStudents.has(student))

  const copyAbsentNames = () => {
    const text = absentStudents.join('\n')
    navigator.clipboard.writeText(text)
    alert('Absent students copied to clipboard!')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Statistics', href: '/stats' },
    { label: 'Tracker', href: '/tracker' },
    { label: 'Attendance', href: '/attendance' },
    { label: 'Settings', href: '/settings' },
    { label: 'Sign Out', onClick: handleSignOut }
  ]

  return (
    <div className="min-h-screen bg-white">
      <StaggeredMenu items={menuItems} position="left" />
      
      <main className="p-4 pt-20 md:p-8 md:pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Student Attendance</h1>
            <p className="text-sm text-zinc-600 mt-1">
              Mark present students - Total: {STUDENTS.length}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={handleMarkAll}
              className="px-4 py-2 rounded-lg border-2 border-zinc-900 bg-green-100 font-semibold text-zinc-900 hover:bg-green-200 transition-all shadow-[2px_2px_0_0_#323232]"
            >
              Mark All Present
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border-2 border-zinc-900 bg-red-100 font-semibold text-zinc-900 hover:bg-red-200 transition-all shadow-[2px_2px_0_0_#323232]"
            >
              Reset All
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg border-2 border-zinc-900 bg-zinc-900 font-semibold text-white hover:bg-zinc-800 transition-all shadow-[2px_2px_0_0_#323232]"
            >
              Submit Attendance
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg border-2 border-zinc-900 bg-green-50">
              <p className="text-xs font-semibold text-zinc-600">Present</p>
              <p className="text-2xl font-bold text-green-700">{presentStudents.size}</p>
            </div>
            <div className="p-4 rounded-lg border-2 border-zinc-900 bg-red-50">
              <p className="text-xs font-semibold text-zinc-600">Absent</p>
              <p className="text-2xl font-bold text-red-700">{STUDENTS.length - presentStudents.size}</p>
            </div>
            <div className="p-4 rounded-lg border-2 border-zinc-900 bg-zinc-100">
              <p className="text-xs font-semibold text-zinc-600">Total</p>
              <p className="text-2xl font-bold text-zinc-900">{STUDENTS.length}</p>
            </div>
          </div>

          {/* Student List */}
          <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232] mb-6">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Mark Attendance</h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {STUDENTS.map((student, index) => (
                <label
                  key={student}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    presentStudents.has(student)
                      ? 'border-green-500 bg-green-50'
                      : 'border-zinc-300 bg-white hover:bg-zinc-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={presentStudents.has(student)}
                    onChange={() => handleToggle(student)}
                    className="w-5 h-5 rounded border-2 border-zinc-900"
                  />
                  <span className="flex-1 font-medium text-zinc-900">
                    {index + 1}. {student}
                  </span>
                  {presentStudents.has(student) && (
                    <span className="text-green-600 font-bold">✓</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Absent Students - Shows after submit */}
          {submitted && absentStudents.length > 0 && (
            <div className="p-6 rounded-lg border-2 border-red-600 bg-red-50 shadow-[4px_4px_0_0_#dc2626]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-red-900">
                  Absent Students ({absentStudents.length})
                </h2>
                <button
                  onClick={copyAbsentNames}
                  className="px-4 py-2 rounded-lg border-2 border-red-900 bg-white font-semibold text-red-900 hover:bg-red-100 transition-all shadow-[2px_2px_0_0_#dc2626]"
                >
                  📋 Copy Names
                </button>
              </div>
              
              <div className="space-y-2">
                {absentStudents.map((student, index) => (
                  <div
                    key={student}
                    className="p-3 rounded-lg border border-red-300 bg-white"
                  >
                    <span className="font-medium text-red-900">
                      {index + 1}. {student}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submitted && absentStudents.length === 0 && (
            <div className="p-6 rounded-lg border-2 border-green-600 bg-green-50 text-center">
              <p className="text-xl font-bold text-green-900">
                🎉 Perfect Attendance! All students are present.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default dynamic(() => Promise.resolve(AttendancePage), { ssr: false })
