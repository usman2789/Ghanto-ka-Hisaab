'use client';

import { useEffect, useRef } from 'react';

export default function PWALifecycleManager() {
  const hasPrompted = useRef(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          registrationRef.current = registration;

          // Check for updates less frequently (every 5 minutes)
          const updateInterval = setInterval(() => {
            registration.update();
          }, 300000); // Check every 5 minutes

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('New service worker found');

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                console.log('Service worker state:', newWorker.state);
                
                if (
                  newWorker.state === 'installed' && 
                  navigator.serviceWorker.controller &&
                  !hasPrompted.current
                ) {
                  // New service worker available - only prompt once
                  hasPrompted.current = true;
                  console.log('New content is available; please refresh.');
                  
                  // Show a non-blocking notification instead of confirm
                  // User can refresh manually when ready
                }
              });
            }
          });

          return () => clearInterval(updateInterval);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle service worker controller change - but don't auto-reload
      const handleControllerChange = () => {
        console.log('Service worker controller changed');
        // Don't auto-reload - let user decide
      };
      
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Log current service worker state
      if (navigator.serviceWorker.controller) {
        console.log('Service worker is controlling the page');
      } else {
        console.log('No service worker controlling the page');
      }

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return null; // This component doesn't render anything
}
