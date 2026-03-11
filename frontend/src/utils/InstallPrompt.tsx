import { useEffect, useState } from 'react';
import { FiShare, FiPlusSquare, FiX, FiMoreHorizontal } from 'react-icons/fi';
import appIcon from '/apple-touch-icon.png?url';

// Definition for PWA prompt event, which is not standard in TS
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || !!nav.standalone;

    setIsStandalone(isPWA);

    if (isPWA) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isApple);

    if (isApple) {
      setShowPrompt(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] p-4 card animate-fade-in shadow-2xl max-w-lg mx-auto">
      <div className="flex items-start gap-4">
        
        <img 
          src={appIcon} 
          alt="Sitzy" 
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />

        <div className="flex-1">
          <h3 className="text-sm font-bold mb-1">
            Nainstalovat Sitzy
          </h3>
          
          {isIOS ? (
            <div className="text-xs text-secondary leading-relaxed">
              Pro nejlepší zážitek si přidejte aplikaci na plochu. Klikněte dole na{' '}
              <span className="inline-block align-middle mx-1 bg-gray-200 dark:bg-gray-700 rounded-full px-1.5 py-0.5"><FiMoreHorizontal size={14} /></span>
              , vyberte{' '}
              <span className="inline-block align-middle mx-1"><FiShare size={14} className="text-blue-500" /></span>
              <strong>Sdílet</strong> a poté{' '}
              <span className="inline-block align-middle mx-1"><FiPlusSquare size={14} /></span>
              <strong>Přidat na plochu</strong>.
            </div>
          ) : (
            <div className="text-xs text-secondary mb-2">
              Přidejte si aplikaci na domovskou obrazovku pro rychlý přístup a offline režim.
            </div>
          )}

          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="mt-2 button-primary text-sm py-1.5 px-4 block w-full sm:w-auto"
            >
              Nainstalovat
            </button>
          )}
        </div>

        <button 
          onClick={() => setShowPrompt(false)} 
          className="close-button flex-shrink-0"
          aria-label="Zavřít"
        >
          <FiX size={18} />
        </button>

      </div>
    </div>
  );
}