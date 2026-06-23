export type Language = 'cs' | 'en';

const STORAGE_KEY = 'sitzy_lang';

export function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'cs' || stored === 'en') {
    return stored as Language;
  }
  
  const browserLang = navigator.language || '';
  if (browserLang.startsWith('cs') || browserLang.startsWith('sk')) {
    return 'cs';
  }
  
  return 'en';
}

export function setStoredLanguage(lang: Language): void {
  localStorage.setItem(STORAGE_KEY, lang);
}
