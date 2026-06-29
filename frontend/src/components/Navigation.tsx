import { useState, useRef, useEffect, type ReactNode } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { useNavigate, Link, useLocation } from 'react-router';
import { useInvites } from '../hooks/useInvites';
import { toast } from 'react-toastify';
import { formatLocalDateTime } from '../utils/datetime';
import logoLight from '../assets/sitzy_logo_full.svg';
import logoDark from '../assets/sitzy_logo_full_dark.svg';
import { ArrowLeftIcon, RocketIcon, SeatIcon, CarIcon, SettingsIcon, LogoutIcon } from '../assets/icons';

interface BellDropdownProps {
  open: boolean
  interactive: boolean
  onClose: () => void
  invites: import('../types/models').Invitation[]
  loading: boolean
  onRespond: (token: string, accept: boolean, rideId: string) => Promise<void>
  responding: string | null
}

interface MobileDialogPanelProps {
  id: string
  open: boolean
  title: string
  labelledBy: string
  onClose: () => void
  children: ReactNode
  className?: string
}

/* eslint-disable jsx-a11y/click-events-have-key-events -- dialog backdrop close pattern */
function MobileDialogPanel({ id, open, title, labelledBy, onClose, children, className = '' }: MobileDialogPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const prevActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const main = document.querySelector('main') as HTMLElement | null
    if (!dialog) return

    if (open && !dialog.open) {
      // save previous focus
      prevActiveRef.current = document.activeElement as HTMLElement | null
      // hide and inert background main content for screen readers
      if (main) {
        main.setAttribute('aria-hidden', 'true')
        // If the browser supports the inert property, use it to make content inert
        if (typeof HTMLElement !== 'undefined' && Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'inert')) {
          ;(main as unknown as { inert: boolean }).inert = true
        }
      }

      dialog.showModal()
      // ensure focus moves into dialog (to element with autoFocus if present)
      setTimeout(() => {
        const auto = dialog.querySelector('[autoFocus]') as HTMLElement | null
        if (auto) auto.focus()
        else dialog.focus()
      }, 0)
      return
    }

    if (!open && dialog.open) {
      dialog.close()
      // restore background accessibility and focus
      if (main) {
        main.removeAttribute('aria-hidden')
        if (typeof HTMLElement !== 'undefined' && Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'inert')) {
          ;(main as unknown as { inert: boolean }).inert = false
        }
      }
      setTimeout(() => prevActiveRef.current?.focus(), 0)
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className={`dialog-card dialog-card-mobile !text-left overflow-y-auto ${className}`}
      aria-labelledby={labelledBy}
      role="dialog"
      aria-modal="true"
      onClose={onClose}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          onClose()
        }
      }}
    >
      <div className="dialog-header">
        <div className="flex flex-row-reverse justify-between gap-3 m-0">
          <button
            type="button"
            className="w-auto m-0 dialog-close-button"
            onClick={onClose}
            aria-label={`Zavřít ${title.toLowerCase()}`}
            autoFocus
          >
            <FiX className="text-2xl md:text-lg" aria-hidden="true" />
          </button>
          <div className="dialog-title text-xl">
            <h1 id={labelledBy}>{title}</h1>
          </div>
        </div>

        <div className="dialog-content text-left">{children}</div>
      </div>
    </dialog>
  )
}

function BellDropdown({ open, interactive, onClose, invites, loading, onRespond, responding }: BellDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !interactive) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, interactive, onClose])

  if (!open) return null

  return (
    <div
      ref={dropdownRef}
      className="z-50 card shadow-xl flex flex-col gap-3 fixed top-16 left-0 right-0 mx-4 rounded-xl p-4
        lg:absolute lg:top-12 lg:w-80 lg:mx-0 lg:left-auto"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">Pozvánky</span>
        <button onClick={onClose} className="close-button" aria-label="Zavřít notifikace">
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
          <p className="text-xs text-timestamp">{formatLocalDateTime(inv.created_at)}</p>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              disabled={responding === inv.token}
              onClick={(e) => {
                e.stopPropagation()
                void onRespond(inv.token, true, inv.ride_id)
              }}
              className="flex-1 text-sm py-1 px-3 rounded-lg button-primary"
            >
              {responding === inv.token ? 'Zpracovávám...' : 'Přijmout'}
            </button>
            <button
              type="button"
              disabled={responding === inv.token}
              onClick={(e) => {
                e.stopPropagation()
                void onRespond(inv.token, false, inv.ride_id)
              }}
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
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [responding, setResponding] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const {
    invites,
    loading: invitesLoading,
    error: invitesError,
    respondInvite,
    fetchInvites,
  } = useInvites()

  const closePanels = () => {
    setMenuOpen(false)
    setBellOpen(false)
  }

  const toggleBell = () => {
    setMenuOpen(false)
    setBellOpen(open => !open)
  }

  const toggleMenu = () => {
    setBellOpen(false)
    setMenuOpen(open => !open)
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const unreadCount = invites.filter(i => i.status === 'Pending').length

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches)
    }

    setIsDesktop(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!bellOpen) return
    fetchInvites()
  }, [bellOpen, fetchInvites])

  useEffect(() => {
    void fetchInvites()
  }, [location.pathname, fetchInvites])

  useEffect(() => {
    if (!invitesError) return
    toast.error(invitesError)
  }, [invitesError])

  useEffect(() => {
    closePanels()
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    navigate('/login?logged_out=1')
  }

  const handleRespond = async (token: string, accept: boolean, rideId: string) => {
    setResponding(token)
    try {
      if (accept) {
        closePanels()
        navigate(`/rides/${rideId}?invite=${encodeURIComponent(token)}`)
      } else {
        await respondInvite(token, false)
        toast.info('Pozvánka odmítnuta.')
      }
    } catch {
      // Error toast is handled centrally from hook error state.
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
          <button className={`nav-button glass nav-hover-rocket ${isActive('/dashboard') ? 'glass-active' : ''}`} onClick={() => navigate('/dashboard')}>
            <RocketIcon />Start
          </button>
          <button className={`nav-button glass nav-hover-seat ${isActive('/rides') ? 'glass-active' : ''}`} onClick={() => navigate('/rides')}>
            <SeatIcon />Jízdy
          </button>
          <button className={`nav-button glass nav-hover-car ${isActive('/cars') ? 'glass-active' : ''}`} onClick={() => navigate('/cars')}>
            <CarIcon /><span>Moje auta</span>
          </button>
        </div>

        <Link to="/dashboard" className="flex items-center flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg outline-none">
          <img src={logoLight} alt="Sitzy logo" className="logo logo-light h-10" />
          <img src={logoDark} alt="Sitzy logo" className="logo logo-dark h-10" />
        </Link>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative">
            <button
              onClick={toggleBell}
              className="nav-button p-0 glass rounded-full w-11 h-11 flex items-center justify-center relative"
              aria-label="Otevřít notifikace"
            >
              <FiBell className="nav-icon-bell" size={20} aria-hidden="true" />
              <UnreadBadge count={unreadCount} />
            </button>
            <BellDropdown
              open={bellOpen}
              interactive={isDesktop}
              onClose={closePanels}
              invites={invites}
              loading={invitesLoading}
              onRespond={handleRespond}
              responding={responding}
            />
          </div>
          <button
            className="nav-button p-0 glass rounded-full w-11 h-11 flex items-center justify-center nav-hover-settings"
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
            {location.pathname !== '/dashboard' ? (
              <button
                className="inline-flex items-center p-2 w-11 h-11 justify-center text-sm text-muted rounded-lg hover-list-bg"
                onClick={() => navigate(-1)}
                aria-label="Zpět"
              >
                <ArrowLeftIcon />
              </button>
            ) : (
              <div className="w-11 h-11" aria-hidden="true" />
            )}
          </div>

          <Link 
            to="/dashboard" 
            className="flex justify-center items-center h-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg outline-none"
          >
            <img src={logoLight} alt="Sitzy logo" className="logo logo-light h-10" />
            <img src={logoDark} alt="Sitzy logo" className="logo logo-dark h-10" />
          </Link>

          <div className="flex justify-end gap-2">
            
            <button
              type="button"
              className="inline-flex items-center p-2 w-11 h-11 justify-center text-sm text-muted rounded-lg hover-list-bg relative"
              onClick={toggleBell}
              aria-expanded={bellOpen}
              aria-controls="mobile-notifications-dialog"
              aria-label="Otevřít notifikace"
            >
              <FiBell className="nav-icon-bell" size={20} aria-hidden="true" />
              <UnreadBadge count={unreadCount} />
            </button>

            <button
              type="button"
              className="inline-flex items-center p-2 w-11 h-11 justify-center text-sm text-muted rounded-lg hover-list-bg focus:outline-none"
              aria-controls="mobile-menu-dialog"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              aria-label="Otevřít hlavní menu"
              onClick={toggleMenu}
            >
              <span className="sr-only">Otevřít hlavní menu</span>
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={1.5} fill="none" viewBox="0 0 17 14">
                <path d="M1 1h15M1 7h15M1 13h15" />
              </svg>
            </button>
          </div>
        </div>

        {!isDesktop && (
          <MobileDialogPanel
            id="mobile-menu-dialog"
            open={menuOpen}
            title="Hlavní menu"
            labelledBy="mobile-menu-title"
            onClose={closePanels}
            className="dialog-card-mobile--menu"
          >
            <nav aria-label="Hlavní menu">
              <ul className="font-medium flex flex-col gap-2 pt-3">
                <li><Link to="/dashboard" className="inline-flex items-center gap-3 py-2 px-3 rounded-md w-full" onClick={closePanels}><RocketIcon />Start</Link></li>
                <hr className="border-light" />
                <li><Link to="/rides" className="inline-flex items-center gap-3 py-2 px-3 rounded-md w-full" onClick={closePanels}><SeatIcon />Jízdy</Link></li>
                <hr className="border-light" />
                <li><Link to="/cars" className="inline-flex items-center gap-3 py-2 px-3 rounded-md w-full" onClick={closePanels}><CarIcon />Moje auta</Link></li>
                <hr className="border-light" />
                <li><Link to="/settings" className="inline-flex items-center gap-3 py-2 px-3 rounded-md w-full" onClick={closePanels}><SettingsIcon />Nastavení</Link></li>
                <hr className="border-light" />
                <li>
                  <button onClick={handleLogout} className="inline-flex items-center gap-3 py-2 px-3 rounded-md w-full text-left">
                    <LogoutIcon />Odhlásit se
                  </button>
                </li>
              </ul>
            </nav>
          </MobileDialogPanel>
        )}

        {!isDesktop && (
          <MobileDialogPanel
            id="mobile-notifications-dialog"
            open={bellOpen}
            title="Pozvánky"
            labelledBy="mobile-notifications-title"
            onClose={closePanels}
            className="dialog-card-mobile--notifications"
          >
            {invitesLoading && (
              <div className="flex flex-col gap-2">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse h-16 rounded-lg skeleton-dark" />
                ))}
              </div>
            )}

            {!invitesLoading && invites.length === 0 && (
              <p className="text-sm text-secondary text-center py-4">Žádné nové pozvánky</p>
            )}

            {!invitesLoading && invites.map(inv => (
              <div key={inv.token} className="flex flex-col gap-2 p-3 rounded-lg list-item-bg">
                <p className="text-sm font-medium">Pozvánka na jízdu</p>
                <p className="text-xs text-timestamp">{formatLocalDateTime(inv.created_at)}</p>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    disabled={responding === inv.token}
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleRespond(inv.token, true, inv.ride_id)
                    }}
                    className="flex-1 text-sm py-1 px-3 rounded-lg button-primary"
                  >
                    {responding === inv.token ? 'Zpracovávám...' : 'Přijmout'}
                  </button>
                  <button
                    type="button"
                    disabled={responding === inv.token}
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleRespond(inv.token, false, inv.ride_id)
                    }}
                    className="flex-1 text-sm py-1 px-3 rounded-lg button-secondary"
                  >
                    Odmítnout
                  </button>
                </div>
              </div>
            ))}
          </MobileDialogPanel>
        )}
      </div>
    </>
  )
}
