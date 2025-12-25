'use client'

import { useState } from 'react'

interface HourTrackerProps {
  date: Date
  entries: { [hour: number]: { tags: string[], details?: string } }
  onSave: (hour: number, tags: string[], details?: string) => Promise<void>
  onClose: () => void
}

const PREDEFINED_TAGS = [
  'Sleep',
  'Daily Task',
  'Study',
  'Phone Scrolling',
  'With Friends',
  'Fun',
  'Work',
  'Exercise',
  'Meals',
  'Travel',
  'Entertainment',
  'Other'
]

export default function HourTracker({ date, entries, onSave, onClose }: HourTrackerProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [details, setDetails] = useState('')
  const [saving, setSaving] = useState(false)

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour)
    const entry = entries[hour]
    setSelectedTags(entry?.tags || [])
    setDetails(entry?.details || '')
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()])
      setCustomTag('')
    }
  }

  const handleSave = async () => {
    if (selectedHour === null) return
    setSaving(true)
    await onSave(selectedHour, selectedTags, details)
    setSaving(false)
    setSelectedHour(null)
    setSelectedTags([])
    setDetails('')
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
        <div className="flex items-center justify-between border-b-2 border-zinc-900 bg-zinc-200 p-3 sm:p-4">
          <h2 className="text-base sm:text-xl font-bold text-zinc-900 truncate pr-2">
            {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-zinc-900 hover:text-red-600 flex-shrink-0"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(90vh-80px)]">
          {/* Hours List */}
          <div className="w-full md:w-1/3 overflow-y-auto border-r-2 border-zinc-900 bg-zinc-50">
            <div className="p-2">
              {hours.map(hour => (
                <button
                  key={hour}
                  onClick={() => handleHourClick(hour)}
                  className={`w-full mb-2 p-2 sm:p-3 rounded-lg border-2 border-zinc-900 text-left font-semibold transition-all ${
                    selectedHour === hour
                      ? 'bg-zinc-900 text-white'
                      : entries[hour]?.tags?.length
                      ? 'bg-green-100 text-zinc-900 hover:bg-green-200'
                      : 'bg-white text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm sm:text-base whitespace-nowrap">{hour.toString().padStart(2, '0')}:00 - {((hour + 1) % 24).toString().padStart(2, '0')}:00</span>
                    {entries[hour]?.tags?.length > 0 && (
                      <span className="text-[10px] sm:text-xs bg-zinc-900 text-white px-1.5 sm:px-2 py-1 rounded truncate flex-shrink min-w-0">
                        {entries[hour].tags.length === 1
                          ? entries[hour].tags[0]
                          : entries[hour].tags.length === 2
                          ? `${entries[hour].tags[0]}, ${entries[hour].tags[1]}`
                          : `${entries[hour].tags[0]} +...`
                        }
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tag Selection */}
          <div className="w-full md:w-2/3 overflow-y-auto p-4">
            {selectedHour !== null ? (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900">
                  Select activities for {selectedHour.toString().padStart(2, '0')}:00
                </h3>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-600">Predefined Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-lg border-2 border-zinc-900 font-medium transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-zinc-900 text-white'
                            : 'bg-white text-zinc-900 hover:bg-zinc-100'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-600">Add Custom Tag:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                      placeholder="Enter custom tag"
                      className="flex-1 h-10 rounded-lg border-2 border-zinc-900 bg-white px-3 text-sm font-medium text-zinc-900 outline-none"
                    />
                    <button
                      onClick={addCustomTag}
                      className="px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white font-semibold text-zinc-900 hover:bg-zinc-100"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {selectedTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-zinc-600">Selected Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-zinc-900 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                          {tag}
                          <button
                            onClick={() => toggleTag(tag)}
                            className="text-red-400 hover:text-red-600 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-600">Additional Details (Optional):</p>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Add any additional details..."
                    rows={3}
                    className="w-full rounded-lg border-2 border-zinc-900 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || selectedTags.length === 0}
                  className="w-full py-3 rounded-lg border-2 border-zinc-900 bg-zinc-900 text-white font-bold hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400">
                <p className="text-center">
                  Select an hour from the left to add or edit activities
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
