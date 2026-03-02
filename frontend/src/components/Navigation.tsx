import { useState, useRef, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router';
import { useInvites } from '../hooks/useInvites';
import { useRide } from '../hooks/useRide';
import { toast } from 'react-toastify';

// ─── Ikony ────────────────────────────────────────────────────────────────────

const ArrowLeftIcon = () => (
  <svg stroke="currentColor" strokeWidth={3} strokeLinecap="round" fill="none" viewBox="0 0 24 24" height={22} width={22}>
    <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
  </svg>
)

const RocketIcon = () => (
  <svg className="text-cyan-400" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" fill="none" viewBox="0 0 24 24" height={22} width={22}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
)

const SeatIcon = () => (
  <svg className="text-violet-500" stroke="currentColor" strokeWidth={1.5} fill="none" viewBox="0 0 24 24" height={22} width={22}>
    <rect x="7" y="6" width="10" height="8" rx="3" />
    <rect x="5" y="14" width="14" height="7" rx="2" />
    <path d="M9 6v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
  </svg>
)

const CarIcon = () => (
  <svg className="text-fuchsia-500" stroke="currentColor" strokeWidth={1.5} fill="none" viewBox="0 0 24 24" height={22} width={22}>
    <rect x="2" y="10" width="20" height="9" rx="2" />
    <path d="m20.772 10.156-1.368-4.105A2.995 2.995 0 0 0 16.559 4H7.441a2.995 2.995 0 0 0-2.845 2.051l-1.368 4.105A2.003 2.003 0 0 0 2 12" />
    <circle cx="6" cy="14.5" r="1.5" /><circle cx="18" cy="14.5" r="1.5" />
    <rect x="3" y="19" width="3" height="3" rx="1" /><rect x="18" y="19" width="3" height="3" rx="1" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="text-sky-800" stroke="currentColor" strokeWidth="1.5" fill="none" viewBox="0 0 20 20" width={22} height={22}>
    <circle r="2.5" cy={10} cx={10} />
    <path fillRule="evenodd" d="m8.39079 2.80235c.53842-1.51424 2.67991-1.51424 3.21831-.00001.3392.95358 1.4284 1.40477 2.3425.97027 1.4514-.68995 2.9657.82427 2.2758 2.27575-.4345.91407.0166 2.00334.9702 2.34248 1.5143.53842 1.5143 2.67996 0 3.21836-.9536.3391-1.4047 1.4284-.9702 2.3425.6899 1.4514-.8244 2.9656-2.2758 2.2757-.9141-.4345-2.0033.0167-2.3425.9703-.5384 1.5142-2.67989 1.5142-3.21831 0-.33914-.9536-1.4284-1.4048-2.34247-.9703-1.45148.6899-2.96571-.8243-2.27575-2.2757.43449-.9141-.01669-2.0034-.97028-2.3425-1.51422-.5384-1.51422-2.67994.00001-3.21836.95358-.33914 1.40476-1.42841.97027-2.34248-.68996-1.45148.82427-2.9657 2.27575-2.27575.91407.4345 2.00333-.01669 2.34247-.97026z" clipRule="evenodd" />
  </svg>
)

const LogoutIcon = () => (
  <svg className="text-red-600" stroke="currentColor" strokeWidth={1.5} fill="none" viewBox="0 0 24 24" height={22} width={22}>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
    <path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
  </svg>
)

// ─── Zvoneček dropdown ────────────────────────────────────────────────────────

interface BellDropdownProps {
  open: boolean
  onClose: () => void
  invites: import('../hooks/useInvites').Invitation[]
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
      className="absolute right-0 top-12 z-50 w-80 card shadow-xl rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">Pozvánky</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse h-16 rounded-lg bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      )}

      {!loading && invites.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">Žádné nové pozvánky</p>
      )}

      {!loading && invites.map(inv => (
        <div key={inv.token} className="flex flex-col gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-sm font-medium">Pozvánka na jízdu</p>
          <p className="text-xs text-gray-500">{new Date(inv.created_at).toLocaleString('cs-CZ')}</p>
          <div className="flex gap-2 mt-1">
            <button
              disabled={responding === inv.token}
              onClick={() => onRespond(inv.token, true, inv.ride_id)}
              className="flex-1 text-sm py-1 px-3 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {responding === inv.token ? 'Zpracovávám...' : 'Přijmout'}
            </button>
            <button
              disabled={responding === inv.token}
              onClick={() => onRespond(inv.token, false, inv.ride_id)}
              className="flex-1 text-sm py-1 px-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition"
            >
              Odmítnout
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="absolute -top-1 -right-1 bg-violet-500 text-white rounded-full px-1.5 py-0.5 text-xs min-w-5 flex items-center justify-center">
      {count}
    </span>
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export default function Navigation() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [responding, setResponding] = useState<string | null>(null)
  const { invites, loading: invitesLoading, respondInvite } = useInvites()  // ✅ jediná instance
  const { fetchRide } = useRide()

  const unreadCount = invites.filter(i => i.status === 'Pending').length

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    navigate('/login')
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
      <div className="navigation hidden md:flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button className="nav-button glass gap-0 group transition-all duration-300 ease-in hover:gap-2" onClick={() => navigate(-1)}>
            <ArrowLeftIcon />
            <span className="whitespace-nowrap max-w-0 overflow-hidden transition-all duration-300 ease-in group-hover:max-w-[100px]">Zpět</span>
          </button>
          <button className="nav-button glass hover:text-cyan-400" onClick={() => navigate('/rides')}>
            <RocketIcon />Jízdy
          </button>
          <button className="nav-button glass hover:text-violet-500" onClick={() => navigate('/rides')}>
            <SeatIcon />Moje jízdy
          </button>
          <button className="nav-button glass hover:text-fuchsia-500" onClick={() => navigate('/cars')}>
            <CarIcon /><span>Moje auto</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setBellOpen(o => !o)} className="nav-button p-0 glass rounded-full w-9 h-9 flex items-center justify-center relative">
              <FiBell className="text-sky-500" size={20} />
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
          <button className="nav-button p-0 glass rounded-full w-9 h-9 flex items-center justify-center hover:text-sky-800" onClick={() => navigate('/settings')}>
            <SettingsIcon />
          </button>
          <button className="nav-button glass gap-0 group transition-all duration-300 ease-in hover:gap-2 hover:text-red-600" onClick={handleLogout}>
            <LogoutIcon />
            <span className="whitespace-nowrap max-w-0 overflow-hidden transition-all duration-300 ease-in group-hover:max-w-[100px]">Odhlásit se</span>
          </button>
        </div>
      </div>

      {/* ── Mobilní ── */}
      <div className="top-0 left-0 w-full z-50 max-w-screen-xl flex flex-wrap items-center justify-between p-4 md:hidden">
        <Link to="/rides" className="flex items-center space-x-3">
          <span className="text-3xl font-semibold text-gray-700 dark:text-gray-200">Sitzy</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative" onClick={() => setBellOpen(o => !o)}>
              <FiBell size={20} />
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
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-default"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={1.5} fill="none" viewBox="0 0 17 14">
              <path d="M1 1h15M1 7h15M1 13h15" />
            </svg>
          </button>
        </div>

        <div className={`top-16 left-0 w-full z-50 ${menuOpen ? '' : 'hidden'}`} id="mobile-menu">
          <ul className="font-medium flex flex-col gap-2 p-4 mt-4 rounded-xl card">
            <li><Link to="/rides" className="inline-flex items-center gap-2 py-2 px-3 rounded-md" onClick={() => setMenuOpen(false)}><RocketIcon />Jízdy</Link></li>
            <hr className="border-gray-200 dark:border-gray-700" />
            <li><Link to="/rides" className="inline-flex items-center gap-2 py-2 px-3 rounded-md" onClick={() => setMenuOpen(false)}><SeatIcon />Moje jízdy</Link></li>
            <hr className="border-gray-200 dark:border-gray-700" />
            <li><Link to="/cars" className="inline-flex items-center gap-2 py-2 px-3 rounded-md" onClick={() => setMenuOpen(false)}><CarIcon />Moje auto</Link></li>
            <hr className="border-gray-200 dark:border-gray-700" />
            <li><Link to="/settings" className="inline-flex items-center gap-2 py-2 px-3 rounded-md" onClick={() => setMenuOpen(false)}><SettingsIcon />Nastavení</Link></li>
            <hr className="border-gray-200 dark:border-gray-700" />
            <li>
              <button onClick={handleLogout} className="inline-flex items-center gap-2 py-2 px-3 rounded-md w-full">
                <LogoutIcon />Odhlásit se
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
