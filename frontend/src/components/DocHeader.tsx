import { useNavigate } from 'react-router';
import { ArrowLeftIcon } from '../assets/icons';
import type { Language } from '../utils/language';

interface DocHeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

export default function DocHeader({ lang, setLang }: DocHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const hasToken = Boolean(localStorage.getItem('access_token'));
      navigate(hasToken ? '/dashboard' : '/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeftIcon />
          <span>{lang === 'cs' ? 'Zpět' : 'Back'}</span>
        </button>

        {/* Language Switcher (Desktop) */}
        <div className="bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg hidden sm:flex gap-0.5">
          <button
            onClick={() => setLang('cs')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              lang === 'cs'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            CZ
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              lang === 'en'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            EN
          </button>
        </div>

        {/* Language Switcher (Mobile Compact Toggle) */}
        <button
          onClick={() => setLang(lang === 'cs' ? 'en' : 'cs')}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex sm:hidden"
        >
          {lang === 'cs' ? 'EN' : 'CZ'}
        </button>
      </div>
    </header>
  );
}
