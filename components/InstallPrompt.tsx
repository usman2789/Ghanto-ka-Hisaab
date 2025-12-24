'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
    if (isInstalled) return

    // Check if prompt was already shown
    const promptShown = localStorage.getItem('installPromptShown')
    if (promptShown) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after 2 seconds
      setTimeout(() => {
        setShowPrompt(true)
        localStorage.setItem('installPromptShown', 'true')
      }, 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md mb-4 rounded-lg border-2 border-zinc-900 bg-white p-6 shadow-[4px_4px_0_0_#323232] animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Install Ghanto ka Hisaab
            </h3>
            <p className="text-sm text-zinc-600 mb-4">
              Install this app on your device for quick and easy access when you&apos;re on the go.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-zinc-900 bg-zinc-900 text-white font-semibold hover:bg-zinc-700 transition-all"
              >
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900 font-semibold hover:bg-zinc-100 transition-all"
              >
                Not Now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-zinc-400 hover:text-zinc-900 text-xl font-bold"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
