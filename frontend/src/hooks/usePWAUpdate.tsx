import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function isStandalonePWA() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function usePWAUpdate() {
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  });

  useEffect(() => {
    setIsPWAInstalled(isStandalonePWA());
  }, []);

  const applyUpdate = async () => {
    if (!isPWAInstalled) return;

    try {
      await updateServiceWorker(true);
      setNeedRefresh(false);
    } catch (err) {
      console.error('Error applying PWA update:', err);
      setError('Failed to apply update');
      throw err;
    }
  };

  return {
    isPWAInstalled,
    isUpdateAvailable: isPWAInstalled && needRefresh,
    error,
    applyUpdate
  };
}