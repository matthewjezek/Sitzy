import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'react-toastify';

// 1. Komponenta, která se vyrenderuje UVNITŘ toastu
const RefreshToastContent = ({ onUpdate, onClose }: { onUpdate: () => void, onClose: () => void }) => (
  <div className="flex flex-col gap-3">
    <div className="text-sm font-medium text-gray-900 dark:text-white">
      Je k dispozici nová verze aplikace.
    </div>
    <div className="flex gap-2">
      <button 
        className="button-primary flex-1 text-sm py-1.5 px-3"
        onClick={onUpdate}
      >
        Aktualizovat
      </button>
      <button 
        className="button-secondary flex-1 text-sm py-1.5 px-3"
        onClick={onClose}
      >
        Zavřít
      </button>
    </div>
  </div>
);

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      console.log('SW Registered');
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  // Reference na aktivní toast, abychom ho nevytvořili vícekrát
  const toastId = useRef<string | number | null>(null);

  useEffect(() => {
    // Pokud je potřeba refresh a toast ještě neběží
    if (needRefresh && (!toastId.current || !toast.isActive(toastId.current))) {
      toastId.current = toast(
        <RefreshToastContent 
          onUpdate={() => updateServiceWorker(true)} 
          onClose={() => {
            setNeedRefresh(false);
            if (toastId.current) toast.dismiss(toastId.current);
          }} 
        />,
        {
          position: "bottom-center",
          autoClose: false,        // ZABRÁNÍ AUTOMATICKÉMU ZAVŘENÍ ⏳
          closeOnClick: false,     // Nezavře se, když uživatel klikne vedle tlačítek
          closeButton: false,      // Skryjeme výchozí toastify křížek (máme tlačítko)
          draggable: false,        // Zabráníme zahození swipnutím, dokud se uživatel nerozhodne
          // Můžeš přidat své třídy i přímo na obal toastu, např. pro lepší zakulacení:
        //   className: "rounded-xl border border-primary-border dark:border-gray-700",
        }
      );
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  // Samotná komponenta už do DOMu nevrací nic, vše se děje přes Toastify portál
  return null;
}