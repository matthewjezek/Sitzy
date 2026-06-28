import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { FiArrowRight, FiSun, FiMoon, FiCheckCircle, FiUserCheck, FiGrid, FiShield, FiHeart } from 'react-icons/fi';
import { getInitialLanguage, setStoredLanguage, type Language } from '../utils/language';
import { getThemePreference, applyThemePreference, resolveThemePreference, type ThemePreference } from '../utils/theme';
import SeatRenderer, { type SeatData } from '../components/SeatRenderer';
import gsap from 'gsap';
import { getSeatPositionLabel } from '../utils/seatUtils';

import logoLight from '../assets/sitzy_logo_full.svg';
import logoDark from '../assets/sitzy_logo_full_dark.svg';

const translations = {
  cs: {
    title: "Sitzy - Plánování sedaček a spolujízdy s přáteli",
    navSignIn: "Přihlásit se",
    navGoDashboard: "Vstoupit do aplikace",
    heroBadge: "Projekt bakalářské práce",
    heroTitlePre: "Plánování sedaček",
    heroTitleGradient: "hravě a přehledně",
    heroTitlePost: "pro každou vaši cestu.",
    heroSubtitle: "Sitzy vám pomůže domluvit se, kdo kde sedí, sdílet vizuální schéma auta a zorganizovat spolujízdu bez nekonečných zpráv.",
    heroCtaStart: "Spustit aplikaci",
    heroCtaDemo: "Vyzkoušet interaktivní ukázku",
    
    // Interactive Demo Card
    demoTitle: "Vyzkoušejte si to",
    demoDescription: "Vyberte si typ auta a kliknutím na volná sedadla (šedé sedačky) v schématu níže si vyzkoušejte, jak snadno si pasažéři volí své místo.",
    demoSelectedSeat: "Vybrané sedadlo",
    demoCapacity: "Kapacita",
    demoLayout: "Typ vozidla",
    demoNoneSelected: "žádné (klikněte na volné sedadlo)",
    
    // Vehicle types
    sedan: "Sedan (4 místa)",
    coupe: "Coupé (2 místa)",
    minivan: "Minivan (7 míst)",
    
    // Features Section
    featuresTitle: "Vše pod kontrolou během cesty",
    featuresSubtitle: "Už žádné spory o místo spolujezdce. Naplánujte si cestu dopředu.",
    feature1Title: "Vizuální schémata aut",
    feature1Desc: "Podpora pro různé typy aut (Sedan, Coupé, Minivan) s přehledným uspořádáním sedadel.",
    feature2Title: "Zvaní pasažérů",
    feature2Desc: "Jednoduché odkazy na pozvánky. Každý si zvolí své sedadlo a řidič okamžitě vidí obsazenost.",
    feature3Title: "Správa flotily",
    feature3Desc: "Přidejte si svá vozidla do garáže, spravujte jejich kapacitu a detaily vozidla.",
    feature4Title: "Úplně zdarma",
    feature4Desc: "Studentský akademický projekt vytvořený s důrazem na čistý design a skvělý uživatelský zážitek.",
    
    // How it works
    howItWorksTitle: "Jak to funguje?",
    step1Title: "1. Vytvořte jízdu",
    step1Desc: "Zadejte cíl, čas odjezdu a vyberte jedno ze svých aut z garáže.",
    step2Title: "2. Nasdílejte odkaz",
    step2Desc: "Pošlete vygenerovaný odkaz přátelům přes WhatsApp, Messenger nebo e-mail.",
    step3Title: "3. Výběr míst",
    step3Desc: "Přátelé si otevřou odkaz a přímo na schématu auta si kliknutím zaberou volné sedadlo.",
    
    // Footer
    footerDesc: "Sitzy je studentský projekt bakalářské práce zaměřený na správu pasažérů a koordinaci skupinových cest.",
    privacy: "Ochrana osobních údajů",
    terms: "Podmínky použití",
  },
  en: {
    title: "Sitzy - Car Seat Management & Passenger Coordination",
    navSignIn: "Sign In",
    navGoDashboard: "Enter App",
    heroBadge: "Bachelor's Thesis Project",
    heroTitlePre: "Plan your car seats",
    heroTitleGradient: "easily and visually",
    heroTitlePost: "for every single trip.",
    heroSubtitle: "Sitzy helps you coordinate who sits where, share a visual cabin layout, and organize group rides without endless messaging back-and-forth.",
    heroCtaStart: "Get Started",
    heroCtaDemo: "Try Interactive Demo",
    
    // Interactive Demo Card
    demoTitle: "Try it out",
    demoDescription: "Select a vehicle type and click on any empty seat (grey seats) in the layout below to see how easily passengers select their spot.",
    demoSelectedSeat: "Selected Seat",
    demoCapacity: "Capacity",
    demoLayout: "Vehicle Layout",
    demoNoneSelected: "none (click on an empty seat)",
    
    // Vehicle types
    sedan: "Sedan (4 seats)",
    coupe: "Coupé (2 seats)",
    minivan: "Minivan (7 seats)",
    
    // Features Section
    featuresTitle: "Everything in order before the trip",
    featuresSubtitle: "No more fights over the shotgun seat. Map out your journey in advance.",
    feature1Title: "Visual Seat Layouts",
    feature1Desc: "Support for multiple vehicle configurations (Sedan, Coupé, Minivan) with interactive views.",
    feature2Title: "Passenger Invites",
    feature2Desc: "Simple shareable invite links. Everyone selects their own seat, and the driver sees it live.",
    feature3Title: "Manage Fleet",
    feature3Desc: "Add your personal vehicles to your virtual garage, customize capacities and types.",
    feature4Title: "Completely Free",
    feature4Desc: "A student academic project developed with a focus on modern design and premium user experience.",
    
    // How it works
    howItWorksTitle: "How it works?",
    step1Title: "1. Create a ride",
    step1Desc: "Enter destination, departure time, and select one of your cars.",
    step2Title: "2. Share the link",
    step2Desc: "Send the invitation link to friends via WhatsApp, Messenger, or email.",
    step3Title: "3. Seats selection",
    step3Desc: "Friends open the link and pick their preferred seats directly on the interactive car layout.",
    
    // Footer
    footerDesc: "Sitzy is a bachelor's thesis student project focused on passenger management and group trip coordination.",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  }
};

// Mock seats data for landing page interactive showcase
const mockSeatsData: Record<string, SeatData[]> = {
  SEDAQ: [
    { position: 1, user_name: 'David (Driver)', occupied: true },
    { position: 2, user_name: '', occupied: false },
    { position: 3, user_name: 'Jana', occupied: true },
    { position: 4, user_name: '', occupied: false },
  ],
  TRAPAQ: [
    { position: 1, user_name: 'David (Driver)', occupied: true },
    { position: 2, user_name: '', occupied: false },
  ],
  PRAQ: [
    { position: 1, user_name: 'David (Driver)', occupied: true },
    { position: 2, user_name: 'Monika', occupied: true },
    { position: 3, user_name: '', occupied: false },
    { position: 4, user_name: 'Petr', occupied: true },
    { position: 5, user_name: '', occupied: false },
    { position: 6, user_name: 'Honza', occupied: true },
    { position: 7, user_name: '', occupied: false },
  ],
};

export default function LandingPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  const [lang, setLang] = useState<Language>(() => getInitialLanguage());
  const [theme, setTheme] = useState<ThemePreference>(() => getThemePreference());
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP Entry Animations
  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".animate-hero", {
          opacity: 0,
          y: 24,
          duration: 0.7,
          stagger: 0.1,
          ease: "power2.out",
        });

        gsap.from(".animate-showcase", {
          opacity: 0,
          scale: 0.98,
          y: 16,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.3,
        });

        gsap.from(".animate-feature-card", {
          opacity: 0,
          y: 24,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          delay: 0.4,
        });
      }, containerRef.current);

      return () => ctx.revert();
    }
  }, []);

  // Interactive demo states
  const [demoLayout, setDemoLayout] = useState<'SEDAQ' | 'TRAPAQ' | 'PRAQ'>('SEDAQ');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(2);

  useEffect(() => {
    document.title = translations[lang].title;
  }, [lang]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
  };

  const handleThemeToggle = () => {
    const resolved = resolveThemePreference(theme);
    const nextTheme = resolved === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyThemePreference(nextTheme);
  };

  const handleDemoLayoutChange = (layout: 'SEDAQ' | 'TRAPAQ' | 'PRAQ') => {
    setDemoLayout(layout);
    // Reset selected seat to first free seat in that layout
    if (layout === 'SEDAQ') setSelectedSeat(2);
    else if (layout === 'TRAPAQ') setSelectedSeat(2);
    else if (layout === 'PRAQ') setSelectedSeat(3);
  };

  const getCapacity = (layout: string) => {
    if (layout === 'TRAPAQ') return 2;
    if (layout === 'PRAQ') return 7;
    return 4;
  };

  const t = translations[lang];

  if (token) {
    return null; // Avoid rendering flash of content
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logoLight} alt="Sitzy logo" className="logo logo-light h-9" />
            <img src={logoDark} alt="Sitzy logo" className="logo logo-dark h-9" />
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Language Switcher */}
            <div className="bg-zinc-100 dark:bg-slate-800 p-0.5 rounded-lg flex gap-0.5 border border-zinc-200/50 dark:border-slate-700/50">
              <button
                onClick={() => handleLanguageChange('cs')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  lang === 'cs'
                    ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                CZ
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={handleThemeToggle}
              className="p-2 text-zinc-500 hover:text-zinc-905 dark:text-zinc-400 dark:hover:text-white rounded-lg bg-zinc-100 dark:bg-slate-800 border border-zinc-200/50 dark:border-slate-700/50 transition-colors cursor-pointer"
              aria-label="Přepnout tmavý/světlý režim"
            >
              {resolveThemePreference(theme) === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            {/* Login Button */}
            <Link
              to="/login"
              className="button-primary text-sm shadow-md hover:shadow-lg"
            >
              {t.navSignIn}
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-40 dark:opacity-60">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-fuchsia-400/15 dark:bg-fuchsia-600/10 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Text */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-200/50 dark:border-indigo-800/30 mb-6 animate-hero">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                {t.heroBadge}
              </span>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight animate-hero">
                {t.heroTitlePre}{' '}
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                  {t.heroTitleGradient}
                </span>{' '}
                {t.heroTitlePost}
              </h1>
              <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed animate-hero">
                {t.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-hero">
                <Link
                  to="/login"
                  className="button-primary px-6 py-3.5 rounded-xl text-base flex items-center justify-center gap-2 hover:scale-[1.02] shadow-lg hover:shadow-indigo-500/20 transition-all"
                >
                  <span>{t.heroCtaStart}</span>
                  <FiArrowRight size={18} />
                </Link>
                <a
                  href="#demo"
                  className="button-secondary px-6 py-3.5 rounded-xl text-base flex items-center justify-center transition-all"
                >
                  {t.heroCtaDemo}
                </a>
              </div>
            </div>

            {/* Interactive Cabin Showcase */}
            <div id="demo" className="lg:col-span-6 flex flex-col items-center justify-center animate-showcase">
              <div className="w-full max-w-[440px] bg-slate-50/70 dark:bg-slate-950/40 border border-zinc-200/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl shadow-2xl backdrop-blur-md relative">
                
                <div className="absolute -top-3 -right-3 bg-purple-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-md z-10 tracking-wider">
                  Live Preview
                </div>

                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  {t.demoTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                  {t.demoDescription}
                </p>

                {/* Car Layout Switcher Tabs */}
                <div className="flex gap-1 theme-surface-muted p-1 rounded-xl mb-6 border theme-border">
                  {(['SEDAQ', 'TRAPAQ', 'PRAQ'] as const).map(layout => (
                    <button
                      key={layout}
                      onClick={() => handleDemoLayoutChange(layout)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all hover:cursor-pointer ${
                        demoLayout === layout
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      {layout === 'SEDAQ' ? t.sedan : layout === 'TRAPAQ' ? t.coupe : t.minivan}
                    </button>
                  ))}
                </div>

                {/* The Interactive Seat Layout */}
                <div className="flex justify-center bg-white dark:bg-slate-900/40 border border-zinc-200/50 dark:border-slate-800/50 rounded-2xl p-4 sm:p-6 mb-4 min-h-[300px] items-center">
                  <div className="w-full max-w-[280px]">
                    <SeatRenderer
                      layout={demoLayout}
                      seats={mockSeatsData[demoLayout]}
                      selectedSeat={selectedSeat}
                      onSeatSelect={(pos) => setSelectedSeat(pos)}
                      mode="interactive"
                      showHeader={false}
                      showLegend={true}
                      compact={true}
                    />
                  </div>
                </div>

                {/* Selected seat feedback */}
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/20">
                  <span className="font-semibold text-slate-505 dark:text-slate-400">{t.demoSelectedSeat}:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedSeat ? getSeatPositionLabel(demoLayout, selectedSeat) : t.demoNoneSelected}
                  </span>
                </div>

                {/* Additional stats */}
                <div className="grid grid-cols-2 gap-3 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between p-2 rounded-lg bg-zinc-100/40 dark:bg-slate-900/30">
                    <span>{t.demoCapacity}:</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">{getCapacity(demoLayout)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-zinc-100/40 dark:bg-slate-900/30">
                    <span>{t.demoLayout}:</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">
                      {demoLayout === 'SEDAQ' ? 'Sedan' : demoLayout === 'TRAPAQ' ? 'Coupé' : 'Minivan'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/40 border-y border-zinc-200 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black tracking-tight text-slate-905 dark:text-white sm:text-4xl">
              {t.featuresTitle}
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="card p-6 flex flex-col gap-4 animate-feature-card">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FiGrid size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{t.feature1Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t.feature1Desc}</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card p-6 flex flex-col gap-4 animate-feature-card">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FiUserCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{t.feature2Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t.feature2Desc}</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card p-6 flex flex-col gap-4 animate-feature-card">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FiCheckCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{t.feature3Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t.feature3Desc}</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="card p-6 flex flex-col gap-4 animate-feature-card">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <FiShield size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{t.feature4Title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t.feature4Desc}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ── */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {t.howItWorksTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-lg mb-6">
                1
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">{t.step1Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{t.step1Desc}</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-lg mb-6">
                2
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">{t.step2Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{t.step2Desc}</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-lg mb-6">
                3
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">{t.step3Title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{t.step3Desc}</p>
            </div>

          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-auto bg-slate-50 dark:bg-slate-950/60 border-t border-zinc-200 dark:border-slate-800/80 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-zinc-200/60 dark:border-slate-800/60 pb-8">
            <Link to="/" className="flex items-center">
              <img src={logoLight} alt="Sitzy logo" className="logo logo-light h-8" />
              <img src={logoDark} alt="Sitzy logo" className="logo logo-dark h-8" />
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm text-center md:text-right">
              {t.footerDesc}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1">
                <span>© {new Date().getFullYear()} Sitzy.</span>
                <span>Made with</span>
                <FiHeart className="text-rose-500 fill-rose-500 animate-pulse mx-0.5" size={10} />
                <span>for Bachelor's Thesis.</span>
              </div>
              <span className="hidden sm:inline text-zinc-300 dark:text-slate-800">•</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Designed by <a href="https://www.magnific.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Magnific</a>
              </span>
            </div>
            
            <div className="flex items-center gap-4 font-semibold">
              <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {t.privacy}
              </Link>
              <span className="text-zinc-300 dark:text-slate-800">•</span>
              <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {t.terms}
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
