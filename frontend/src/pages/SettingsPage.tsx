import { useEffect, useState } from 'react';
import { FiUser, FiMoon, FiSun, FiLogOut, FiShield } from 'react-icons/fi';
import { FaFacebook, FaXTwitter } from 'react-icons/fa6';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import instance from '../api/axios';
import Loader from '../components/Loader';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  provider: 'facebook' | 'x';
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );
  const navigate = useNavigate();

  useEffect(() => {
    instance
      .get<User>('/auth/me')
      .then(res => setUser(res.data))
      .catch(err => {
        const msg = isAxiosError(err)
          ? (err.response?.data?.detail ?? 'Nepodařilo se načíst profil.')
          : 'Nastala neočekávaná chyba.'
        toast.error(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  const handleLogout = async () => {
    try {
      await instance.post('/auth/revoke')
    } catch {
      // Backend cookie je smazán i při chybě – pokračujeme
    }
    localStorage.removeItem('access_token')
    toast.success('Byl jsi odhlášen.')
    navigate('/login')
  }

  if (loading) return <Loader />

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="main-card">
          <div className="main-card-header">
            <h1 className="text-2xl font-bold">Nastavení</h1>
            {user?.full_name && (
              <p className="text-violet-200 mt-1">{user.full_name}</p>
            )}
          </div>
          <div className="main-card-body">

            {/* Profil */}
            <div className="settings-section">
              <div className="settings-section-header">
                <FiUser size={20} className="text-violet-500" />
                <h2 className="settings-section-title">Profil</h2>
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  className="form-input"
                  type="text"
                  value={user?.email ?? ''}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registrován</label>
                <input
                  className="form-input"
                  type="text"
                  value={
                    user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('cs-CZ', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : ''
                  }
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Přihlášení přes</label>
                <div className="flex items-center gap-2 mt-1">
                  {user?.provider === 'facebook' ? (
                    <>
                      <FaFacebook size={20} className="text-blue-600" />
                      <span className="font-medium text-blue-600">Facebook</span>
                    </>
                  ) : (
                    <>
                      <FaXTwitter size={20} className="dark:text-white text-gray-900" />
                      <span className="font-medium dark:text-white text-gray-900">X</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Vzhled */}
            <div className="settings-section">
              <div className="settings-section-header">
                {darkMode ? (
                  <FiMoon size={20} className="text-violet-500" />
                ) : (
                  <FiSun size={20} className="text-violet-500" />
                )}
                <h2 className="settings-section-title">Vzhled</h2>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium dark:text-gray-100 text-gray-800">
                    Tmavý režim
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Přepíná mezi světlým a tmavým vzhledem
                  </p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    darkMode ? 'bg-violet-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={darkMode}
                  title="Přepnout tmavý režim"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Bezpečnost */}
            <div className="settings-section">
              <div className="settings-section-header">
                <FiShield size={20} className="text-violet-500" />
                <h2 className="settings-section-title">Bezpečnost</h2>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
              >
                <FiLogOut size={18} />
                Odhlásit se
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}