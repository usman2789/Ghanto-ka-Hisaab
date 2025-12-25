'use client';

import { useEffect, useState } from 'react';

export default function PWADebugger() {
  const [swStatus, setSwStatus] = useState<string>('checking...');
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setSwStatus(`Active (v${reg.active?.scriptURL || 'unknown'})`);
          
          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        } else {
          setSwStatus('Not registered');
        }
      });
    } else {
      setSwStatus('Not supported');
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  };

  const handleUnregister = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      setSwStatus('Unregistered');
      alert('Service worker and caches cleared. Refresh to reinstall.');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-zinc-900 text-white p-4 rounded-lg shadow-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">PWA Debug Panel</h3>
      <div className="space-y-1">
        <p>Status: <span className="text-green-400">{swStatus}</span></p>
        <p>Online: <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
          {isOnline ? '✓' : '✗'}
        </span></p>
        {updateAvailable && (
          <button
            onClick={handleUpdate}
            className="w-full mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Update Available - Click to Refresh
          </button>
        )}
        <button
          onClick={handleUnregister}
          className="w-full mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
        >
          Clear Cache & Unregister
        </button>
      </div>
    </div>
  );
}
