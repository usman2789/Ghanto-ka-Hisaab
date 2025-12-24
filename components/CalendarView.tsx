'use client'

import { useState } from 'react'

interface CalendarViewProps {
  year: number
  month: number
  entries: { [date: string]: number } // date -> count of hours tracked
  onDateClick: (date: Date) => void
}

export default function CalendarView({ year, month, entries, onDateClick }: CalendarViewProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const getDateKey = (day: number) => {
    return new Date(year, month, day).toISOString().split('T')[0]
  }

  const getProgressColor = (count: number) => {
    if (count === 0) return 'bg-white'
    if (count < 8) return 'bg-red-200'
    if (count < 16) return 'bg-yellow-200'
    return 'bg-green-200'
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-bold text-zinc-600 p-2">
            {day}
          </div>
        ))}
        
        {/* Empty cells for alignment */}
        {emptyDays.map(i => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Day cells */}
        {days.map(day => {
          const dateKey = getDateKey(day)
          const count = entries[dateKey] || 0
          const today = new Date()
          const isToday = 
            day === today.getDate() && 
            month === today.getMonth() && 
            year === today.getFullYear()

          return (
            <button
              key={day}
              onClick={() => onDateClick(new Date(year, month, day))}
              className={`aspect-square rounded-lg border-2 border-zinc-900 p-2 font-bold transition-all hover:scale-105 ${getProgressColor(count)} ${
                isToday ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-lg text-zinc-900">{day}</span>
                {count > 0 && (
                  <span className="text-xs text-zinc-600 mt-1">
                    {count}/24
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
