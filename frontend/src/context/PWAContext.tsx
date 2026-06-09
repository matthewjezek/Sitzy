import { createContext } from 'react';

export interface PWAContextType {
  isPWAInstalled: boolean;
  isUpdateAvailable: boolean;
  error: string | null;
  applyUpdate: () => Promise<void>;
}

export const PWAContext = createContext<PWAContextType | undefined>(undefined);
