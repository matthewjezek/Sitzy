import { useContext } from 'react';
import { PWAContext } from '../context/PWAContext';

export function usePWAUpdate() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWAUpdate must be used within a PWAProvider');
  }
  return context;
}