'use client';

import { useEffect, useRef } from 'react';

export default function PWALifecycleManager() {
  const hasPrompted = useRef(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let updateInterval: ReturnType<typeof setInterval> | null = null;

    const attachRegistration = (registration: ServiceWorkerRegistration) => {
      registrationRef.current = registration;

      updateInterval = setInterval(() => {
        registration.update();
      }, 300000);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller &&
              !hasPrompted.current
            ) {
              hasPrompted.current = true;
              console.log('New content is available; please refresh.');
            }
          });
        }
      });
    };

    navigator.serviceWorker.ready
      .then((registration) => {
        attachRegistration(registration);
      })
      .catch((error) => {
        console.error('Service worker readiness check failed:', error);
      });

    const handleControllerChange = () => {
      console.log('Service worker controller changed');
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return null; // This component doesn't render anything
}
