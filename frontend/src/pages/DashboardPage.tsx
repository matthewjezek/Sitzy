import { useEffect, useRef, useState } from 'react'
import RideStatus from '../components/RideStatus'
import instance from '../api/axios'
import { useNavigate } from 'react-router'
import Loader from '../components/Loader';
import { WarningDialog } from '../components/Dialog';
import { FiCalendar, FiUser } from 'react-icons/fi';

interface Seat {
  position: number;
  position_label?: string;
  user_name?: string;
}

interface Invitation {
  id: number;
  invited_email: string;
  status_label: string;
}

interface Car {
  id: number;
  name: string;
  date: string;
  layout: string;
  invitations: Invitation[];
  seats: Seat[];
}

export default function DashboardPage() {
  const [error, setError] = useState('')
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [userNotFound, setUserNotFound] = useState(false)
  const [carNotFound, setCarNotFound] = useState(false)
  const navigate = useNavigate()
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  // `instance` and `localStorage` are stable and do not change between renders, so it's safe to only include `navigate` in the dependency array.
  useEffect(() => {
    const axios = instance
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true);
    setError('');
    Promise.all([
      axios
        .get('http://localhost:8000/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res: { data: { email: string } | null }) => {
          setUser(res.data);
          setUserNotFound(false);
        })
        .catch(() => {
          setUser(null);
          setUserNotFound(true);
          setError("Uživatel nebyl nalezen");
        }),
      axios
        .get('http://localhost:8000/cars/my', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res: { data: Car | null }) => {
          setCar(res.data);
          setCarNotFound(false);
        })
        .catch(() => {
          setCar(null);
          setCarNotFound(true);
          setError("Auto nebylo nalezeno");
        })
    ]).finally(() => {
      setLoading(false)
    })
  }, [navigate])

  function toggleDialog() {
    if (!dialogRef.current) {
      return;
    }
    if (dialogRef.current.hasAttribute('open')) {
      dialogRef.current.close();
    } else {
      dialogRef.current.showModal();
    }
  }

  if (loading && !userNotFound && !carNotFound) {
    return <Loader />
  }

  if (userNotFound || error === "Uživatel nebyl nalezen") {
    toggleDialog();
  }

  if (carNotFound || error === "Auto nebylo nalezeno") {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="main-card">
            <div className="main-card-header">
              <h1 className="text-2xl font-bold">Vítejte v Sitzy</h1>
            </div>
            <div className="main-card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="info-card">
                  <div className="info-card-header">
                    <div className="info-card-icon">
                      <FiUser size={20} className="text-white" />
                    </div>
                    <h3 className="info-card-title">{user?.email}</h3>
                  </div>
                  <div className="info-card-content">
                    {/* Content */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!car) {
    return null
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="main-card">
          <div className="main-card-header">
            <h1 className="text-2xl font-bold">Vítejte v Sitzy</h1>
          </div>
          <div className="main-card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">
                    <FiUser size={20} className="text-white" />
                  </div>
                  <h3 className="info-card-title">{user?.email}</h3>
                </div>
                <div className="info-card-content">
                  {/* Content */}
                </div>
              </div>
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">
                    <FiCalendar size={20} className="text-white" />
                  </div>
                  <h3 className="info-card-title">Datum jízdy</h3>
                </div>
                <div className="info-card-content">
                  <div>
                    {car.date && !isNaN(new Date(car.date).getTime()) ? (
                      <div>
                        <div className="text-4xl font-bold text-indigo-900">
                          {new Date(car.date).toLocaleString('cs-CZ', {
                            timeZone: localTimezone,
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-lg text-indigo-600 mt-1">
                          {new Date(car.date).toLocaleDateString('cs-CZ', {
                            timeZone: localTimezone,
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-indigo-700">Neznámé datum</span>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:text-left">
                    <RideStatus date={car.date} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <WarningDialog toggle={toggleDialog} ref={dialogRef}>
          <span className="dialog-title">{error}</span>
          <p className="dialog-message">
            Omlouváme se, ale nebyli jsme schopni najít uživatele s touto e-mailovou adresou.
          </p>
        </WarningDialog>
      </div>
    </div>
  )
}
