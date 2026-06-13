import React, { useEffect, useState, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'react-toastify';
import { PWAContext } from './PWAContext';

function isStandalonePWA() {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onNeedRefresh() {
      setNeedRefresh(true);
    },
    onRegisterError(err) {
      console.error('Error registering PWA service worker:', err);
      setError('Failed to register PWA updates');
    },
    onRegisteredSW(_swUrl, r) {
      if (r) {
        setRegistration(r);
      }
    }
  });

  useEffect(() => {
    setIsPWAInstalled(isStandalonePWA());
  }, []);

  useEffect(() => {
    if (!registration) return;

    // Trigger initial check on mount/registration
    registration.update().catch(err => console.error('Initial SW update check failed:', err));

    // Check for updates on visibility change (focus/resume on iOS)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        registration.update().catch(err => console.error('Failed to update SW on visibility change:', err));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check for updates when coming online
    const handleOnline = () => {
      registration.update().catch(err => console.error('Failed to update SW on online event:', err));
    };
    window.addEventListener('online', handleOnline);

    // Check for updates periodically (every 5 minutes)
    const intervalId = setInterval(() => {
      if ('connection' in navigator && !navigator.onLine) return;
      registration.update().catch(err => console.error('Failed to update SW periodically:', err));
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      clearInterval(intervalId);
    };
  }, [registration]);

  const applyUpdate = useCallback(async () => {
    try {
      await updateServiceWorker(true);
      setNeedRefresh(false);
    } catch (err) {
      console.error('Error applying PWA update:', err);
      setError('Failed to apply update');
      throw err;
    }
  }, [updateServiceWorker, setNeedRefresh]);

  const isUpdateAvailable = isPWAInstalled && needRefresh;

  // Show a global toast notification when an update is available (for standalone PWA only)
  useEffect(() => {
    if (isUpdateAvailable) {
      const toastId = 'pwa-update-toast';
      toast.info(
        <div className="flex flex-col gap-2 p-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Je k dispozici nová verze aplikace.
          </p>
          <button
            onClick={async () => {
              try {
                toast.dismiss(toastId);
                await applyUpdate();
              } catch (err) {
                console.error('Failed to apply update via toast:', err);
              }
            }}
            className="w-full text-center py-2 px-4 rounded-lg text-sm font-bold bg-[#7350f2] hover:bg-[#5c3dd8] text-white shadow-md transition-colors cursor-pointer"
          >
            Aktualizovat nyní
          </button>
        </div>,
        {
          toastId,
          position: 'bottom-left',
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: true,
        }
      );
    }
  }, [isUpdateAvailable, applyUpdate]);

  return (
    <PWAContext.Provider value={{ isPWAInstalled, isUpdateAvailable, error, applyUpdate }}>
      {children}
    </PWAContext.Provider>
  );
};
