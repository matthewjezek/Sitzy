import { useState, useRef, useEffect } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router';
import { useInvites } from '../hooks/useInvites';
import { useRide } from '../hooks/useRide';
import { toast } from 'react-toastify';
import logoLight from '../assets/sitzy_logo_full.svg';
import logoDark from '../assets/sitzy_logo_full_dark.svg';
import { ArrowLeftIcon, RocketIcon, SeatIcon, CarIcon, SettingsIcon, LogoutIcon } from '../assets/icons';

interface BellDropdownProps {
  open: boolean
  onClose: () => void
  invites: import('../types/models').Invitation[]
  loading: boolean
  onRespond: (token: string, accept: boolean, rideId: string) => Promise<void>
  responding: string | null
}

function BellDropdown({ open, onClose, invites, loading, onRespond, responding }: BellDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={dropdownRef}
      className="z-50 card shadow-xl flex flex-col gap-3 fixed top-16 left-0 right-0 mx-4 rounded-xl p-4
        lg:absolute lg:top-12 lg:w-80 lg:mx-0 lg:left-auto"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">Pozvánky</span>
        <button onClick={onClose} className="close-button" aria-label="Close notifications area">
          <FiX size={18} />
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse h-16 rounded-lg skeleton-dark" />
          ))}
        </div>
      )}

      {!loading && invites.length === 0 && (
        <p className="text-sm text-secondary text-center py-4">Žádné nové pozvánky</p>
      )}

      {!loading && invites.map(inv => (
        <div key={inv.token} className="flex flex-col gap-2 p-3 rounded-lg list-item-bg">
          <p className="text-sm font-medium">Pozvánka na jízdu</p>
          <p className="text-xs text-gray-500">{new Date(inv.created_at).toLocaleString('cs-CZ')}</p>
          <div className="flex gap-2 mt-1">
            <button
              disabled={responding === inv.token}
              onClick={() => onRespond(inv.token, true, inv.ride_id)}
              className="flex-1 text-sm py-1 px-3 rounded-lg button-primary"
            >
              {responding === inv.token ? 'Zpracovávám...' : 'Přijmout'}
            </button>
            <button
              disabled={responding === inv.token}
              onClick={() => onRespond(inv.token, false, inv.ride_id)}
              className="flex-1 text-sm py-1 px-3 rounded-lg button-secondary"
            >
              Odmítnout
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="absolute -top-1 -right-1 unread-count-badge">
      {count}
    </span>
  )
}

export default function Navigation() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [responding, setResponding] = useState<string | null>(null)
  const { invites, loading: invitesLoading, respondInvite } = useInvites()  // single instance
  const { fetchRide } = useRide()

  const unreadCount = invites.filter(i => i.status === 'Pending').length

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    navigate('/login?logged_out=1')
  }

  const handleRespond = async (token: string, accept: boolean, rideId: string) => {
    setResponding(token)
    try {
      await respondInvite(token, accept)
      if (accept) {
        await fetchRide(rideId)
        toast.success(
          <span>
            Přijato! Sedadlo přiřazeno.{' '}
            <a href={`/rides/${rideId}`} className="underline font-semibold">
              Zobrazit jízdu →
            </a>
          </span>
        )
      } else {
        toast.info('Pozvánka odmítnuta.')
      }
    } finally {
      setResponding(null)
    }
  }

  return (
    <>
      {/* ── Desktop ── */}
      <div className="navigation hidden lg:flex items-center">
        <div className="flex items-center gap-2 flex-1">
          <button className="nav-button glass gap-0 group transition-all duration-300 ease-in hover:gap-2" onClick={() => navigate(-1)}>
            <ArrowLeftIcon />
            <span className="whitespace-nowrap max-w-0 overflow-hidden transition-all duration-300 ease-in group-hover:max-w-[100px]">Zpět</span>
          </button>
          <button className="nav-button glass nav-hover-rocket" onClick={() => navigate('/')}>
            <RocketIcon />Start
          </button>
          <button className="nav-button glass nav-hover-seat" onClick={() => navigate('/rides')}>
            <SeatIcon />Jízdy
          </button>
          <button className="nav-button glass nav-hover-car" onClick={() => navigate('/cars')}>
            <CarIcon /><span>Moje auta</span>
          </button>
        </div>

        <Link to="/rides" className="flex items-center gap-2 flex-shrink-0">
          <img src={logoLight} alt="Sitzy logo" className="logo logo-light h-10" />
          <img src={logoDark} alt="Sitzy logo" className="logo logo-dark h-10" />
        </Link>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative">
            <button
              onClick={() => setBellOpen(o => !o)}
              className="nav-button p-0 glass rounded-full w-9 h-9 flex items-center justify-center relative"
              aria-label="Otevřít notifikace"
            >
              <FiBell className="nav-icon-bell" size={20} aria-hidden="true" />
              <UnreadBadge count={unreadCount} />
            </button>
            <BellDropdown
              open={bellOpen}
              onClose={() => setBellOpen(false)}
              invites={invites}
              loading={invitesLoading}
              onRespond={handleRespond}
              responding={responding}
            />
          </div>
          <button
            className="nav-button p-0 glass rounded-full w-9 h-9 flex items-center justify-center nav-hover-settings"
            onClick={() => navigate('/settings')}
            aria-label="Nastavení"
          >
            <SettingsIcon />
          </button>
          <button className="nav-button glass gap-0 group transition-all duration-300 ease-in hover:gap-2 nav-hover-logout" onClick={handleLogout}>
            <LogoutIcon />
            <span className="whitespace-nowrap max-w-0 overflow-hidden transition-all duration-300 ease-in group-hover:max-w-[100px]">Odhlásit se</span>
          </button>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="relative z-50 lg:hidden">
        
        <div className="w-full max-w-screen-xl grid grid-cols-[1fr_auto_1fr] items-center p-4">
          
          <div className="flex justify-start">
            {window.location.pathname !== '/' ? (
              <button
                className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-muted rounded-lg hover-list-bg"
                onClick={() => navigate(-1)}
                aria-label="Zpět"
              >
                <ArrowLeftIcon />
              </button>
            ) : (
              <div className="w-10 h-10" aria-hidden="true" />
            )}
          </div>

          <Link 
            to="/rides" 
            className="flex justify-center items-center space-x-3 h-10"
          >
            <img src={logoLight} alt="Sitzy logo" className="logo logo-light h-10" />
            <img src={logoDark} alt="Sitzy logo" className="logo logo-dark h-10" />
          </Link>

          <div className="flex justify-end gap-2">
            
            <div className="relative">
              <button
                className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-muted rounded-lg hover-list-bg relative"
                onClick={() => setBellOpen(o => !o)}
                aria-label="Otevřít notifikace"
              >
                <FiBell className="nav-icon-bell" size={20} aria-hidden="true" />
                <UnreadBadge count={unreadCount} />
              </button>
              
              <BellDropdown
                open={bellOpen}
                onClose={() => setBellOpen(false)}
                invites={invites}
                loading={invitesLoading}
                onRespond={handleRespond}
                responding={responding}
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-muted rounded-lg hover-list-bg focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={menuOpen}
              aria-label="Otevřít hlavní menu"
              onClick={() => setMenuOpen(o => !o)}
            >
              <span className="sr-only">Otevřít hlavní menu</span>
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={1.5} fill="none" viewBox="0 0 17 14">
                <path d="M1 1h15M1 7h15M1 13h15" />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="absolute top-16 left-0 w-full px-4" id="mobile-menu">
            <ul className="font-medium flex flex-col gap-2 p-4 rounded-xl card shadow-xl">
              <li><Link to="/" className="inline-flex items-center gap-3 py-2 px-3 rounded-md w-full" onClick={() => setMenuOpen(false)}><RocketIcon />Start</Link></li>
              <hr className="border-light" />
              <li><Link to="/rides" className="inline-flex items-center gap-3 py-2 px-3 rounded-md w-full" onClick={() => setMenuOpen(false)}><SeatIcon />Jízdy</Link></li>
              <hr className="border-light" />
              <li><Link to="/cars" className="inline-flex items-center gap-3 py-2 px-3 rounded-md w-full" onClick={() => setMenuOpen(false)}><CarIcon />Moje auta</Link></li>
              <hr className="border-light" />
              <li><Link to="/settings" className="inline-flex items-center gap-3 py-2 px-3 rounded-md w-full" onClick={() => setMenuOpen(false)}><SettingsIcon />Nastavení</Link></li>
              <hr className="border-light" />
              <li>
                <button onClick={handleLogout} className="inline-flex items-center gap-3 py-2 px-3 rounded-md w-full text-left">
                  <LogoutIcon />Odhlásit se
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
