import { useEffect, useRef, useState } from 'react'
import RideStatus from '../components/RideStatus'
import instance from '../api/axios'
import { useNavigate } from 'react-router'
import Loader from '../components/Loader';
import { WarningDialog } from '../components/Dialog';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { isAxiosError } from 'axios';
import { useCar } from '../hooks/useCar';

export default function DashboardPage() {
  const [error, setError] = useState('')
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  
  const { car, fetchMyCar } = useCar()

  useEffect(() => {
    const axios = instance

    setLoading(true);
    setError('');
    Promise.all([
      axios
        .get('http://localhost:8000/auth/me')
        .then((res: { data: { email: string } | null }) => {
          setUser(res.data);
        })
        .catch((err: unknown) => {
          if (isAxiosError(err)) {
            setError(err.response?.data?.message ?? "Uživatel nebyl nalezen");
            setUser(null);
          } else {
            setError("Nastala neočekávaná chyba");
          }
        }),
      fetchMyCar()
        .catch((err: unknown) => {
          if (isAxiosError(err)) {
            setError(err.response?.data?.message ?? "Auto nebylo nalezeno");
          } else {
            setError("Nastala neočekávaná chyba");
          }
        })
    ]).finally(() => {
      setLoading(false)
    })
  }, [navigate, fetchMyCar])

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

  if (loading) {
    return <Loader />
  }

  if (user === null) {
    toggleDialog();
  }

  if (car === null) {
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
                    <p className="text-gray-600 mb-4">
                      Nemáte zatím žádné auto. Můžete vytvořit vlastní jízdu nebo zkontrolovat pozvánky v notifikacích.
                    </p>
                    <div className="flex flex-col gap-3">
                      <button 
                        className="primary-button"
                        onClick={() => navigate('/create-car')}
                      >
                        Vytvořit jízdu
                      </button>
                    </div>
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
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-lg text-indigo-600 mt-1">
                          {new Date(car.date).toLocaleDateString('cs-CZ', {
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
