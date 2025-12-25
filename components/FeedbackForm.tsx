'use client'

import { useState } from 'react'

interface FeedbackFormProps {
  onClose: () => void
}

export default function FeedbackForm({ onClose }: FeedbackFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState('feedback')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setResult('Sending...')

    const formData = new FormData()
    formData.append('access_key', '413091d7-34c6-4dda-908a-4b4180b3e381')
    formData.append('name', name)
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('type', type)
    formData.append('message', message)

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setResult('Form Submitted Successfully')
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setResult('Error submitting form')
        setIsSubmitting(false)
      }
    } catch (error) {
      setResult('Error submitting form')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border-2 border-zinc-900 shadow-[8px_8px_0_0_#323232] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Share Your Thoughts</h2>
              <p className="text-sm text-zinc-600 mt-1">
                We would love to hear your feedback or feature requests!
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-600 hover:text-zinc-900 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 w-full rounded-md border-2 border-zinc-900 bg-white px-3 text-base font-semibold text-zinc-900 shadow-[4px_4px_0_0_#323232] outline-none focus:shadow-[6px_6px_0_0_#323232] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Email <span className="font-normal text-zinc-600">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-md border-2 border-zinc-900 bg-white px-3 text-base font-semibold text-zinc-900 shadow-[4px_4px_0_0_#323232] outline-none focus:shadow-[6px_6px_0_0_#323232] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Phone Number <span className="font-normal text-zinc-600">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 w-full rounded-md border-2 border-zinc-900 bg-white px-3 text-base font-semibold text-zinc-900 shadow-[4px_4px_0_0_#323232] outline-none focus:shadow-[6px_6px_0_0_#323232] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="h-10 w-full rounded-md border-2 border-zinc-900 bg-white px-3 text-base font-semibold text-zinc-900 shadow-[4px_4px_0_0_#323232] outline-none focus:shadow-[6px_6px_0_0_#323232] transition-all cursor-pointer"
              >
                <option value="feedback">Feedback</option>
                <option value="feature-request">Request New Feature</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="w-full rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-base font-semibold text-zinc-900 shadow-[4px_4px_0_0_#323232] outline-none focus:shadow-[6px_6px_0_0_#323232] transition-all resize-none"
              />
            </div>

            {result && (
              <p className={`text-sm font-semibold ${result.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
                {result}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="relative z-10 flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-lg border-2 border-zinc-900 bg-zinc-900 px-4 text-base font-semibold text-white shadow-[4px_4px_0_0_#323232] transition-all duration-200 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Submit'}
            </button>
          </form>

          {/* Open Source Section */}
          <div className="mt-8 pt-6 border-t-2 border-zinc-900">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              It's Open Source!
            </h3>
            <p className="text-sm text-zinc-600 mb-3">
              This project is open source. Feel free to contribute, report issues, or suggest improvements.
            </p>
            <a
              href="https://github.com/usman2789/Ghanto-ka-Hisaab"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white font-semibold text-zinc-900 hover:bg-zinc-100 transition-all shadow-[4px_4px_0_0_#323232]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
