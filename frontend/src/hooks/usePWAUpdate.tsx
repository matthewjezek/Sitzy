import { useState, useEffect } from 'react';

export function usePWAUpdate() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for updates on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        setIsUpdateAvailable(false);
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      checkForUpdates();

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const checkForUpdates = async () => {
    if (!('serviceWorker' in navigator)) return;

    setIsChecking(true);
    setError(null);

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      let registration = registrations[0];

      if (!registration) {
        // Fallback registration (though VitePWA should have done this)
        const swUrl = '/sw.js';
        registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/'
        });
      }

      // Update the service worker
      await registration.update();

      // Check if there's a waiting service worker (update available)
      if (registration.waiting) {
        setIsUpdateAvailable(true);
      } else {
        setIsUpdateAvailable(false);
      }
    } catch (err) {
      console.error('Error checking for PWA updates:', err);
      setError('Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  const applyUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      let registration = registrations[0];

      if (registration.waiting) {
        // Send message to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Wait for the waiting SW to become active
        return new Promise<void>((resolve) => {
          const handleControllerChange = () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            // Reload to apply the update
            window.location.reload();
            resolve();
          };

          navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        });
      }
    } catch (err) {
      console.error('Error applying PWA update:', err);
      setError('Failed to apply update');
      throw err;
    }
  };

  return {
    isUpdateAvailable,
    isChecking,
    error,
    checkForUpdates,
    applyUpdate
  };
}